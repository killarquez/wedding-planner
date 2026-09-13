import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || searchParams.get('code') || searchParams.get('phone');

    if (query) {
      const result = await WeddingDB.getPartyByCodeOrPhone(query);
      if (!result) {
        return NextResponse.json({ error: 'Party or invitation code not found' }, { status: 404 });
      }
      return NextResponse.json(result);
    }

    const parties = await WeddingDB.getPartiesWithGuests();
    return NextResponse.json({ parties });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'bulk_import') {
      if (!Array.isArray(body.rows) || body.rows.length === 0) {
        return NextResponse.json({ error: 'No rows provided for bulk import' }, { status: 400 });
      }

      const result = await WeddingDB.bulkImportParties(body.rows);
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === 'split') {
      const {
        source_party_id,
        guest_ids,
        new_party_name,
        new_invitation_code,
        new_total_invited,
        updated_source_name,
        updated_source_invited
      } = body;

      if (!source_party_id || !Array.isArray(guest_ids) || guest_ids.length === 0) {
        return NextResponse.json(
          { error: 'Source party ID and at least 1 guest to move are required' },
          { status: 400 }
        );
      }

      if (!new_party_name || !new_invitation_code) {
        return NextResponse.json(
          { error: 'New party name and invitation code are required' },
          { status: 400 }
        );
      }

      const result = await WeddingDB.splitParty({
        sourcePartyId: source_party_id,
        guestIdsToMove: guest_ids,
        newPartyName: new_party_name,
        newInvitationCode: new_invitation_code,
        newTotalInvited: new_total_invited !== undefined ? Number(new_total_invited) : undefined,
        updatedSourceName: updated_source_name,
        updatedSourceInvited: updated_source_invited !== undefined ? Number(updated_source_invited) : undefined
      });

      return NextResponse.json({ success: true, ...result });
    }

    if (!body.primary_guest_name || !body.primary_guest_name.trim()) {
      return NextResponse.json({ error: 'Primary guest or party name is required' }, { status: 400 });
    }

    const result = await WeddingDB.createParty({
      primary_guest_name: body.primary_guest_name,
      contact_phone: body.contact_phone,
      contact_email: body.contact_email,
      total_invited: body.total_invited ? Number(body.total_invited) : undefined,
      invitation_code: body.invitation_code,
      guest_names: body.guest_names,
      relationship_tag: body.relationship_tag,
      notes: body.notes
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Party ID is required' }, { status: 400 });
    }

    const deleted = await WeddingDB.deleteParty(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Party ID is required' }, { status: 400 });
    }

    // Convert total_invited to number if provided
    if (updates.total_invited !== undefined) {
      updates.total_invited = Number(updates.total_invited);
    }

    const party = await WeddingDB.updateParty(id, updates);
    return NextResponse.json({ success: true, party });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
