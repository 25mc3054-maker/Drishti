export interface SendTextOptions {
  shopName?: string;
  channel?: 'sms' | 'whatsapp' | 'auto';
}

function formatMoney(amount: number): string {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(isoString?: string): string {
  if (!isoString) return new Date().toLocaleDateString('en-IN');
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildInvoiceTextMessage(invoice: any, shopName: string = 'EasyTrader'): string {
  if (!invoice) return '';

  const customerName = invoice.customer?.name || 'Valued Customer';
  const customerPhone = invoice.customer?.phone || '';
  const invoiceId = String(invoice.id || '').slice(0, 8).toUpperCase();
  const dateFormatted = formatDate(invoice.createdAt);
  const paymentMethod = String(invoice.paymentMethod || 'cash').toUpperCase();
  const isCredit = invoice.status === 'credit_due' || paymentMethod === 'CREDIT';

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const itemsList = items
    .map((item: any) => {
      const qty = Number(item.qty || item.cartQty || 1);
      const price = Number(item.price || 0);
      const lineTotal = Number(item.lineTotal || qty * price);
      return `• ${item.name || 'Item'} (x${qty}) = ₹${formatMoney(lineTotal)}`;
    })
    .join('\n');

  const subtotal = Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount || 0);
  const tax = Number(invoice.tax || 0);
  const grandTotal = Number(invoice.total || 0);

  const lines = [
    `🧾 INVOICE RECEIPT - ${shopName.toUpperCase()}`,
    `----------------------------------------`,
    `Invoice No: #${invoiceId}`,
    `Date: ${dateFormatted}`,
    `Customer: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}`,
    `Payment Mode: ${paymentMethod} ${isCredit ? '[CREDIT DUE]' : '[PAID]'}`,
    `----------------------------------------`,
    `ITEMS PURCHASED:`,
    itemsList || '• Items purchased',
    `----------------------------------------`,
    `Subtotal: ₹${formatMoney(subtotal)}`,
    discount > 0 ? `Discount: -₹${formatMoney(discount)}` : '',
    tax > 0 ? `Tax (GST): +₹${formatMoney(tax)}` : '',
    `----------------------------------------`,
    `TOTAL ${isCredit ? 'DUE' : 'PAID'}: ₹${formatMoney(grandTotal)}`,
    invoice.notes ? `Notes: ${invoice.notes}` : '',
    `----------------------------------------`,
    `Thank you for shopping with ${shopName}!`,
  ];

  return lines.filter(Boolean).join('\n');
}

export async function sendInvoiceTextMessage(
  invoice: any,
  options: SendTextOptions = {}
): Promise<{ success: boolean; channelSent: string; message: string }> {
  if (!invoice) {
    return { success: false, channelSent: 'none', message: 'No invoice provided' };
  }

  const shopName = options.shopName || 'EasyTrader';
  const textMessage = buildInvoiceTextMessage(invoice, shopName);
  const rawPhone = invoice.customer?.phone ? String(invoice.customer.phone).replace(/\D/g, '') : '';
  const phoneTenDigits = rawPhone.slice(-10);

  // 1. Send via Backend API endpoint (records delivery log in database)
  try {
    await fetch('/api/saas/invoices/send-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId: invoice.id,
        phone: phoneTenDigits ? `91${phoneTenDigits}` : '',
        message: textMessage,
      }),
    });
  } catch {}

  // 2. Client-side Native Launchers for direct delivery to customer:
  const channel = options.channel || 'auto';

  if (channel === 'sms' && typeof window !== 'undefined') {
    if (phoneTenDigits) {
      const smsUrl = `sms:+91${phoneTenDigits}?body=${encodeURIComponent(textMessage)}`;
      window.open(smsUrl, '_blank');
      return { success: true, channelSent: 'sms', message: `SMS app launched for +91${phoneTenDigits}` };
    }
  }

  if (channel === 'whatsapp' || channel === 'auto') {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `Invoice Receipt - ${shopName}`,
          text: textMessage,
        });
        return { success: true, channelSent: 'share_api', message: 'Invoice shared via system share menu.' };
      } catch (err: any) {
        // Fallback to direct link
      }
    }

    if (phoneTenDigits && typeof window !== 'undefined') {
      const whatsappUrl = `https://wa.me/91${phoneTenDigits}?text=${encodeURIComponent(textMessage)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return { success: true, channelSent: 'whatsapp', message: `WhatsApp launched for +91${phoneTenDigits}` };
    }
  }

  return { success: true, channelSent: 'text', message: 'Invoice text message generated successfully.' };
}
