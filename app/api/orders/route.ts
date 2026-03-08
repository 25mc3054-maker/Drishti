import { NextRequest, NextResponse } from 'next/server';
import {
  listShopEntities,
  newEntityId,
  putShopEntity,
} from '@/lib/dynamodb-shop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ENTITY = 'order';

interface Order {
  id: string;
  shopId: string;
  shopName: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newOrder: Order = {
      id: newEntityId(),
      shopId: body.shopId,
      shopName: body.shopName,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      items: body.items,
      totalAmount: body.totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await putShopEntity(ENTITY, newOrder.id, newOrder as any);

    console.log('Order saved:', newOrder.id);

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      message: 'Order placed successfully',
    });
  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json(
      { error: 'Failed to place order' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const orders = await listShopEntities<Order>(ENTITY);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const orders = await listShopEntities<Order>(ENTITY);
    const existing = orders.find((order) => order.id === orderId);
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = {
      ...existing,
      status,
    };
    await putShopEntity(ENTITY, orderId, updated as any);

    console.log('Order status updated:', orderId, 'to', status);

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updated,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
