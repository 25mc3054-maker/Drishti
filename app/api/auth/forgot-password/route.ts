import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/saas/auth-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, securityQuestion: user.securityQuestion });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'An error occurred.' }, { status: 400 });
  }
}
