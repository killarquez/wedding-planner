import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';
import { sendDiscordLedgerAlert } from '@/lib/alerts/discord';

export async function GET() {
  try {
    const expenses = await WeddingDB.getExpenses();
    const metrics = await WeddingDB.getBudgetMetrics();
    return NextResponse.json({ expenses, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      category,
      vendor_name,
      item_description,
      estimated_cost,
      actual_invoiced,
      deposit_paid,
      payment_due_date,
      payment_status,
      notes
    } = body;

    if (!category || !vendor_name || !payment_due_date) {
      return NextResponse.json(
        { error: 'Category, vendor name, and payment due date are required' },
        { status: 400 }
      );
    }

    const expense = await WeddingDB.addExpense({
      category,
      vendor_name,
      item_description: item_description || '',
      estimated_cost: Number(estimated_cost || 0),
      actual_invoiced: Number(actual_invoiced || estimated_cost || 0),
      deposit_paid: Number(deposit_paid || 0),
      remaining_balance: Number(actual_invoiced || estimated_cost || 0) - Number(deposit_paid || 0),
      payment_due_date,
      payment_status: payment_status || 'pending',
      notes
    });

    const metrics = await WeddingDB.getBudgetMetrics();

    // Asynchronously notify #wedding-ledger Discord channel
    sendDiscordLedgerAlert({
      action: Number(deposit_paid || 0) > 0 ? 'paid' : 'created',
      expense,
      metrics
    }).catch(e => console.error('[API Budget] Error sending Discord alert:', e));

    return NextResponse.json({ success: true, expense, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const updated = await WeddingDB.updateExpense(id, updates);
    const metrics = await WeddingDB.getBudgetMetrics();

    // Asynchronously notify #wedding-ledger Discord channel
    if (updated) {
      sendDiscordLedgerAlert({
        action: updates.payment_status === 'paid' || (updates.deposit_paid && Number(updates.deposit_paid) > 0) ? 'paid' : 'updated',
        expense: updated,
        metrics
      }).catch(e => console.error('[API Budget] Error sending Discord alert:', e));
    }

    return NextResponse.json({ success: true, expense: updated, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const deleted = await WeddingDB.deleteExpense(id);
    const metrics = await WeddingDB.getBudgetMetrics();

    if (deleted) {
      sendDiscordLedgerAlert({
        action: 'deleted',
        expense: { id, vendor_name: `Expense #${id}` },
        metrics
      }).catch(e => console.error('[API Budget] Error sending Discord alert:', e));
    }

    return NextResponse.json({ success: deleted, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
