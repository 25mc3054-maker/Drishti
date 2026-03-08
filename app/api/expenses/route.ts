import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'expenses.json');

async function readExpenses() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

async function writeExpenses(expenses: any[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(expenses, null, 2), 'utf8');
}

export async function GET() {
  const expenses = await readExpenses();
  return NextResponse.json({ success: true, expenses });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.amount || !body.category) {
      return NextResponse.json({ success: false, error: 'title, amount, category are required' }, { status: 400 });
    }

    const expenses = await readExpenses();
    const expense = {
      id: Date.now().toString(),
      title: String(body.title).trim(),
      amount: Number(body.amount),
      category: String(body.category).trim(),
      date: body.date || new Date().toISOString(),
      note: body.note || '',
      createdAt: new Date().toISOString(),
    };
    expenses.unshift(expense);
    await writeExpenses(expenses);
    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const expenses = await readExpenses();
    await writeExpenses(expenses.filter((e: any) => e.id !== id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
