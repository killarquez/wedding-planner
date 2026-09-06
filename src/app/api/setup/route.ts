import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';
import { sendDiscordBudgetSetupAlert } from '@/lib/alerts/discord';

export async function GET() {
  try {
    const settings = await WeddingDB.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.categories) {
      return NextResponse.json({ error: 'Valid wedding setup payload is required' }, { status: 400 });
    }

    const result = await WeddingDB.saveSettings({
      ...body,
      setup_completed: true
    });

    // Notify #wedding-ledger channel in Discord
    sendDiscordBudgetSetupAlert(body, result.metrics).catch(e =>
      console.error('[API Setup] Failed to send Discord ledger alert:', e)
    );

    return NextResponse.json({
      success: true,
      message: 'Wedding setup and true budget values saved successfully',
      ...result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
