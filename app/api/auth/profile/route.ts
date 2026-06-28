import { NextRequest, NextResponse } from 'next/server';
import { sessionResponse } from '@/lib/saas/auth-response';
import { updateTenantUserProfile } from '@/lib/saas/auth-store';
import { tenantFromRequest } from '@/lib/saas/tenant-context';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const ctx = tenantFromRequest(req);
    const body = await req.json();
    const user = await updateTenantUserProfile({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      name: body.name,
      shopName: body.shopName,
      mobile: body.mobile,
      email: body.email,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
    });

    return sessionResponse(user, 'Profile updated.');
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Profile update failed.' }, { status: 400 });
  }
}
