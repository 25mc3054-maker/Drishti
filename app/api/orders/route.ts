import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Use /tmp for Vercel, data folder for local
const isProduction = process.env.VERCEL === '1';
const DATA_DIR = isProduction ? '/tmp' : path.join(process.cwd(), 'data');
const ORDERS_DATA_PATH = path.join(DATA_DIR, 'orders.json');

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

async function readOrders(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(ORDERS_DATA_PATH, 'utf8');
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

async function saveOrders(orders: Order[]): Promise<void> {
  await fs.writeFile(ORDERS_DATA_PATH, JSON.stringify(orders, null, 2), 'utf8');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newOrder: Order = {
      id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
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

    const orders = await readOrders();
    orders.push(newOrder);
    await saveOrders(orders);

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
    const orders = await readOrders();
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

    const orders = await readOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);

    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    orders[orderIndex].status = status;
    await saveOrders(orders);

    console.log('Order status updated:', orderId, 'to', status);

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: orders[orderIndex],
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
