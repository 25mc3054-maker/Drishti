import { NextRequest, NextResponse } from 'next/server';
import {
  deleteShopEntity,
  listShopEntities,
  newEntityId,
  putShopEntity,
} from '@/lib/dynamodb-shop';

const ENTITY = 'supplier';

export async function GET() {
  const suppliers = await listShopEntities(ENTITY);
  return NextResponse.json({ success: true, suppliers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.phone) {
      return NextResponse.json({ success: false, error: 'name and phone are required' }, { status: 400 });
    }

    const supplier = {
      id: newEntityId(),
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      products: body.products || '',
      leadTimeDays: Number(body.leadTimeDays || 0),
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    };

    const saved = await putShopEntity(ENTITY, supplier.id, supplier);
    return NextResponse.json({ success: true, supplier: saved });
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
