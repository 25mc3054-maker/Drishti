import { NextRequest, NextResponse } from 'next/server';
import {
  deleteShopEntity,
  listShopEntities,
  newEntityId,
  putShopEntity,
} from '@/lib/dynamodb-shop';

const ENTITY = 'item';

export async function GET() {
  const items = await listShopEntities(ENTITY);
  return NextResponse.json({ success: true, items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = newEntityId();
    const newItem = await putShopEntity(ENTITY, id, body || {});
    return NextResponse.json({ success: true, item: newItem });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const updated = await putShopEntity(ENTITY, body.id, body);
    return NextResponse.json({ success: true, item: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    await deleteShopEntity(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
