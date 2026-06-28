import { NextRequest, NextResponse } from 'next/server';
import { tenantFromRequest } from '@/lib/saas/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ctx = tenantFromRequest(req);
    return NextResponse.json({
      success: true,
      user: {
        id: ctx.userId,
        tenantId: ctx.tenantId,
        role: ctx.role,
        name: ctx.name,
        shopName: ctx.shopName,
        mobile: ctx.mobile,
        email: ctx.email,
      },
      permissions: ctx.permissions,
    });
  } catch {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}
