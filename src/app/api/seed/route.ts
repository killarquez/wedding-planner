import { NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Demo seed resetting is permanently disabled to protect live wedding data.'
    },
    { status: 403 }
  );
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

