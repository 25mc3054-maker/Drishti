import { createHmac, randomUUID } from 'crypto';
import type { TenantPermission, TenantRole } from './types';

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function createSaasSessionToken(input: {
  tenantId?: string;
  userId?: string;
  role?: TenantRole;
  permissions?: TenantPermission[];
  name?: string;
  shopName?: string;
  mobile?: string;
  email?: string;
  expiresInSeconds?: number;
}) {
  const secret = process.env.SAAS_SESSION_SECRET;
  if (!secret) {
    throw new Error('SAAS_SESSION_SECRET is required to issue SaaS sessions.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = base64UrlJson({
    sub: input.userId || randomUUID(),
    tenant_id: input.tenantId || randomUUID(),
    role: input.role || 'admin',
    permissions: input.permissions,
    name: input.name,
    shopName: input.shopName,
    mobile: input.mobile,
    email: input.email,
    iat: now,
    exp: now + (input.expiresInSeconds || 60 * 60 * 24 * 7),
  });
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');

  return `${header}.${payload}.${signature}`;
}
