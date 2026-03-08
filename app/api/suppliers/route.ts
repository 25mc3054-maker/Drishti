import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Use /tmp for Vercel, data folder for local
const isProduction = process.env.VERCEL === '1';
const DATA_DIR = isProduction ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_PATH = path.join(DATA_DIR, 'suppliers.json');

async function readSuppliers() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

async function writeSuppliers(suppliers: any[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(suppliers, null, 2), 'utf8');
}

export async function GET() {
  const suppliers = await readSuppliers();
  return NextResponse.json({ success: true, suppliers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.phone) {
      return NextResponse.json({ success: false, error: 'name and phone are required' }, { status: 400 });
    }

    const suppliers = await readSuppliers();
    const supplier = {
      id: Date.now().toString(),
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      products: body.products || '',
      leadTimeDays: Number(body.leadTimeDays || 0),
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    };
    suppliers.unshift(supplier);
    await writeSuppliers(suppliers);
    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const suppliers = await readSuppliers();
    await writeSuppliers(suppliers.filter((s: any) => s.id !== id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
