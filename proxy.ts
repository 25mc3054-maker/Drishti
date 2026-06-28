import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith('/api/saas/auth/bootstrap')) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get('saas_session')?.value || req.headers.get('authorization'));
  const hasDevHeaders = process.env.NODE_ENV !== 'production'
    && process.env.SAAS_ALLOW_DEV_HEADERS !== '0'
    && Boolean(req.headers.get('x-tenant-id') && req.headers.get('x-user-id'));

  if (!hasSession && !hasDevHeaders) {
    return NextResponse.json(
      { success: false, error: 'SaaS tenant session is required.' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/saas/:path*'],
};
