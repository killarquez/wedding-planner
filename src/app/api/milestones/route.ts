import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';

export async function GET() {
  try {
    const milestones = WeddingDB.getMilestones();
    return NextResponse.json({ milestones });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title_en, title_vi, category, target_date, status, priority, assignee, cultural_notes } = body;

    if (!title_en || !target_date) {
      return NextResponse.json({ error: 'Title and target date are required' }, { status: 400 });
    }

    const milestone = WeddingDB.addMilestone({
      title_en,
      title_vi: title_vi || title_en,
      category: category || 'ceremony',
      target_date,
      status: status || 'pending',
      priority: priority || 'medium',
      assignee: assignee || 'Trang & Alfredo',
      cultural_notes
    });

    return NextResponse.json({ success: true, milestone });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    const updated = WeddingDB.updateMilestone(id, updates);
    return NextResponse.json({ success: true, milestone: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
