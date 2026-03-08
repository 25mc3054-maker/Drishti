import { NextRequest, NextResponse } from 'next/server';
import {
  deleteShopEntity,
  listShopEntities,
  newEntityId,
  putShopEntity,
} from '@/lib/dynamodb-shop';

const ENTITY = 'expense';

export async function GET() {
  const expenses = await listShopEntities(ENTITY);
  return NextResponse.json({ success: true, expenses });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.amount || !body.category) {
      return NextResponse.json({ success: false, error: 'title, amount, category are required' }, { status: 400 });
    }

    const expense = {
      id: newEntityId(),
      title: String(body.title).trim(),
      amount: Number(body.amount),
      category: String(body.category).trim(),
      date: body.date || new Date().toISOString(),
      note: body.note || '',
      createdAt: new Date().toISOString(),
    };

    const saved = await putShopEntity(ENTITY, expense.id, expense);
    return NextResponse.json({ success: true, expense: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    await deleteShopEntity(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
