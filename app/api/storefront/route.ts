import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ITEMS_DATA_PATH = path.join(process.cwd(), 'data', 'items.json');
const STOREFRONT_DATA_PATH = path.join(process.cwd(), 'data', 'storefront.json');

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const [items, storefront] = await Promise.all([
    readJsonFile<any[]>(ITEMS_DATA_PATH, []),
    readJsonFile<any | null>(STOREFRONT_DATA_PATH, null),
  ]);

  return NextResponse.json({
    success: true,
    storefront,
    items,
    storefrontReady: Boolean(storefront),
  });
}
