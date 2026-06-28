import { NextRequest, NextResponse } from 'next/server';
import { getShopEntityById, listShopEntities, putShopEntity } from '@/lib/dynamodb-shop';

const INVOICE_ENTITY = 'invoice';
const CUSTOMER_ENTITY = 'customer';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function normalizePhone(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  return digits ? `91${digits}` : '';
}

function isOpenCreditInvoice(invoice: any) {
  return String(invoice.paymentMethod || '').toLowerCase() === 'credit' && !invoice.creditClearedAt && invoice.status !== 'paid';
}

function isReminderDue(invoice: any, now: number) {
  const lastReminderAt = invoice.lastCreditReminderAt ? Date.parse(invoice.lastCreditReminderAt) : 0;
  return !lastReminderAt || now - lastReminderAt >= WEEK_MS;
}

function creditMessage(invoice: any) {
  const customerName = invoice.customer?.name || 'Customer';
  const invoiceId = String(invoice.id || '').slice(0, 10);
  const total = Number(invoice.total || 0).toLocaleString('en-IN');

  return [
    `Hello ${customerName},`,
    `This is a reminder to clear your credit balance of ₹${total} for bill ${invoiceId}.`,
    'Please complete the payment at your earliest convenience.',
    'Thank you.',
  ].join('\n');
}

async function sendWhatsappText(phone: string, message: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { sent: false, reason: 'WhatsApp Cloud API credentials are not configured.' };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    return { sent: false, reason: result?.error?.message || 'WhatsApp send failed.' };
  }

  return { sent: true, result };
}

async function getDueCreditInvoices() {
  const now = Date.now();
  const invoices = await listShopEntities<any>(INVOICE_ENTITY);

  return invoices
    .filter((invoice) => isOpenCreditInvoice(invoice) && isReminderDue(invoice, now))
    .map((invoice) => {
      const phone = normalizePhone(invoice.customer?.phone || '');
      const message = creditMessage(invoice);
      return {
        invoiceId: invoice.id,
        customer: invoice.customer || null,
        total: Number(invoice.total || 0),
        createdAt: invoice.createdAt,
        lastCreditReminderAt: invoice.lastCreditReminderAt || null,
        phone,
        message,
        whatsappUrl: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : '',
      };
    });
}

async function sendDueCreditReminders(options: { recordManualSend?: boolean; invoiceId?: string } = {}) {
  const nowIso = new Date().toISOString();
  const now = Date.now();
  const invoices = options.invoiceId
    ? [await getShopEntityById<any>(options.invoiceId)].filter(Boolean)
    : await listShopEntities<any>(INVOICE_ENTITY);

  const results = [];

  for (const invoice of invoices) {
    if (!isOpenCreditInvoice(invoice)) continue;
    if (!options.invoiceId && !isReminderDue(invoice, now)) continue;

    const phone = normalizePhone(invoice.customer?.phone || '');
    const message = creditMessage(invoice);

    if (!phone) {
      results.push({ invoiceId: invoice.id, sent: false, reason: 'Customer phone is missing.' });
      continue;
    }

    const sendResult = await sendWhatsappText(phone, message);
    const shouldRecord = sendResult.sent || options.recordManualSend;

    if (shouldRecord) {
      await putShopEntity(INVOICE_ENTITY, invoice.id, {
        ...invoice,
        lastCreditReminderAt: nowIso,
        creditReminderCount: Number(invoice.creditReminderCount || 0) + 1,
      });
    }

    results.push({
      invoiceId: invoice.id,
      phone,
      message,
      whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      ...sendResult,
    });
  }

  return results;
}

async function clearCreditInvoice(invoiceId: string) {
  const invoice = await getShopEntityById<any>(invoiceId);

  if (!invoice || !isOpenCreditInvoice(invoice)) {
    throw new Error('Open credit invoice not found.');
  }

  const nowIso = new Date().toISOString();
  const customerId = invoice.customer?.id;

  await putShopEntity(INVOICE_ENTITY, invoice.id, {
    ...invoice,
    status: 'paid',
    creditClearedAt: nowIso,
    updatedAt: nowIso,
  });

  if (customerId) {
    const customer = await getShopEntityById<any>(customerId);
    if (customer) {
      await putShopEntity(CUSTOMER_ENTITY, customerId, {
        ...customer,
        balance: Math.max(0, Number(customer.balance || 0) - Number(invoice.total || 0)),
        lastCreditClearedAt: nowIso,
      });
    }
  }

  return { invoiceId: invoice.id, creditClearedAt: nowIso };
}

export async function GET(req: NextRequest) {
  const shouldSend = new URL(req.url).searchParams.get('send') === '1';

  if (shouldSend) {
    const results = await sendDueCreditReminders();
    return NextResponse.json({ success: true, results });
  }

  const due = await getDueCreditInvoices();
  return NextResponse.json({ success: true, due });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'clear') {
      const invoiceId = body.invoiceId ? String(body.invoiceId) : '';
      if (!invoiceId) {
        return NextResponse.json({ success: false, error: 'invoiceId is required' }, { status: 400 });
      }

      const result = await clearCreditInvoice(invoiceId);
      return NextResponse.json({ success: true, result });
    }

    const invoiceId = body.invoiceId ? String(body.invoiceId) : '';
    const results = await sendDueCreditReminders({
      invoiceId,
      recordManualSend: Boolean(body.recordManualSend),
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
