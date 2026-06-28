import { NextRequest, NextResponse } from 'next/server';
import {
  getShopEntityById,
  listShopEntities,
  newEntityId,
  putShopEntity,
} from '@/lib/dynamodb-shop';

const INVOICE_ENTITY = 'invoice';
const ITEM_ENTITY = 'item';
const CUSTOMER_ENTITY = 'customer';

export async function GET(req: NextRequest) {
  const invoices = await listShopEntities(INVOICE_ENTITY);
  const invoiceId = new URL(req.url).searchParams.get('invoiceId');

  if (invoiceId) {
    const invoice = await getShopEntityById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, invoice });
  }

  return NextResponse.json({ success: true, invoices });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cartItems = Array.isArray(body.items) ? body.items : [];

    if (cartItems.length === 0) {
      return NextResponse.json({ success: false, error: 'No bill items provided' }, { status: 400 });
    }

    const items = await listShopEntities<any>(ITEM_ENTITY);
    const itemMap = new Map<string, any>(items.map((item: any) => [item.id, item]));

    for (const billItem of cartItems) {
      const stockItem = itemMap.get(billItem.id) as any;
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
      const stockItem = itemMap.get(entry.id) as any;
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

    const updatedItems = items.map((stockItem: any) => {
      const billedItem = normalizedItems.find((entry: any) => entry.id === stockItem.id);
      if (!billedItem) return stockItem;
      return {
        ...stockItem,
        qty: Number(stockItem.qty || 0) - billedItem.qty,
      };
    });

    const id = newEntityId();
    const subtotal = normalizedItems.reduce((sum: number, entry: any) => sum + entry.lineTotal, 0);
    const discount = Number(body.discount || 0);
    const tax = Number(body.tax || 0);
    const total = Math.max(0, subtotal - discount + tax);

    const invoice = {
      id,
      createdAt: new Date().toISOString(),
      items: normalizedItems,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: body.paymentMethod || 'cash',
      status: body.paymentMethod === 'credit' ? 'credit_due' : 'paid',
      notes: body.notes || '',
      customer: body.customer || null,
    };

    const customerId = body.customer?.id;
    const existingCustomer = customerId ? await getShopEntityById(customerId) : null;
    const isCreditInvoice = String(invoice.paymentMethod || '').toLowerCase() === 'credit';
    const updatedCustomer = existingCustomer
      ? {
          ...existingCustomer,
          totalSpent: Number((existingCustomer as any).totalSpent || 0) + total,
          purchaseCount: Number((existingCustomer as any).purchaseCount || 0) + 1,
          balance: isCreditInvoice
            ? Number((existingCustomer as any).balance || 0) + total
            : Number((existingCustomer as any).balance || 0),
          lastPurchaseAt: invoice.createdAt,
        }
      : null;

    await Promise.all([
      putShopEntity(INVOICE_ENTITY, invoice.id, invoice),
      ...updatedItems.map((entry: any) => putShopEntity(ITEM_ENTITY, entry.id, entry)),
      updatedCustomer ? putShopEntity(CUSTOMER_ENTITY, customerId, updatedCustomer) : Promise.resolve(null),
    ]);

    return NextResponse.json({ success: true, invoice });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Missing invoice id' }, { status: 400 });
    }

    const existingInvoice = await getShopEntityById<any>(body.id);
    if (!existingInvoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const updatedInvoice = {
      ...existingInvoice,
      ...body,
      id: existingInvoice.id,
      updatedAt: new Date().toISOString(),
    };

    const saved = await putShopEntity(INVOICE_ENTITY, existingInvoice.id, updatedInvoice);
    return NextResponse.json({ success: true, invoice: saved });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
