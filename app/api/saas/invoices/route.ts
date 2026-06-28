import { createTenantCrudHandlers } from '@/lib/saas/crud-route';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/saas/permissions';
import { withTenant } from '@/lib/saas/tenant-context';
import { getTenantEntity, listTenantEntities, newTenantEntityId, putTenantEntity } from '@/lib/saas/tenant-store';

export const dynamic = 'force-dynamic';

const handlers = createTenantCrudHandlers({
  entityType: 'invoice',
  readPermission: 'invoices:read',
  writePermission: 'invoices:write',
  collectionKey: 'invoices',
  itemKey: 'invoice',
});

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;

export const POST = withTenant(async (req: NextRequest, ctx) => {
  requirePermission(ctx, 'invoices:write');
  const body = await req.json();
  const cartItems = Array.isArray(body.items) ? body.items : [];

  if (cartItems.length === 0) {
    return NextResponse.json({ success: false, error: 'No bill items provided' }, { status: 400 });
  }

  const items = await listTenantEntities<any>(ctx, 'item');
  const itemMap = new Map<string, any>(items.map((item: any) => [String(item.id), item]));

  for (const billItem of cartItems) {
    const stockItem = itemMap.get(String(billItem.id));
    const requiredQty = Number(billItem.cartQty ?? billItem.qty ?? 0);

    if (!stockItem) {
      return NextResponse.json({ success: false, error: `Item not found: ${billItem.name || billItem.id}` }, { status: 400 });
    }

    if (!Number.isFinite(requiredQty) || requiredQty <= 0) {
      return NextResponse.json({ success: false, error: `Invalid quantity for ${stockItem.name}` }, { status: 400 });
    }

    if (Number(stockItem.qty || 0) < requiredQty) {
      return NextResponse.json({ success: false, error: `Insufficient stock for ${stockItem.name}` }, { status: 400 });
    }
  }

  const normalizedItems = cartItems.map((entry: any) => {
    const stockItem = itemMap.get(String(entry.id));
    const qty = Number(entry.cartQty ?? entry.qty ?? 1);
    const price = Number(stockItem?.price ?? entry.price ?? 0);
    return {
      id: entry.id,
      name: stockItem?.name ?? entry.name ?? 'Unnamed Item',
      qty,
      price,
      lineTotal: qty * price,
    };
  });

  const id = newTenantEntityId();
  const subtotal = normalizedItems.reduce((sum: number, entry: any) => sum + Number(entry.lineTotal || 0), 0);
  const discount = Number(body.discount || 0);
  const tax = Number(body.tax || 0);
  const total = Math.max(0, subtotal - discount + tax);
  const paymentMethod = body.paymentMethod || 'cash';

  const invoice = await putTenantEntity(ctx, 'invoice', id, {
    id,
    items: normalizedItems,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod,
    status: paymentMethod === 'credit' ? 'credit_due' : 'paid',
    notes: body.notes || '',
    customer: body.customer || null,
  });

  await Promise.all(normalizedItems.map((entry: any) => {
    const stockItem = itemMap.get(String(entry.id));
    return putTenantEntity(ctx, 'item', stockItem.id, {
      ...stockItem,
      qty: Number(stockItem.qty || 0) - Number(entry.qty || 0),
    });
  }));

  const customerId = body.customer?.id;
  if (customerId) {
    const existingCustomer = await getTenantEntity<any>(ctx, 'customer', String(customerId));
    if (existingCustomer) {
      const isCreditInvoice = String(paymentMethod).toLowerCase() === 'credit';
      await putTenantEntity(ctx, 'customer', String(customerId), {
        ...existingCustomer,
        totalSpent: Number(existingCustomer.totalSpent || 0) + total,
        purchaseCount: Number(existingCustomer.purchaseCount || 0) + 1,
        balance: isCreditInvoice
          ? Number(existingCustomer.balance || 0) + total
          : Number(existingCustomer.balance || 0),
        lastPurchaseAt: (invoice as any).createdAt,
      });
    }
  }

  return NextResponse.json({ success: true, invoice });
});
