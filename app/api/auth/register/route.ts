import { NextRequest, NextResponse } from 'next/server';
import { createTenantUser } from '@/lib/saas/auth-store';
import { sessionResponse } from '@/lib/saas/auth-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await createTenantUser({
      name: body.name,
      shopName: body.shopName,
      mobile: body.mobile,
      email: body.email,
      password: body.password,
    });
    return sessionResponse(user, 'Shopkeeper account created.');
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Registration failed.' }, { status: 400 });
  }
}
