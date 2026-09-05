import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('debug') === '1') {
      const isConfigured = WeddingDB.isSupabaseConfigured();
      let error = null;
      let count = null;
      try {
        const { SupabaseService } = await import('@/lib/supabase/service');
        const parties = await SupabaseService.getParties();
        count = parties.length;
      } catch (e: any) {
        error = e.message;
      }
      return NextResponse.json({
        isConfigured,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 35) : null,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        anonKeyLen: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        count,
        error
      });
    }

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
