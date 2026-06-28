import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createSaasSessionToken } from '@/lib/saas/session-token';
import { normalizePermissions } from '@/lib/saas/permissions';
import type { TenantRole } from '@/lib/saas/types';

export const dynamic = 'force-dynamic';

function assertBootstrapAllowed(req: NextRequest) {
  const expectedSecret = process.env.SAAS_BOOTSTRAP_SECRET;

  if (expectedSecret) {
    const providedSecret = req.headers.get('x-bootstrap-secret') || '';
    if (providedSecret !== expectedSecret) {
      throw new Error('Invalid bootstrap secret.');
    }
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SAAS_BOOTSTRAP_SECRET is required in production.');
  }
}

export async function POST(req: NextRequest) {
  try {
    assertBootstrapAllowed(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenantId ? String(body.tenantId) : randomUUID();
    const userId = body.userId ? String(body.userId) : randomUUID();
    const role = (body.role || 'admin') as TenantRole;
    const token = createSaasSessionToken({
      tenantId,
      userId,
      role,
      permissions: normalizePermissions(role, body.permissions),
    });

    const response = NextResponse.json({
      success: true,
      tenantId,
      userId,
      role,
      blankSlate: true,
      message: 'SaaS tenant session created. Tenant-scoped APIs will return empty data until this tenant imports or creates records.',
    });

    response.cookies.set('saas_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unable to bootstrap SaaS tenant.' }, { status: 401 });
  }
}
