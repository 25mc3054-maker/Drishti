import { NextRequest, NextResponse } from 'next/server';
import { findTenantUserByMobile, verifyPassword } from '@/lib/saas/auth-store';
import { sessionResponse } from '@/lib/saas/auth-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await findTenantUserByMobile(body.mobile);
    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return NextResponse.json({ success: false, error: 'Invalid mobile number or password.' }, { status: 401 });
    }
    return sessionResponse(user, 'Logged in.');
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Login failed.' }, { status: 400 });
  }
}
