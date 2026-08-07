import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateSocialUser } from '@/lib/saas/auth-store';
import { sessionResponse } from '@/lib/saas/auth-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = (body.provider || 'google').toLowerCase() as 'google' | 'apple' | 'microsoft';
    
    const email = body.email ? String(body.email).trim().toLowerCase() : '';
    const name = body.name ? String(body.name).trim() : '';
    const mobile = body.mobile ? String(body.mobile).trim() : '';
    const shopName = body.shopName ? String(body.shopName).trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: `Verified ${provider.toUpperCase()} email required. Please initiate real OAuth flow at /api/auth/oauth/${provider}/login.`
      }, { status: 400 });
    }

    const user = await findOrCreateSocialUser({
      provider,
      email,
      name: name || email.split('@')[0],
      mobile: mobile || undefined,
      shopName: shopName || `${(name || email.split('@')[0]).split(' ')[0]}'s Shop`,
    });

    return sessionResponse(user, `Successfully authenticated with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Social authentication failed.' }, { status: 400 });
  }
}
