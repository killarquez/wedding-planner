import { NextRequest, NextResponse } from 'next/server';
import { WeddingDB } from '@/lib/db';

export async function GET() {
  try {
    const expenses = WeddingDB.getExpenses();
    const metrics = WeddingDB.getBudgetMetrics();
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

    const expense = WeddingDB.addExpense({
      category,
      vendor_name,
      item_description: item_description || '',
      estimated_cost: Number(estimated_cost || 0),
      actual_invoiced: Number(actual_invoiced || estimated_cost || 0),
      deposit_paid: Number(deposit_paid || 0),
      payment_due_date,
      payment_status: payment_status || 'pending',
      notes
    });

    const metrics = WeddingDB.getBudgetMetrics();
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

    const updated = WeddingDB.updateExpense(id, updates);
    const metrics = WeddingDB.getBudgetMetrics();
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

    const deleted = WeddingDB.deleteExpense(id);
    const metrics = WeddingDB.getBudgetMetrics();
    return NextResponse.json({ success: deleted, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
