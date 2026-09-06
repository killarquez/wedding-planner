import { NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';

export async function POST() {
  try {
    const fresh = await WeddingDB.resetToSeed();
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

export async function DELETE() {
  try {
    const result = await WeddingDB.clearAllGuestsAndParties();
    return NextResponse.json({
      success: true,
      message: 'All temporary guests, parties, song requests, expenses, and milestones successfully purged',
      ...result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

