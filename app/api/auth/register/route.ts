import { NextRequest, NextResponse } from 'next/server';
import { createTenantUser, normalizeMobile } from '@/lib/saas/auth-store';
import { sessionResponse } from '@/lib/saas/auth-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const normalizedMobile = normalizeMobile(body.mobile);
    if (!normalizedMobile || normalizedMobile.length !== 10) {
      return NextResponse.json({ success: false, error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json({ success: false, error: 'Please enter your full name.' }, { status: 400 });
    }

    if (!body.shopName || !String(body.shopName).trim()) {
      return NextResponse.json({ success: false, error: 'Please enter your shop name.' }, { status: 400 });
    }

    if (!body.password || typeof body.password !== 'string' || body.password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    if (!body.securityQuestion) {
      return NextResponse.json({ success: false, error: 'Please select a security question.' }, { status: 400 });
    }

    if (!body.securityAnswer || String(body.securityAnswer).trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Security answer must be at least 3 characters.' }, { status: 400 });
    }

    const user = await createTenantUser({
      name: String(body.name).trim(),
      shopName: String(body.shopName).trim(),
      mobile: normalizedMobile,
      email: body.email ? String(body.email).trim() : undefined,
      password: body.password,
      securityQuestion: body.securityQuestion,
      securityAnswer: String(body.securityAnswer).trim(),
    });
    return sessionResponse(user, 'Shopkeeper account created successfully.');
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Registration failed.' }, { status: 400 });
  }
}

