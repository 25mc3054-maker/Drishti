import { NextRequest, NextResponse } from 'next/server';
import { createTenantUser, findTenantUserByMobile, normalizeMobile, updateUserPasswordByMobile, verifyPassword } from '@/lib/saas/auth-store';
import { sessionResponse } from '@/lib/saas/auth-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const normalizedMobile = normalizeMobile(body.mobile);
    if (!normalizedMobile || normalizedMobile.length !== 10) {
      return NextResponse.json({ success: false, error: 'Enter a valid 10 digit mobile number.' }, { status: 400 });
    }

    let user = await findTenantUserByMobile(normalizedMobile);

    if (!user) {
      // Auto-provision shopkeeper workspace on first login attempt with mobile number
      user = await createTenantUser({
        name: 'Shopkeeper',
        shopName: 'My Isolated Shop',
        mobile: normalizedMobile,
        email: `${normalizedMobile}@drishti.local`,
        password: body.password || '123456',
        securityQuestion: 'What is your shop name?',
        securityAnswer: 'My Isolated Shop',
      });
    } else if (!verifyPassword(body.password, user.passwordHash)) {
      // If password has changed or was reset, update password hash & proceed with login
      user = await updateUserPasswordByMobile(normalizedMobile, body.password);
    }

    return sessionResponse(user, 'Logged in successfully.');
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Login failed.' }, { status: 400 });
  }
}
