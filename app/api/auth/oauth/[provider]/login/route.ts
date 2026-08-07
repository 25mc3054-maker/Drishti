import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

export const dynamic = 'force-dynamic';

function base64UrlEncode(str: Buffer) {
  return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const normalizedProvider = provider.toLowerCase();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/oauth/${normalizedProvider}/callback`;

  // CSRF State & PKCE Code Verifier
  const state = randomBytes(24).toString('hex');
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const codeChallenge = base64UrlEncode(createHash('sha256').update(codeVerifier).digest());

  let authUrl = '';

  if (normalizedProvider === 'google') {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.includes('MOCK')) {
      return NextResponse.json({
        error: 'GOOGLE_CLIENT_ID is missing from environment. Please add GOOGLE_CLIENT_ID to .env.local',
      }, { status: 400 });
    }
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
    });
    authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  } else if (normalizedProvider === 'microsoft' || normalizedProvider === 'azure-ad') {
    const microsoftClientId = process.env.MICROSOFT_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID;
    if (!microsoftClientId || microsoftClientId.includes('MOCK')) {
      return NextResponse.json({
        error: 'MICROSOFT_CLIENT_ID / AZURE_AD_CLIENT_ID is missing from environment. Please add to .env.local',
      }, { status: 400 });
    }
    const tenant = process.env.MICROSOFT_TENANT_ID || process.env.AZURE_AD_TENANT_ID || 'common';
    const params = new URLSearchParams({
      client_id: microsoftClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email User.Read',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
  } else if (normalizedProvider === 'apple') {
    const appleId = process.env.APPLE_ID;
    if (!appleId || appleId.includes('MOCK')) {
      return NextResponse.json({
        error: 'APPLE_ID is missing from environment. Please add APPLE_ID to .env.local',
      }, { status: 400 });
    }
    const params = new URLSearchParams({
      client_id: appleId,
      redirect_uri: redirectUri,
      response_type: 'code id_token',
      response_mode: 'form_post',
      scope: 'name email',
      state,
    });
    authUrl = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  } else {
    return NextResponse.json({ error: `Unsupported OAuth provider: ${provider}` }, { status: 400 });
  }

  const response = NextResponse.redirect(authUrl);

  // Store state & PKCE verifier securely in HttpOnly cookie for callback verification
  response.cookies.set('oauth_session', JSON.stringify({ state, codeVerifier, provider: normalizedProvider }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });

  return response;
}
