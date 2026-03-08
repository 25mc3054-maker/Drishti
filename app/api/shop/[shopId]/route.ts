import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const ITEMS_DATA_PATH = path.join(process.cwd(), 'data', 'items.json');
const STOREFRONT_DATA_PATH = path.join(process.cwd(), 'data', 'storefront.json');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ShopData {
  products: any[];
  shopInfo: any;
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    // For now, return data from shared files
    // In production, you'd filter by shopId from database
    const items = await readJsonFile<any[]>(ITEMS_DATA_PATH, []);
    const storefront = await readJsonFile<any>(STOREFRONT_DATA_PATH, null);

    const shopData: ShopData = {
      products: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        category: item.category || 'General',
        description: item.description || `High-quality ${item.name}`,
        image: item.image || '',
      })),
      shopInfo: storefront ? {
        shopName: storefront.shopName,
        tagline: storefront.tagline,
        ownerLogin: storefront.ownerLogin,
        operationGuide: storefront.operationGuide || [],
      } : {
        shopName: 'My Shop',
        tagline: 'Your trusted local shop',
        ownerLogin: 'shop@example.com',
        operationGuide: [],
      },
    };

    return NextResponse.json(shopData);
  } catch (error) {
    console.error('Error fetching shop data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop data' },
      { status: 500 }
    );
  }
}
