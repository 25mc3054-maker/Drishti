import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/saas/permissions';
import { withTenant } from '@/lib/saas/tenant-context';
import { getTenantEntity, putTenantEntity } from '@/lib/saas/tenant-store';

export const dynamic = 'force-dynamic';

function defaultSettings(tenantId: string) {
  const now = new Date().toISOString();
  return {
    id: `settings#${tenantId}`,
    tenant_id: tenantId,
    shopId: tenantId,
    entityType: 'tenant_settings',
    receiptHeader: 'Thank you for shopping with us',
    logoUrl: '',
    taxPercent: 0,
    currency: 'INR',
    invoicePrefix: 'INV',
    whatsappReminderEnabled: true,
    creditReminderDay: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export const GET = withTenant(async (_req, ctx) => {
  requirePermission(ctx, 'settings:read');
  const id = `settings#${ctx.tenantId}`;
  const settings = await getTenantEntity(ctx, 'tenant_settings', id);
  return NextResponse.json({ success: true, settings: settings || defaultSettings(ctx.tenantId) });
});

export const PUT = withTenant(async (req: NextRequest, ctx) => {
  requirePermission(ctx, 'settings:write');
  const body = await req.json();
  const id = `settings#${ctx.tenantId}`;
  const settings = await putTenantEntity(ctx, 'tenant_settings', id, {
    ...defaultSettings(ctx.tenantId),
    ...body,
    id,
  });

  return NextResponse.json({ success: true, settings });
});
