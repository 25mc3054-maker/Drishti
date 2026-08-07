import { NextRequest, NextResponse } from 'next/server';
import { tenantFromRequest } from '@/lib/saas/tenant-context';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/saas/auth-options';
import { normalizePermissions } from '@/lib/saas/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Check custom saas_session cookie first
    try {
      const ctx = tenantFromRequest(req);
      return NextResponse.json({
        success: true,
        user: {
          id: ctx.userId,
          tenantId: ctx.tenantId,
          role: ctx.role,
          name: ctx.name,
          shopName: ctx.shopName,
          mobile: ctx.mobile,
          email: ctx.email,
        },
        permissions: ctx.permissions,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch {
      // 2. Check NextAuth session fallback
      const nextAuthSession = await getServerSession(authOptions);
      if (nextAuthSession?.user) {
        const u = nextAuthSession.user as any;
        const role = u.role || 'admin';
        return NextResponse.json({
          success: true,
          user: {
            id: u.id || u.email,
            tenantId: u.tenantId || 'social-tenant',
            role,
            name: u.name || u.email.split('@')[0],
            shopName: u.shopName || `${(u.name || u.email.split('@')[0]).split(' ')[0]}'s Shop`,
            mobile: u.mobile || '9999999999',
            email: u.email,
          },
          permissions: normalizePermissions(role),
          expires: nextAuthSession.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // 3. Return 200 OK with user: null when unauthenticated to prevent NextAuth CLIENT_FETCH_ERROR
    return NextResponse.json({ success: false, user: null });
  } catch {
    return NextResponse.json({ success: false, user: null });
  }
}
