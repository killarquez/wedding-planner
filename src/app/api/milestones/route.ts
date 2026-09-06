import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';
import { sendDiscordMilestoneAlert } from '@/lib/alerts/discord';

export async function GET() {
  try {
    const milestones = await WeddingDB.getMilestones();
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

    const milestone = await WeddingDB.addMilestone({
      title_en,
      title_vi: title_vi || title_en,
      category: category || 'ceremony',
      target_date,
      status: status || 'pending',
      priority: priority || 'medium',
      assignee: assignee || 'Trang & Alfredo',
      cultural_notes
    });

    // Notify #wedding-milestones channel asynchronously
    WeddingDB.getMilestones().then(allMs => {
      const completedCount = allMs.filter(m => m.status === 'completed').length;
      sendDiscordMilestoneAlert({
        action: 'created',
        milestone,
        totalCompleted: completedCount,
        totalMilestones: allMs.length
      });
    }).catch(e => console.error('[API Milestones] Error sending Discord alert:', e));

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

    const updated = await WeddingDB.updateMilestone(id, updates);

    // Notify #wedding-milestones channel asynchronously
    if (updated) {
      WeddingDB.getMilestones().then(allMs => {
        const completedCount = allMs.filter(m => m.status === 'completed').length;
        const action = updates.status === 'completed'
          ? 'completed'
          : updates.status === 'in_progress'
          ? 'in_progress'
          : 'updated';

        sendDiscordMilestoneAlert({
          action,
          milestone: updated,
          totalCompleted: completedCount,
          totalMilestones: allMs.length
        });
      }).catch(e => console.error('[API Milestones] Error sending Discord alert:', e));
    }

    return NextResponse.json({ success: true, milestone: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
