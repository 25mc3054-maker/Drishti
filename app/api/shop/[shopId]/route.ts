import { NextResponse } from 'next/server';
import { getSingletonEntity, listShopEntities } from '@/lib/dynamodb-shop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ShopData {
  products: any[];
  shopInfo: any;
}

export async function GET() {
  try {
    const items = await listShopEntities<any>('item');
    const storefront = await getSingletonEntity<any>('storefront');

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
