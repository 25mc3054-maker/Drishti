import { NextResponse } from 'next/server';
import { normalizePermissions } from './permissions';
import { createSaasSessionToken } from './session-token';
import { publicUser } from './auth-store';

export function sessionResponse(user: any, message: string) {
  const permissions = normalizePermissions(user.role || 'admin');
  const token = createSaasSessionToken({
    tenantId: user.tenant_id,
    userId: user.id,
    role: user.role || 'admin',
    permissions,
    name: user.name,
    shopName: user.shopName,
    mobile: user.mobile,
    email: user.email,
  });
  const response = NextResponse.json({
    success: true,
    message,
    user: publicUser(user),
    permissions,
    blankSlate: true,
  });

  response.cookies.set('saas_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
