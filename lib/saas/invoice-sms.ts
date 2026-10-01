import { generateInvoicePDF } from './invoice-pdf';

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
  const formattedPhone = phoneTenDigits ? `91${phoneTenDigits}` : '';

  // 1. Record delivery log in database API endpoint asynchronously
  try {
    fetch('/api/saas/invoices/send-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId: invoice.id,
        phone: formattedPhone,
        message: textMessage,
      }),
    }).catch(() => {});
  } catch {}

  const channel = options.channel || 'auto';

  // 2. Direct SMS Launcher
  if (channel === 'sms' && typeof window !== 'undefined') {
    const smsUrl = formattedPhone
      ? `sms:+${formattedPhone}?body=${encodeURIComponent(textMessage)}`
      : `sms:?body=${encodeURIComponent(textMessage)}`;
    window.open(smsUrl, '_blank');
    return { success: true, channelSent: 'sms', message: 'SMS app launched.' };
  }

  // 3. Direct WhatsApp Launcher with In-Memory PDF Invoice File Attachment
  if (typeof window !== 'undefined') {
    // Generate PDF in-memory (no local disk download)
    let pdfFile: File | null = null;
    try {
      const pdfDoc = generateInvoicePDF(invoice, { shopName });
      const pdfBlob = pdfDoc.output('blob');
      const invoiceIdStr = String(invoice.id || 'INV').slice(0, 8).toUpperCase();
      pdfFile = new File([pdfBlob], `Invoice_${invoiceIdStr}.pdf`, { type: 'application/pdf' });
    } catch (err) {
      console.error('In-memory PDF generation error:', err);
    }

    // Try System Share API (attaches PDF file + text message together)
    if (typeof navigator !== 'undefined' && (navigator as any).share && pdfFile && (navigator as any).canShare) {
      try {
        if ((navigator as any).canShare({ files: [pdfFile] })) {
          await (navigator as any).share({
            title: `Invoice #${String(invoice.id || '').slice(0, 8).toUpperCase()}`,
            text: textMessage,
            files: [pdfFile],
          });
          return { success: true, channelSent: 'share_api', message: 'Invoice PDF and text shared via WhatsApp/system menu.' };
        }
      } catch (err) {
        // Fall back if cancelled
      }
    }

    // Fallback to direct WhatsApp link with pre-filled text message
    const whatsappUrl = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(textMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(textMessage)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    return { success: true, channelSent: 'whatsapp', message: `WhatsApp opened for ${formattedPhone || 'customer'}` };
  }

  return { success: true, channelSent: 'text', message: 'Invoice text message generated successfully.' };
}
