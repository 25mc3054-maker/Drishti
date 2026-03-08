import { NextRequest, NextResponse } from 'next/server';
import {
  deleteShopEntity,
  listShopEntities,
  newEntityId,
  putShopEntity,
} from '@/lib/dynamodb-shop';

const ENTITY = 'task';

export async function GET() {
  const tasks = await listShopEntities(ENTITY);
  return NextResponse.json({ success: true, tasks });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });
    }

    const task = {
      id: newEntityId(),
      title: String(body.title).trim(),
      dueDate: body.dueDate || '',
      priority: body.priority || 'medium',
      done: false,
      createdAt: new Date().toISOString(),
    };

    const saved = await putShopEntity(ENTITY, task.id, task);
    return NextResponse.json({ success: true, task: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const updated = await putShopEntity(ENTITY, body.id, body);
    return NextResponse.json({ success: true, task: updated });
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
