import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, updateUserPassword, verifyPassword } from '@/lib/saas/auth-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await findUserByEmail(body.email);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    if (!user.securityAnswerHash) {
      return NextResponse.json({ success: false, error: 'Security question not set up for this account.' }, { status: 400 });
    }

    const isAnswerCorrect = verifyPassword(body.securityAnswer, user.securityAnswerHash);

    if (!isAnswerCorrect) {
      return NextResponse.json({ success: false, error: 'Incorrect security answer.' }, { status: 401 });
    }

    await updateUserPassword(body.email, body.newPassword);

    return NextResponse.json({ success: true, message: 'Password reset successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'An error occurred.' }, { status: 400 });
  }
}
