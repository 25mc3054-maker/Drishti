import { NextRequest, NextResponse } from 'next/server';
import { findTenantUserByMobile, normalizeMobile } from '@/lib/saas/auth-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const normalizedMobile = normalizeMobile(body?.mobile);
    if (!normalizedMobile || normalizedMobile.length !== 10) {
      return NextResponse.json({ success: false, exists: false, error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const user = await findTenantUserByMobile(normalizedMobile);
    if (user) {
      return NextResponse.json({
        success: true,
        exists: true,
        name: user.name || 'Shopkeeper',
        shopName: user.shopName || 'Shop',
      });
    }

    return NextResponse.json({
      success: true,
      exists: false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, exists: false, error: error.message || 'Check failed.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mobileParam = searchParams.get('mobile') || '';
    const normalizedMobile = normalizeMobile(mobileParam);
    if (!normalizedMobile || normalizedMobile.length !== 10) {
      return NextResponse.json({ success: false, exists: false, error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    const user = await findTenantUserByMobile(normalizedMobile);
    if (user) {
      return NextResponse.json({
        success: true,
        exists: true,
        name: user.name || 'Shopkeeper',
        shopName: user.shopName || 'Shop',
      });
    }

    return NextResponse.json({
      success: true,
      exists: false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, exists: false, error: error.message || 'Check failed.' }, { status: 500 });
  }
}
