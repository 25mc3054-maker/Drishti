import { NextRequest, NextResponse } from 'next/server';
import {
  deleteShopEntity,
  getShopEntityById,
  listShopEntities,
  newEntityId,
  putShopEntity,
} from '@/lib/dynamodb-shop';

const ENTITY = 'customer';

export async function GET(req: NextRequest) {
  const customers = await listShopEntities(ENTITY);
  const customerId = new URL(req.url).searchParams.get('id');

  if (customerId) {
    const customer = await getShopEntityById(customerId);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, customer });
  }

  return NextResponse.json({ success: true, customers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.phone) {
      return NextResponse.json({ success: false, error: 'Name and phone are required' }, { status: 400 });
    }

    const customers = await listShopEntities(ENTITY);
    const existing = customers.find((entry: any) => entry.phone === body.phone);

    if (existing) {
      return NextResponse.json({ success: true, customer: existing });
    }

    const customer = {
      id: newEntityId(),
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      email: body.email ? String(body.email).trim() : '',
      address: body.address ? String(body.address).trim() : '',
      loyaltyPoints: Number(body.loyaltyPoints || 0),
      totalSpent: Number(body.totalSpent || 0),
      purchaseCount: Number(body.purchaseCount || 0),
      createdAt: new Date().toISOString(),
    };

    const saved = await putShopEntity(ENTITY, customer.id, customer);

    return NextResponse.json({ success: true, customer: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Customer id is required' }, { status: 400 });
    }

    const existing = await getShopEntityById(body.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }
    const updated = await putShopEntity(ENTITY, body.id, { ...existing, ...body });
    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Customer id is required' }, { status: 400 });
    }

    await deleteShopEntity(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
