import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { normalizePermissions } from './permissions';
import type { TenantContext, TenantPermission, TenantRole } from './types';

type SessionClaims = {
  sub?: string;
  user_id?: string;
  tenant_id?: string;
  shop_id?: string;
  role?: TenantRole;
  permissions?: TenantPermission[];
  name?: string;
  shopName?: string;
  mobile?: string;
  email?: string;
  exp?: number;
};

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function verifyHs256Jwt(token: string, secret: string): SessionClaims | null {
  const [headerSegment, payloadSegment, signatureSegment] = token.split('.');
  if (!headerSegment || !payloadSegment || !signatureSegment) return null;

  const header = JSON.parse(base64UrlDecode(headerSegment));
  if (header.alg !== 'HS256') return null;

  const expected = createHmac('sha256', secret)
    .update(`${headerSegment}.${payloadSegment}`)
    .digest('base64url');

  const actualBuffer = Buffer.from(signatureSegment);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  const claims = JSON.parse(base64UrlDecode(payloadSegment)) as SessionClaims;
  if (claims.exp && claims.exp * 1000 < Date.now()) return null;
  return claims;
}

export function tenantFromRequest(req: NextRequest): TenantContext {
  const token = req.cookies.get('saas_session')?.value || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const secret = process.env.SAAS_SESSION_SECRET || '';
  const claims = token && secret ? verifyHs256Jwt(token, secret) : null;
  const allowDevHeaders = process.env.NODE_ENV !== 'production' && process.env.SAAS_ALLOW_DEV_HEADERS !== '0';

  const tenantId = claims?.tenant_id || claims?.shop_id || (allowDevHeaders ? req.headers.get('x-tenant-id') || '' : '');
  const userId = claims?.sub || claims?.user_id || (allowDevHeaders ? req.headers.get('x-user-id') || '' : '');
  const role = (claims?.role || (allowDevHeaders ? req.headers.get('x-role') : '') || 'admin') as TenantRole;

  if (!tenantId || !userId) {
    throw new Error('Authenticated tenant context is required.');
  }

  const permissions = normalizePermissions(role, claims?.permissions);
  return {
    tenantId,
    userId,
    role,
    permissions,
    name: claims?.name,
    shopName: claims?.shopName,
    mobile: claims?.mobile,
    email: claims?.email,
  };
}

export function withTenant(
  handler: (req: NextRequest, ctx: TenantContext) => Promise<Response>
) {
  return async function tenantHandler(req: NextRequest) {
    try {
      const ctx = tenantFromRequest(req);
      return await handler(req, ctx);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Tenant isolation failed.' },
        { status: 401 }
      );
    }
  };
}
