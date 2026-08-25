import { NextRequest, NextResponse } from 'next/server';
import { findTenantUserByMobile, normalizeMobile, verifyPassword } from '@/lib/saas/auth-store';
import { sessionResponse } from '@/lib/saas/auth-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const normalizedMobile = normalizeMobile(body.mobile);
    if (!normalizedMobile || normalizedMobile.length !== 10) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const user = await findTenantUserByMobile(normalizedMobile);

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No registered account found with this mobile number. Please create an account by registering first.' 
      }, { status: 404 });
    }

    const isPasswordValid = verifyPassword(body.password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Incorrect password. Please enter the password you registered with.' 
      }, { status: 401 });
    }

    return sessionResponse(user, 'Logged in successfully.');
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Login failed.' }, { status: 400 });
  }
}

