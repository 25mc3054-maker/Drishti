import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Use /tmp for Vercel, data folder for local
const isProduction = process.env.VERCEL === '1';
const DATA_DIR = isProduction ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_PATH = path.join(DATA_DIR, 'items.json');

async function readItems() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

async function writeItems(items: any[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
}

export async function GET() {
  const items = await readItems();
  return NextResponse.json({ success: true, items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = await readItems();
    const id = Date.now().toString();
    const newItem = { id, ...body };
    items.push(newItem);
    await writeItems(items);
    return NextResponse.json({ success: true, item: newItem });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const items = await readItems();
    const idx = items.findIndex((i: any) => i.id === body.id);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    items[idx] = { ...items[idx], ...body };
    await writeItems(items);
    return NextResponse.json({ success: true, item: items[idx] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    const items = await readItems();
    const filtered = items.filter((i: any) => i.id !== id);
    await writeItems(filtered);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
