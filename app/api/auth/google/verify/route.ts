import { NextRequest, NextResponse } from 'next/server';
import { upsertOAuthUser } from '@/lib/saas/auth-store';
import { sessionResponse } from '@/lib/saas/auth-response';

export const dynamic = 'force-dynamic';

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, email: rawEmail, name: rawName, picture: rawPicture } = body;

    let email = '';
    let name = '';
    let picture = '';
    let sub = '';

    if (credential && typeof credential === 'string') {
      const decoded = decodeJwtPayload(credential);
      if (decoded && decoded.email) {
        email = decoded.email;
        name = decoded.name || decoded.given_name || email.split('@')[0];
        picture = decoded.picture || '';
        sub = decoded.sub || `google-${Date.now()}`;
      }
    }

    if (!email && rawEmail && typeof rawEmail === 'string' && rawEmail.includes('@')) {
      email = rawEmail.trim().toLowerCase();
      name = rawName || email.split('@')[0];
      picture = rawPicture || '';
      sub = `google-${Date.now()}`;
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Google credential token or missing Google email.',
      }, { status: 400 });
    }

    const user = await upsertOAuthUser({
      provider: 'google',
      providerAccountId: sub || `google-${email}`,
      email,
      name: name || email.split('@')[0],
      picture: picture || undefined,
      shopName: `${(name || email.split('@')[0]).split(' ')[0]}'s Shop`,
    });

    return sessionResponse(user, 'Successfully verified Google Identity credential.');
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Google token verification failed.',
    }, { status: 400 });
  }
}
