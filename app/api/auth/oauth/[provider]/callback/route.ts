import { NextRequest, NextResponse } from 'next/server';
import { upsertOAuthUser } from '@/lib/saas/auth-store';
import { sessionResponse } from '@/lib/saas/auth-response';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const normalizedProvider = provider.toLowerCase() as 'google' | 'microsoft';

  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error || 'Authorization denied')}`, req.url));
  }

  // Retrieve CSRF state & PKCE verifier from HttpOnly cookie
  const oauthCookie = req.cookies.get('oauth_session')?.value;
  if (!oauthCookie) {
    return NextResponse.redirect(new URL('/?auth_error=Missing+OAuth+session', req.url));
  }

  let sessionData: { state: string; codeVerifier: string; provider: string };
  try {
    sessionData = JSON.parse(oauthCookie);
  } catch {
    return NextResponse.redirect(new URL('/?auth_error=Invalid+OAuth+session', req.url));
  }

  // CSRF Protection: Validate state
  if (!state || state !== sessionData.state || normalizedProvider !== sessionData.provider) {
    return NextResponse.redirect(new URL('/?auth_error=CSRF+state+mismatch', req.url));
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/oauth/${normalizedProvider}/callback`;

  try {
    let profile: { id: string; email: string; name: string; picture?: string; mobile?: string };

    if (normalizedProvider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID || 'MOCK_GOOGLE_CLIENT_ID';
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'MOCK_GOOGLE_CLIENT_SECRET';

      // 1. Backend Token Exchange (Client Secret stays securely on backend)
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: sessionData.codeVerifier,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || 'Failed to exchange authorization code for token');
      }

      // 2. Fetch User Profile from Google API
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser = await profileRes.json();

      profile = {
        id: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name || googleUser.given_name || googleUser.email.split('@')[0],
        picture: googleUser.picture,
      };
    } else if (normalizedProvider === 'microsoft') {
      const clientId = process.env.MICROSOFT_CLIENT_ID || 'MOCK_MICROSOFT_CLIENT_ID';
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || 'MOCK_MICROSOFT_CLIENT_SECRET';
      const tenant = process.env.MICROSOFT_TENANT_ID || 'common';

      const tokenRes = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: sessionData.codeVerifier,
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || 'Failed to exchange Microsoft authorization code');
      }

      const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const msUser = await profileRes.json();

      profile = {
        id: msUser.id,
        email: msUser.mail || msUser.userPrincipalName,
        name: msUser.displayName || msUser.givenName || msUser.userPrincipalName.split('@')[0],
        mobile: msUser.mobilePhone || msUser.businessPhones?.[0],
      };
    } else {
      throw new Error('Unsupported OAuth Provider');
    }

    // 3. Upsert User & Account in Database
    const user = await upsertOAuthUser({
      provider: normalizedProvider,
      providerAccountId: profile.id,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      mobile: profile.mobile,
    });

    // 4. Issue Secure HttpOnly Session Cookie & Redirect Home or Notify Popup
    const response = sessionResponse(user, `Successfully logged in via ${normalizedProvider.toUpperCase()}`);
    response.cookies.delete('oauth_session');

    if (searchParams.get('popup') === 'true') {
      const html = `<!DOCTYPE html><html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
        }
        window.close();
      </script></body></html>`;
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          ...Object.fromEntries(response.headers.entries()),
        },
      });
    }

    return NextResponse.redirect(new URL('/?auth_success=true', req.url), {
      headers: response.headers,
    });
  } catch (err: any) {
    console.error('OAuth Callback Error:', err);
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(err.message || 'Authentication failed')}`, req.url));
  }
}
