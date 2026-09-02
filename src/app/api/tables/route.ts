import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';

export async function GET() {
  try {
    const tables = WeddingDB.getTablesWithGuests();
    const math = WeddingDB.getBanquetTableMath();
    return NextResponse.json({ tables, math });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, hierarchy_tag, capacity, guest_id, table_id } = body;

    // Action: Auto Assign All
    if (action === 'auto_assign') {
      const result = WeddingDB.autoAssignGuestsByHierarchy();
      const math = WeddingDB.getBanquetTableMath();
      return NextResponse.json({ success: true, ...result, math });
    }

    // Action: Assign single guest
    if (action === 'assign_guest') {
      if (!guest_id) {
        return NextResponse.json({ error: 'guest_id is required' }, { status: 400 });
      }
      WeddingDB.assignGuestToTable(guest_id, table_id || null);
      const tables = WeddingDB.getTablesWithGuests();
      const math = WeddingDB.getBanquetTableMath();
      return NextResponse.json({ success: true, tables, math });
    }

    // Default Action: Create new Table
    const newTable = WeddingDB.addTable(name, hierarchy_tag || 'general', capacity || 10);
    const tables = WeddingDB.getTablesWithGuests();
    const math = WeddingDB.getBanquetTableMath();

    return NextResponse.json({ success: true, table: newTable, tables, math });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Table ID is required' }, { status: 400 });
    }

    WeddingDB.deleteTable(id);
    const tables = WeddingDB.getTablesWithGuests();
    const math = WeddingDB.getBanquetTableMath();

    return NextResponse.json({ success: true, tables, math });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
