import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/saas/permissions';
import { withTenant } from '@/lib/saas/tenant-context';
import { getTenantEntity, putTenantEntity } from '@/lib/saas/tenant-store';

export const dynamic = 'force-dynamic';

export const POST = withTenant(async (req: NextRequest, ctx) => {
  requirePermission(ctx, 'invoices:write');

  try {
    const body = await req.json();
    const invoiceId = String(body.invoiceId || '');
    const phone = String(body.phone || '').replace(/\D/g, '');
    const message = String(body.message || '');

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    const existingInvoice = await getTenantEntity<any>(ctx, 'invoice', invoiceId);
    if (!existingInvoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const updatedInvoice = {
      ...existingInvoice,
      lastTextSentAt: nowIso,
      textSentCount: Number(existingInvoice.textSentCount || 0) + 1,
      textRecipientPhone: phone || existingInvoice.customer?.phone || null,
      updatedAt: nowIso,
    };

    await putTenantEntity(ctx, 'invoice', invoiceId, updatedInvoice);

    return NextResponse.json({
      success: true,
      invoiceId,
      textSentAt: nowIso,
      message: 'Invoice text message status updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
