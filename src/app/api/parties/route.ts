import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || searchParams.get('code') || searchParams.get('phone');

    if (query) {
      const result = WeddingDB.getPartyByCodeOrPhone(query);
      if (!result) {
        return NextResponse.json({ error: 'Party or invitation code not found' }, { status: 404 });
      }
      return NextResponse.json(result);
    }

    const parties = WeddingDB.getPartiesWithGuests();
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

      const result = WeddingDB.bulkImportParties(body.rows);
      return NextResponse.json({ success: true, ...result });
    }

    if (!body.primary_guest_name || !body.primary_guest_name.trim()) {
      return NextResponse.json({ error: 'Primary guest or party name is required' }, { status: 400 });
    }

    const result = WeddingDB.createParty({
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

    const deleted = WeddingDB.deleteParty(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
