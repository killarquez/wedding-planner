import { NextRequest, NextResponse } from 'next/server';
import { DeadlinesChaserAgent } from '@/lib/agents/chaserAgent';
import { WeddingDB } from '@/lib/db';

export async function GET() {
  try {
    const briefing = await WeddingDB.generateDailyBriefing();
    const logs = WeddingDB.getAgentLogs();
    return NextResponse.json({ briefing, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const report = await DeadlinesChaserAgent.runChaserAndBriefingSimulation();
    return NextResponse.json({ success: true, ...report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
