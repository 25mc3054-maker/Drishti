import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Use /tmp for Vercel, data folder for local
const isProduction = process.env.VERCEL === '1';
const DATA_DIR = isProduction ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_PATH = path.join(DATA_DIR, 'customers.json');

async function readCustomers() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

async function writeCustomers(customers: any[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(customers, null, 2), 'utf8');
}

export async function GET(req: NextRequest) {
  const customers = await readCustomers();
  const customerId = new URL(req.url).searchParams.get('id');

  if (customerId) {
    const customer = customers.find((entry: any) => entry.id === customerId);
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

    const customers = await readCustomers();
    const existing = customers.find((entry: any) => entry.phone === body.phone);

    if (existing) {
      return NextResponse.json({ success: true, customer: existing });
    }

    const customer = {
      id: Date.now().toString(),
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      email: body.email ? String(body.email).trim() : '',
      address: body.address ? String(body.address).trim() : '',
      loyaltyPoints: Number(body.loyaltyPoints || 0),
      totalSpent: Number(body.totalSpent || 0),
      purchaseCount: Number(body.purchaseCount || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    customers.push(customer);
    await writeCustomers(customers);

    return NextResponse.json({ success: true, customer });
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

    const customers = await readCustomers();
    const index = customers.findIndex((entry: any) => entry.id === body.id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    customers[index] = {
      ...customers[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await writeCustomers(customers);

    return NextResponse.json({ success: true, customer: customers[index] });
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

    const customers = await readCustomers();
    const filtered = customers.filter((entry: any) => entry.id !== id);
    await writeCustomers(filtered);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
