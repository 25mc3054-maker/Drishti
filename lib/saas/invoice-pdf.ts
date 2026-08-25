import { jsPDF } from 'jspdf';

export interface PDFInvoiceOptions {
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopGstin?: string;
}

export function generateInvoicePDF(invoice: any, options: PDFInvoiceOptions = {}): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const shopTitle = options.shopName || 'EasyTrader Business';
  const customerName = invoice.customer?.name || 'Walk-in Customer';
  const customerPhone = invoice.customer?.phone || 'N/A';
  const invoiceId = String(invoice.id || '').slice(0, 10).toUpperCase();
  const rawDate = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
  const dateStr = rawDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = rawDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const paymentMethod = String(invoice.paymentMethod || 'cash').toUpperCase();
  const paymentStatus = invoice.status === 'credit_due' || paymentMethod === 'CREDIT' ? 'CREDIT DUE' : 'PAID';

  // Colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // dark slate
  const accentColor: [number, number, number] = [16, 185, 129]; // emerald
  const mutedText: [number, number, number] = [100, 116, 139];
  const lightBg: [number, number, number] = [248, 250, 252];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(shopTitle.toUpperCase(), 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RETAIL POS & INVOICE MANAGEMENT', 14, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TAX INVOICE', 196, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${invoiceId}`, 196, 25, { align: 'right' });

  // Invoice & Customer Info Box
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, 38, 182, 30, 2, 2, 'F');

  // Customer Details (Left)
  doc.setTextColor(...mutedText);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO', 18, 45);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(customerName, 18, 52);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text(`Phone: ${customerPhone}`, 18, 58);

  // Invoice Details (Right)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', 120, 45);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Date & Time: ${dateStr}, ${timeStr}`, 120, 52);
  doc.text(`Payment Mode: ${paymentMethod}`, 120, 58);

  // Status Badge
  doc.setFillColor(paymentStatus === 'PAID' ? accentColor[0] : 225, paymentStatus === 'PAID' ? accentColor[1] : 29, paymentStatus === 'PAID' ? accentColor[2] : 72);
  doc.roundedRect(165, 59, 25, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(paymentStatus, 177.5, 63.2, { align: 'center' });

  // Items Table Header
  const tableStartY = 75;
  doc.setFillColor(...primaryColor);
  doc.rect(14, tableStartY, 182, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 18, tableStartY + 5.5);
  doc.text('ITEM DESCRIPTION', 30, tableStartY + 5.5);
  doc.text('QTY', 120, tableStartY + 5.5, { align: 'right' });
  doc.text('RATE (₹)', 155, tableStartY + 5.5, { align: 'right' });
  doc.text('AMOUNT (₹)', 190, tableStartY + 5.5, { align: 'right' });

  // Table Body Rows
  let currentY = tableStartY + 8;
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  items.forEach((item: any, index: number) => {
    const qty = Number(item.qty || item.cartQty || 1);
    const price = Number(item.price || 0);
    const lineTotal = Number(item.lineTotal || qty * price);

    // Row Background (Zebra Striping)
    if (index % 2 === 1) {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 7.5, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(String(index + 1), 18, currentY + 5);
    
    // Truncate long item names if needed
    const itemName = String(item.name || 'Unnamed Product');
    const displayItemName = itemName.length > 45 ? `${itemName.slice(0, 42)}...` : itemName;
    doc.text(displayItemName, 30, currentY + 5);

    doc.text(String(qty), 120, currentY + 5, { align: 'right' });
    doc.text(price.toFixed(2), 155, currentY + 5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(lineTotal.toFixed(2), 190, currentY + 5, { align: 'right' });

    currentY += 7.5;
  });

  // Table Bottom Border Line
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, 196, currentY);

  // Financial Breakdown Section (Right-aligned)
  currentY += 6;
  const subtotal = Number(invoice.subtotal || items.reduce((sum: number, i: any) => sum + Number(i.lineTotal || (i.qty || 1) * (i.price || 0)), 0));
  const discount = Number(invoice.discount || 0);
  const tax = Number(invoice.tax || 0);
  const grandTotal = Number(invoice.total || Math.max(0, subtotal - discount + tax));

  const summaryStartX = 120;
  const summaryValueX = 190;

  // Subtotal
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedText);
  doc.text('Subtotal:', summaryStartX, currentY);
  doc.setTextColor(0, 0, 0);
  doc.text(`₹ ${subtotal.toFixed(2)}`, summaryValueX, currentY, { align: 'right' });
  currentY += 5;

  // Discount
  if (discount > 0) {
    doc.setTextColor(...mutedText);
    doc.text('Discount (-):', summaryStartX, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`- ₹ ${discount.toFixed(2)}`, summaryValueX, currentY, { align: 'right' });
    currentY += 5;
  }

  // Tax
  if (tax > 0) {
    doc.setTextColor(...mutedText);
    doc.text('Tax / GST (+):', summaryStartX, currentY);
    doc.setTextColor(0, 0, 0);
    doc.text(`+ ₹ ${tax.toFixed(2)}`, summaryValueX, currentY, { align: 'right' });
    currentY += 5;
  }

  // Total Box Highlight
  doc.setFillColor(...primaryColor);
  doc.roundedRect(summaryStartX - 4, currentY, 80, 10, 1.5, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('TOTAL AMOUNT:', summaryStartX, currentY + 6.5);
  doc.text(`₹ ${grandTotal.toFixed(2)}`, summaryValueX, currentY + 6.5, { align: 'right' });

  // Notes Section (Left side if present)
  if (invoice.notes) {
    const noteY = currentY - 5;
    doc.setFillColor(...lightBg);
    doc.roundedRect(14, noteY, 95, 15, 1.5, 1.5, 'F');
    doc.setTextColor(...mutedText);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES / MEMO:', 17, noteY + 5);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(String(invoice.notes), 90);
    doc.text(splitNotes, 17, noteY + 9);
  }

  // Footer Section
  const footerY = 275;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business! Computer-generated invoice, no signature required.', 105, footerY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('POWERED BY EASYTRADER PLATFORM', 105, footerY + 9, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(invoice: any, options: PDFInvoiceOptions = {}) {
  const doc = generateInvoicePDF(invoice, options);
  const customerName = (invoice.customer?.name || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
  const invoiceId = String(invoice.id || 'INV').slice(0, 8).toUpperCase();
  const fileName = `EasyTrader_Invoice_${customerName}_${invoiceId}.pdf`;
  doc.save(fileName);
}
