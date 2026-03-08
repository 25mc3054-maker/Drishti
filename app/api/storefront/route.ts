import { NextResponse } from 'next/server';
import { getSingletonEntity, listShopEntities } from '@/lib/dynamodb-shop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const [items, storefront] = await Promise.all([
    listShopEntities<any>('item'),
    getSingletonEntity<any>('storefront'),
  ]);

  return NextResponse.json({
    success: true,
    storefront,
    items,
    storefrontReady: Boolean(storefront),
  });
}
