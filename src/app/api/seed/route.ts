import { NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';

export async function POST() {
  try {
    const fresh = WeddingDB.resetToSeed();
    return NextResponse.json({
      success: true,
      message: 'Database reset to initial wedding celebration state',
      partiesCount: fresh.parties.length,
      guestsCount: fresh.guests.length,
      tablesCount: fresh.tables.length,
      expensesCount: fresh.expenses.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
