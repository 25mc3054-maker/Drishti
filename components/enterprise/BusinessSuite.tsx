"use client"

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Minus,
  MessageCircle,
  MessageSquare,
  PackagePlus,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Wand2,
} from 'lucide-react';
import { AddStockModal } from './AddStockModal';
import { AddCustomerModal } from './AddCustomerModal';
import { AddSupplierModal } from './AddSupplierModal';
import { CosmicNavbar } from './CosmicNavbar';
import { RecentSearchInput } from './RecentSearchInput';
import type { BusinessSectionKey, DashboardData } from './types';
import { formatDate, formatMoney } from './utils';
import { downloadInvoicePDF } from '@/lib/saas/invoice-pdf';
import { sendInvoiceTextMessage } from '@/lib/saas/invoice-sms';

interface BusinessSuiteProps {
  data: DashboardData;
  onDataRefresh?: () => Promise<void>;
  initialSection?: BusinessSectionKey;
  activeSection?: BusinessSectionKey;
  onSectionChange?: (section: BusinessSectionKey) => void;
  theme?: 'dark' | 'light';
}

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  availableQty: number;
  checked?: boolean;
};

type MarketingForm = {
  shopName: string;
  area: string;
  productId: string;
  openingHours: string;
  specialOffer: string;
};

type PromoResult = {
  posterDataUrl: string;
  caption: string;
};

export function BusinessSuite({
  activeSection: controlledSection,
  data,
  initialSection,
  onDataRefresh,
  onSectionChange,
  theme = 'dark',
}: BusinessSuiteProps) {
  const isLight = theme === 'light';
  const [internalSection, setInternalSection] = useState<BusinessSectionKey>(initialSection || 'billing');
  const activeSection = controlledSection || internalSection;
  const setActiveSection = (sec: BusinessSectionKey) => {
    setInternalSection(sec);
    onSectionChange?.(sec);
  };
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('walk-in');
  const [productQuery, setProductQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [notes, setNotes] = useState('');
  const [lastInvoice, setLastInvoice] = useState<any | null>(null);
  const [billingStatus, setBillingStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [isBilling, setIsBilling] = useState(false);
  const [marketingForm, setMarketingForm] = useState<MarketingForm>({
    shopName: 'My Shop',
    area: 'RGIPT area',
    productId: '',
    openingHours: '9:00 AM - 9:00 PM',
    specialOffer: 'Fresh stock available at best price. Visit today!',
  });
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [marketingStatus, setMarketingStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    return (data.items || [])
      .filter((item: any) => Number(item.qty || 0) > 0)
      .filter((item: any) => {
        if (!query) return true;
        return `${item.name || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase().includes(query);
      })
      .slice(0, 24);
  }, [data.items, productQuery]);

  const selectedCustomer = customerId === 'walk-in' ? null : data.customers.find((customer: any) => String(customer.id) === customerId);
  const selectedMarketingProduct = data.items.find((item: any) => String(item.id) === marketingForm.productId);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = Math.max(0, Number(discount || 0));
  const taxAmount = Math.max(0, Number(tax || 0));
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);
  const addToCart = (item: any) => {
    const availableQty = Number(item.qty || 0);
    if (availableQty <= 0) return;

    setBillingStatus({ type: 'idle', message: '' });
    setCart((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) => (
          entry.id === item.id ? { ...entry, qty: Math.min(entry.availableQty, entry.qty + 1) } : entry
        ));
      }

      return [
        ...current,
        {
          id: item.id,
          name: item.name || 'Unnamed item',
          price: Number(item.price || 0),
          qty: 1,
          availableQty,
          checked: false,
        },
      ];
    });
  };

  const updateCartQty = (id: string, nextQty: number) => {
    setCart((current) => current
      .map((entry) => (entry.id === id ? { ...entry, qty: Math.min(entry.availableQty, Math.max(1, nextQty)) } : entry))
      .filter((entry) => entry.qty > 0));
  };

  const removeFromCart = (id: string) => {
    setCart((current) => current.filter((entry) => entry.id !== id));
  };

  const toggleCartItemCheck = (id: string) => {
    setCart((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, checked: !entry.checked } : entry))
    );
  };

  const toggleAllCartItemsCheck = (checkedState: boolean) => {
    setCart((current) => current.map((entry) => ({ ...entry, checked: checkedState })));
  };

  const removeSelectedFromCart = () => {
    setCart((current) => current.filter((entry) => entry.checked === false));
  };

  const quickDiscount = (percent: number) => {
    setDiscount(String(Math.round(subtotal * percent)));
  };

  const placeSupplierOrder = (item: any, supplier?: any) => {
    const linkedSupplier = supplier || data.suppliers.find((entry: any) => (
      String(entry.id) === String(item.supplierId || '') ||
      String(entry.name || '').toLowerCase() === String(item.supplierName || '').toLowerCase()
    ));

    if (!linkedSupplier?.phone) {
      alert(`${item.name || 'This product'} is out of stock, but no supplier phone is linked. Add a supplier to place orders quickly.`);
      return;
    }

    const phone = String(linkedSupplier.phone).replace(/\D/g, '').slice(-10);
    const reorderQty = Math.max(10, Number(item.reorderQty || item.lastSoldQty || 0) * 2 || 20);
    const message = [
      `Hello ${linkedSupplier.name || 'Supplier'},`,
      `Please place a restock order for ${item.name || 'product'}.`,
      `Requested quantity: ${reorderQty}`,
      item.category ? `Category: ${item.category}` : '',
      'Please confirm availability and delivery time.',
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const createBill = async () => {
    if (cart.length === 0 || isBilling) return;

    setIsBilling(true);
    setBillingStatus({ type: 'idle', message: '' });

    try {
      const response = await fetch('/api/saas/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: item.id, cartQty: item.qty })),
          customer: selectedCustomer
            ? { id: selectedCustomer.id, name: selectedCustomer.name, phone: selectedCustomer.phone }
            : null,
          paymentMethod,
          discount: discountAmount,
          tax: taxAmount,
          notes,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Unable to create bill');
      }

      const depletedItems = cart
        .map((cartItem) => {
          const sourceItem = data.items.find((item: any) => String(item.id) === String(cartItem.id));
          return sourceItem ? { ...sourceItem, lastSoldQty: cartItem.qty, qty: Number(sourceItem.qty || 0) - cartItem.qty } : null;
        })
        .filter((entry: any) => entry && Number(entry.qty || 0) <= 0);

      setLastInvoice(result.invoice);
      setCart([]);
      setCustomerId('walk-in');
      setDiscount('');
      setTax('');
      setNotes('');

      // AUTOMATIC POST-BILLING DISPATCH: BOTH INVOICE PDF & TEXT MESSAGE
      try {
        downloadInvoicePDF(result.invoice, { shopName: 'EasyTrader' });
      } catch (err) {
        console.error('PDF invoice download error:', err);
      }

      let textStatus = '';
      try {
        const textResult = await sendInvoiceTextMessage(result.invoice, { shopName: 'EasyTrader', channel: 'auto' });
        if (textResult?.success) {
          textStatus = ' & Text Message sent to customer';
        }
      } catch (err) {
        console.error('SMS text dispatch error:', err);
      }

      setBillingStatus({
        type: 'success',
        message: `Bill #${String(result.invoice.id).slice(0, 8).toUpperCase()} created! PDF Invoice downloaded${textStatus}. Inventory updated.`,
      });

      depletedItems.forEach((item: any) => {
        if (confirm(`${item.name || 'A product'} is now out of stock. Place an order from the linked supplier?`)) {
          placeSupplierOrder(item);
        }
      });
      await onDataRefresh?.();
    } catch (error: any) {
      setBillingStatus({ type: 'error', message: error.message || 'Unable to create bill' });
    } finally {
      setIsBilling(false);
    }
  };

  const printLastBill = () => {
    window.print();
  };

  const shareInvoiceOnWhatsApp = async (invoice: any) => {
    if (!invoice) return;

    const customerPhone = invoice.customer?.phone ? String(invoice.customer.phone).replace(/\D/g, '') : '';
    const customerName = invoice.customer?.name || 'Walk-in Customer';
    const invoiceId = String(invoice.id).slice(0, 8).toUpperCase();
    const formattedDate = formatDate(invoice.createdAt);
    const paymentMethod = String(invoice.paymentMethod || 'cash').toUpperCase();

    // 1. Build Itemized Text List
    const itemsList = (invoice.items || []).map((item: any) => (
      `• *${item.name || 'Item'}*\n  ${item.qty || 1} ${item.unit || 'pcs'} × ₹${formatMoney(Number(item.price || 0))} = ₹${formatMoney(Number(item.lineTotal || 0))}`
    )).join('\n');

    // 2. Build Full Structured Bill Message
    const billText = [
      `🧾 *INVOICE RECEIPT - EASYTRADER*`,
      `────────────────────────`,
      `📄 *Invoice No:* #${invoiceId}`,
      `📅 *Date:* ${formattedDate}`,
      `👤 *Customer:* ${customerName}${customerPhone ? ` (${customerPhone})` : ''}`,
      `💳 *Payment Method:* ${paymentMethod}`,
      `────────────────────────`,
      `📦 *ITEMS PURCHASED:*`,
      itemsList,
      `────────────────────────`,
      `Subtotal: ₹${formatMoney(Number(invoice.subtotal || 0))}`,
      Number(invoice.discount || 0) > 0 ? `Discount: -₹${formatMoney(Number(invoice.discount || 0))}` : '',
      Number(invoice.tax || 0) > 0 ? `Tax (GST): +₹${formatMoney(Number(invoice.tax || 0))}` : '',
      `------------------------`,
      `💰 *TOTAL PAID:* ₹${formatMoney(Number(invoice.total || 0))}`,
      invoice.notes ? `📝 *Notes:* ${invoice.notes}` : '',
      `────────────────────────`,
      `✨ *Thank you for shopping with us!*`,
    ].filter(Boolean).join('\n');

    // 3. Prepare Invoice Text/Document File
    const fileName = `EasyTrader_Invoice_${customerName.replace(/\s+/g, '_')}_${invoiceId}.txt`;
    const invoiceBlob = new Blob([billText], { type: 'text/plain;charset=utf-8' });

    // 4. Try Web Share API (Mobile Phones) for attaching document file + text together
    if (typeof navigator !== 'undefined' && (navigator as any).share && (navigator as any).canShare) {
      try {
        const invoiceFile = new File([invoiceBlob], fileName, { type: 'text/plain' });
        if ((navigator as any).canShare({ files: [invoiceFile] })) {
          await (navigator as any).share({
            title: `Invoice #${invoiceId}`,
            text: billText,
            files: [invoiceFile],
          });
          return;
        }
      } catch (err: any) {
        // Fall back to wa.me if share canceled or unhandled
      }
    }

    // 5. Fallback for Desktop/Web Browsers: Trigger invoice file download & open WhatsApp web
    const blobUrl = URL.createObjectURL(invoiceBlob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(blobUrl);

    const phoneParam = customerPhone ? `91${customerPhone.slice(-10)}` : '';
    window.open(`https://wa.me/${phoneParam}?text=${encodeURIComponent(billText)}`, '_blank', 'noopener,noreferrer');
  };

  const shareLastBill = () => {
    if (!lastInvoice) return;
    void shareInvoiceOnWhatsApp(lastInvoice);
  };

  const downloadInvoice = (invoice: any) => {
    if (!invoice) return;
    downloadInvoicePDF(invoice, { shopName: 'EasyTrader' });
  };

  const sendTextInvoice = (invoice: any, channel: 'sms' | 'whatsapp' | 'auto' = 'sms') => {
    if (!invoice) return;
    void sendInvoiceTextMessage(invoice, { shopName: 'EasyTrader', channel });
  };

  const getPromoHashtags = () => {
    const product = selectedMarketingProduct?.name?.replace(/\s+/g, '') || 'ShopProduct';
    const area = marketingForm.area.replace(/\s+/g, '') || 'LocalArea';
    return `#${product} #FreshStock #BestPrice #${area} #LocalShop #DailyDeals`;
  };

  const getPosterFileMeta = (dataUrl: string) => {
    if (dataUrl.startsWith('data:image/png')) return { mimeType: 'image/png', extension: 'png' };
    if (dataUrl.startsWith('data:image/jpeg')) return { mimeType: 'image/jpeg', extension: 'jpg' };
    if (dataUrl.startsWith('data:image/webp')) return { mimeType: 'image/webp', extension: 'webp' };
    if (dataUrl.startsWith('data:image/svg+xml')) return { mimeType: 'image/svg+xml', extension: 'svg' };
    return { mimeType: 'image/png', extension: 'png' };
  };

  const dataUrlToBlob = async (dataUrl: string) => {
    const response = await fetch(dataUrl);
    return response.blob();
  };

  const downloadPosterFile = async (options?: { silent?: boolean }) => {
    if (!promoResult) {
      setMarketingStatus({ type: 'error', message: 'Generate a promo first.' });
      return null;
    }

    const { extension } = getPosterFileMeta(promoResult.posterDataUrl);
    const safeProduct = (selectedMarketingProduct?.name || 'promo-poster')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const fileName = `${safeProduct || 'promo-poster'}-${Date.now()}.${extension}`;

    try {
      const blob = await dataUrlToBlob(promoResult.posterDataUrl);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      if (!options?.silent) {
        setMarketingStatus({ type: 'success', message: `Poster downloaded as ${fileName}.` });
      }

      return fileName;
    } catch {
      if (!options?.silent) {
        setMarketingStatus({ type: 'error', message: 'Unable to download the poster.' });
      }

      return null;
    }
  };

  const generatePromo = async () => {
    if (!selectedMarketingProduct) {
      setMarketingStatus({ type: 'error', message: 'Select a product for promo generation.' });
      return;
    }

    setIsGeneratingPromo(true);
    setMarketingStatus({ type: 'idle', message: '' });

    try {
      const response = await fetch('/api/marketing/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: marketingForm.shopName,
          area: marketingForm.area,
          productName: selectedMarketingProduct.name,
          productDescription: selectedMarketingProduct.description || '',
          specialOffer: marketingForm.specialOffer,
          openingHours: marketingForm.openingHours,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate promo.');
      }

      setPromoResult(result.data);
      setMarketingStatus({ type: 'success', message: 'Promo poster and caption are ready.' });
    } catch (error: any) {
      setMarketingStatus({ type: 'error', message: error.message || 'Failed to generate promo.' });
    } finally {
      setIsGeneratingPromo(false);
    }
  };

  const syncGoogleBusiness = async () => {
    setIsSyncingGoogle(true);
    setMarketingStatus({ type: 'idle', message: '' });

    try {
      const response = await fetch('/api/marketing/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingHours: marketingForm.openingHours,
          specialOffer: marketingForm.specialOffer,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Google sync failed.');
      }

      setMarketingStatus({
        type: 'success',
        message: result.message || (result.data?.liveSync ? 'Google Business updated.' : 'Google sync saved in demo mode.'),
      });
    } catch (error: any) {
      setMarketingStatus({ type: 'error', message: error.message || 'Google sync failed.' });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const copyPromoCaption = async () => {
    if (!promoResult) {
      setMarketingStatus({ type: 'error', message: 'Generate a promo first.' });
      return;
    }

    try {
      await navigator.clipboard.writeText(promoResult.caption);
      setMarketingStatus({ type: 'success', message: 'Caption copied.' });
    } catch {
      setMarketingStatus({ type: 'error', message: 'Unable to copy caption.' });
    }
  };

  const copyPromoHashtags = async () => {
    try {
      await navigator.clipboard.writeText(getPromoHashtags());
      setMarketingStatus({ type: 'success', message: 'Hashtags copied.' });
    } catch {
      setMarketingStatus({ type: 'error', message: 'Unable to copy hashtags.' });
    }
  };

  const sharePromoOnWhatsApp = async () => {
    if (!promoResult) {
      setMarketingStatus({ type: 'error', message: 'Generate a promo first.' });
      return;
    }

    const shareText = `${promoResult.caption}\n\n${getPromoHashtags()}`;
    const { mimeType, extension } = getPosterFileMeta(promoResult.posterDataUrl);

    try {
      const blob = await dataUrlToBlob(promoResult.posterDataUrl);
      const file = new File([blob], `promo-poster.${extension}`, { type: mimeType });
      const shareNavigator = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

      if (shareNavigator.share && shareNavigator.canShare?.({ files: [file] })) {
        await shareNavigator.share({ text: shareText, files: [file], title: 'Promo Poster' });
        return;
      }
    } catch {}

    await navigator.clipboard.writeText(shareText).catch(() => undefined);
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
    const fileName = await downloadPosterFile({ silent: true });

    setMarketingStatus({
      type: 'success',
      message: fileName
        ? `WhatsApp opened. Poster downloaded as ${fileName}; attach it from Downloads.`
        : 'WhatsApp opened with the promo text.',
    });
  };

  const exportInstagramPack = () => {
    if (!promoResult) {
      setMarketingStatus({ type: 'error', message: 'Generate a promo first.' });
      return;
    }

    const content = `Caption:\n${promoResult.caption}\n\nHashtags:\n${getPromoHashtags()}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'instagram-caption-pack.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMarketingStatus({ type: 'success', message: 'Instagram caption pack exported.' });
  };

  const deleteStockItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return;

    try {
      const response = await fetch(`/api/saas/items?id=${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete stock item.');
      }
      await onDataRefresh?.(); // Refresh data after deletion
    } catch (error: any) {
      alert(`Error deleting item: ${error.message}`);
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const response = await fetch(`/api/saas/suppliers?id=${supplierId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete supplier.');
      }
      await onDataRefresh?.();
    } catch (error: any) {
      alert(`Error deleting supplier: ${error.message}`);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch(`/api/saas/customers?id=${customerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete customer.');
      }
      await onDataRefresh?.();
    } catch (error: any) {
      alert(`Error deleting customer: ${error.message}`);
    }
  };


  return (
    <section className={`relative -mx-4 overflow-hidden px-3 pb-1 pt-0 md:-mx-8 md:px-6 ${isLight ? 'bg-white text-black' : 'bg-black text-white'}`}>
      <div className="relative mx-auto max-w-[1500px]">
        <div>
            {activeSection === 'billing' ? (
              <BillingDesk
                cart={cart}
                customerId={customerId}
                data={data}
                discount={discount}
                discountAmount={discountAmount}
                filteredProducts={filteredProducts}
                grandTotal={grandTotal}
                isBilling={isBilling}
                lastInvoice={lastInvoice}
                notes={notes}
                paymentMethod={paymentMethod}
                productQuery={productQuery}
                selectedCustomer={selectedCustomer}
                status={billingStatus}
                subtotal={subtotal}
                tax={tax}
                taxAmount={taxAmount}
                theme={theme}
                onAddToCart={addToCart}
                onCreateBill={createBill}
                onCustomerChange={setCustomerId}
                onAddCustomer={() => setIsAddingCustomer(true)}
                onDiscountChange={setDiscount}
                onNotesChange={setNotes}
                onPaymentMethodChange={setPaymentMethod}
                onPrint={printLastBill}
                onProductQueryChange={setProductQuery}
                onQuickDiscount={quickDiscount}
                onRemoveFromCart={removeFromCart}
                onToggleCartItemCheck={toggleCartItemCheck}
                onToggleAllCartItemsCheck={toggleAllCartItemsCheck}
                onRemoveSelectedFromCart={removeSelectedFromCart}
                onShare={shareLastBill}
                onTaxChange={setTax}
                onUpdateCartQty={updateCartQty}
              />
            ) : (
              <ModuleGallery
                theme={theme}
                section={activeSection}
                data={data}
                onDownloadInvoice={downloadInvoice}
                onAddCustomer={() => setIsAddingCustomer(true)}
                onAddStock={() => setIsAddingStock(true)}
                onAddSupplier={() => setIsAddingSupplier(true)}
                onDeleteCustomer={deleteCustomer}
                onDeleteStock={deleteStockItem}
                onDeleteSupplier={deleteSupplier}
                marketingForm={marketingForm}
                marketingStatus={marketingStatus}
                promoHashtags={getPromoHashtags()}
                promoResult={promoResult}
                selectedMarketingProduct={selectedMarketingProduct}
                isGeneratingPromo={isGeneratingPromo}
                isSyncingGoogle={isSyncingGoogle}
                onCopyCaption={copyPromoCaption}
                onCopyHashtags={copyPromoHashtags}
                onDownloadPoster={() => { void downloadPosterFile(); }}
                onExportInstagramPack={exportInstagramPack}
                onGeneratePromo={generatePromo}
                onMarketingFormChange={setMarketingForm}
                onPlaceSupplierOrder={placeSupplierOrder}
                onShareInvoice={shareInvoiceOnWhatsApp}
                onSendTextInvoice={(inv) => sendTextInvoice(inv, 'sms')}
                onSharePromo={sharePromoOnWhatsApp}
                onSyncGoogleBusiness={syncGoogleBusiness}
              />
            )}
        </div>
        <AnimatePresence>
          {isAddingCustomer && (
            <AddCustomerModal
              onClose={() => setIsAddingCustomer(false)}
              onCustomerAdded={(newCustomer) => {
                onDataRefresh?.();
                if (newCustomer?.id) {
                  setCustomerId(String(newCustomer.id));
                }
              }}
            />
          )}
          {isAddingStock && (
            <AddStockModal
              onClose={() => setIsAddingStock(false)}
              suppliers={data.suppliers}
              onStockAdded={() => {
                onDataRefresh?.();
              }}
            />
          )}
          {isAddingSupplier && (
            <AddSupplierModal
              onClose={() => setIsAddingSupplier(false)}
              onSupplierAdded={() => {
                onDataRefresh?.();
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function BillingDesk({
  cart,
  customerId,
  data,
  discount,
  discountAmount,
  filteredProducts,
  grandTotal,
  isBilling,
  lastInvoice,
  notes,
  paymentMethod,
  productQuery,
  selectedCustomer,
  status,
  subtotal,
  tax,
  taxAmount,
  theme = 'dark',
  onAddToCart,
  onCreateBill,
  onCustomerChange,
  onAddCustomer,
  onDiscountChange,
  onNotesChange,
  onPaymentMethodChange,
  onPrint,
  onProductQueryChange,
  onQuickDiscount,
  onRemoveFromCart,
  onToggleCartItemCheck,
  onToggleAllCartItemsCheck,
  onRemoveSelectedFromCart,
  onShare,
  onTaxChange,
  onUpdateCartQty,
}: {
  cart: CartItem[];
  customerId: string;
  data: DashboardData;
  discount: string;
  discountAmount: number;
  filteredProducts: any[];
  grandTotal: number;
  isBilling: boolean;
  lastInvoice: any | null;
  notes: string;
  paymentMethod: string;
  productQuery: string;
  selectedCustomer: any | null;
  status: { type: 'idle' | 'success' | 'error'; message: string };
  subtotal: number;
  tax: string;
  taxAmount: number;
  theme?: 'dark' | 'light';
  onAddToCart: (item: any) => void;
  onCreateBill: () => void;
  onCustomerChange: (value: string) => void;
  onAddCustomer: () => void;
  onDiscountChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onPrint: () => void;
  onProductQueryChange: (value: string) => void;
  onQuickDiscount: (percent: number) => void;
  onRemoveFromCart: (id: string) => void;
  onToggleCartItemCheck?: (id: string) => void;
  onToggleAllCartItemsCheck?: (checked: boolean) => void;
  onRemoveSelectedFromCart?: () => void;
  onShare: () => void;
  onTaxChange: (value: string) => void;
  onUpdateCartQty: (id: string, qty: number) => void;
}) {
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const isLight = theme === 'light';
  const [customerSearch, setCustomerSearch] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [cartQuery, setCartQuery] = useState('');
  const [mobileBillingTab, setMobileBillingTab] = useState<'products' | 'cart'>('products');

  const displayedCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return data.customers || [];
    return (data.customers || []).filter((c: any) =>
      `${c.name || ''} ${c.phone || ''}`.toLowerCase().includes(query)
    );
  }, [data.customers, customerSearch]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a: any, b: any) =>
      (a.name || '').localeCompare(b.name || '')
    );
  }, [filteredProducts]);

  const filteredCart = useMemo(() => {
    const query = cartQuery.trim().toLowerCase();
    if (!query) return cart;
    return cart.filter((item) =>
      (item.name || '').toLowerCase().includes(query)
    );
  }, [cart, cartQuery]);

  return (
    <div className={`relative overflow-hidden rounded-2xl p-2 transition-colors duration-200 md:p-2.5 ${
      isLight
        ? 'bg-white text-black shadow-sm'
        : 'bg-black text-white'
    }`}>
      <div className="relative space-y-2">
        {/* Mobile Phone Segment Control (< xl ONLY) */}
        <div className={`flex xl:hidden items-center justify-between gap-1 rounded-xl p-1 border shadow-sm transition-colors ${
          isLight
            ? 'border-zinc-200 bg-zinc-100 text-black'
            : 'border-zinc-800 bg-zinc-950 text-white'
        }`}>
          <button
            type="button"
            onClick={() => setMobileBillingTab('products')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 px-2 text-[12px] sm:text-[12.5px] font-extrabold transition-all touch-manipulation border ${
              mobileBillingTab === 'products'
                ? isLight
                  ? 'bg-white text-black border-zinc-200 shadow-md'
                  : 'bg-zinc-800 text-white border-zinc-700 shadow-md'
                : isLight
                  ? 'border-transparent text-zinc-600 hover:text-black hover:bg-zinc-200/60'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Boxes className={`h-4 w-4 shrink-0 ${mobileBillingTab === 'products' ? (isLight ? 'text-black' : 'text-blue-400') : 'text-zinc-500'}`} />
            <span>Products & Customer</span>
          </button>

          <div className={`h-4 w-px shrink-0 ${isLight ? 'bg-zinc-300' : 'bg-zinc-800'}`} />

          <button
            type="button"
            onClick={() => setMobileBillingTab('cart')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-[12px] sm:text-[12.5px] font-extrabold transition-all touch-manipulation border ${
              mobileBillingTab === 'cart'
                ? isLight
                  ? 'bg-white text-black border-zinc-200 shadow-md'
                  : 'bg-zinc-800 text-white border-zinc-700 shadow-md'
                : isLight
                  ? 'border-transparent text-zinc-600 hover:text-black hover:bg-zinc-200/60'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <ReceiptText className={`h-4 w-4 shrink-0 ${mobileBillingTab === 'cart' ? (isLight ? 'text-black' : 'text-emerald-400') : 'text-zinc-500'}`} />
            <span className="truncate">Cart ({itemCount})</span>
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${
              mobileBillingTab === 'cart'
                ? isLight ? 'bg-black text-white' : 'bg-emerald-500 text-black'
                : isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-900 text-zinc-300'
            }`}>
              ₹{formatMoney(grandTotal)}
            </span>
          </button>
        </div>

        {/* Main Grid Layout: Left Panel (Customer & Product Command) vs Right Panel (Smart Invoice Composer) */}
        <div className="grid gap-2.5 xl:grid-cols-[minmax(340px,0.88fr)_minmax(0,1.12fr)]">
          {/* LEFT COLUMN: Customer Selection at Top + Product Command below (Hidden on Mobile if Cart Tab active) */}
          <div className={`space-y-2 ${mobileBillingTab === 'cart' ? 'hidden xl:block' : 'block'}`}>
            {/* WALK-IN CUSTOMER & SEARCH FOR OLD CUSTOMER (Top of Left Section) */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className={`rounded-xl p-2.5 border ${
                isLight
                  ? 'border-transparent bg-zinc-50 text-black'
                  : 'border-zinc-800 bg-black text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-current" />
                  <span className="text-[12px] font-bold uppercase tracking-wider">Customer Selection</span>
                </div>
                <button
                  type="button"
                  onClick={onAddCustomer}
                  className={`inline-flex items-center gap-1.5 h-8 rounded-full border px-3 text-[12px] font-bold transition-all shadow-sm ${
                    isLight
                      ? 'border-transparent bg-black text-white hover:bg-zinc-800'
                      : 'border-zinc-800 bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Customer</span>
                </button>
              </div>

              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {/* Left Select: Walk in Customer dropdown */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                    isLight ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    Walk-in Customer
                  </label>
                  <select
                    value={customerId}
                    onChange={(event) => {
                      if (event.target.value === 'add-new-customer') {
                        onAddCustomer();
                      } else {
                        onCustomerChange(event.target.value);
                      }
                    }}
                    className={`h-9 w-full rounded-lg border px-3 text-[13px] font-semibold outline-none transition ${
                      isLight
                        ? 'border-transparent bg-zinc-100 text-black focus:ring-1 focus:ring-black'
                        : 'border-zinc-800 bg-black text-white focus:border-white'
                    }`}
                  >
                    <option value="walk-in">Walk-in customer</option>
                    <option value="add-new-customer">+ Add New Customer</option>
                    {selectedCustomer && (
                      <option value={selectedCustomer.id}>
                        {selectedCustomer.name} {selectedCustomer.phone ? `(${selectedCustomer.phone})` : ''}
                      </option>
                    )}
                  </select>
                </div>

                {/* Right Option: Search Option for Old Customers */}
                <div className="relative">
                  <label className={`block text-[10px] font-bold uppercase tracking-wide mb-0.5 ${
                    isLight ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    Search Old Customer
                  </label>
                  <div className={`flex h-9 items-center gap-2 rounded-lg border px-3 transition ${
                    isLight
                      ? 'border-transparent bg-zinc-100 text-black focus-within:ring-1 focus-within:ring-black'
                      : 'border-zinc-800 bg-black text-white focus-within:border-white'
                  }`}>
                    <Search className="h-4 w-4 shrink-0 text-zinc-400" />
                    <input
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setIsSearchingCustomer(true);
                      }}
                      onFocus={() => setIsSearchingCustomer(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && displayedCustomers.length > 0) {
                          e.preventDefault();
                          onCustomerChange(displayedCustomers[0].id);
                          setCustomerSearch('');
                          setIsSearchingCustomer(false);
                        }
                      }}
                      placeholder="Name or phone"
                      className="w-full bg-transparent text-base md:text-[12.5px] font-medium outline-none placeholder:text-zinc-500"
                    />
                  </div>

                  {/* Autocomplete List for Search Old Customer */}
                  {isSearchingCustomer && customerSearch.trim() && (
                    <div className={`absolute left-0 right-0 top-full z-40 mt-1 max-h-44 overflow-y-auto rounded-xl border p-1 shadow-2xl ${
                      isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-zinc-800 bg-black text-white'
                    }`}>
                      {displayedCustomers.length === 0 ? (
                        <div className="p-2 text-center text-[12px] opacity-50">No customer found</div>
                      ) : (
                        displayedCustomers.map((c: any) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              onCustomerChange(c.id);
                              setCustomerSearch('');
                              setIsSearchingCustomer(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] font-semibold transition ${
                              isLight ? 'hover:bg-blue-50 hover:text-blue-700' : 'hover:bg-zinc-900 hover:text-white'
                            }`}
                          >
                            <span className="font-bold">{c.name}</span>
                            <span className="text-[11px] opacity-60">{c.phone}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.section>

            {/* PRODUCT COMMAND */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className={`rounded-xl p-2.5 border ${
                isLight
                  ? 'border-transparent bg-zinc-50 text-black'
                  : 'border-zinc-800 bg-black text-white'
              }`}
            >
              <PanelHeader
                isLight={isLight}
                icon={Search}
                title="Product Command"
                meta={`${sortedProducts.length} Available`}
              />

              <RecentSearchInput
                value={productQuery}
                onChange={onProductQueryChange}
                placeholder="Search products, category, description..."
                storageKey="product_command"
                isLight={isLight}
                className="mt-1.5"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sortedProducts.length > 0) {
                    onAddToCart(sortedProducts[0]);
                  }
                }}
              />

              {/* Product List */}
              <div className="mt-1.5 space-y-1 h-[260px] sm:h-[320px] xl:h-[calc(100vh-360px)] xl:min-h-[220px] xl:max-h-[480px] overflow-y-auto pr-1">
                {sortedProducts.map((item, index) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => onAddToCart(item)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: index * 0.015, ease: 'easeOut' }}
                    whileHover={{ scale: 1.004, x: 2 }}
                    className={`group relative flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                      isLight
                        ? 'border-transparent bg-white hover:bg-zinc-100 text-black'
                        : 'border-zinc-900 bg-black hover:border-zinc-700 text-white'
                    }`}
                  >
                    <span className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-white opacity-0 transition group-hover:opacity-100" />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[12.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                        {item.name || 'Unnamed item'}
                      </div>
                      <div className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        <span>Stock: <strong className={isLight ? 'text-black' : 'text-white'}>{Number(item.qty || 0)} {item.unit || 'pcs'}</strong></span>
                        <span>•</span>
                        <span className="truncate">{item.category || 'General'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`rounded-lg px-2.5 py-1 text-[12px] font-bold border ${
                        isLight
                          ? 'border-transparent bg-zinc-100 text-black'
                          : 'border-zinc-800 bg-black text-white'
                      }`}>
                        ₹{formatMoney(Number(item.price || 0))}
                      </span>
                      <span className={`inline-flex h-7 items-center justify-center rounded-lg px-3 text-[11.5px] font-bold transition shadow-sm ${
                        isLight
                          ? 'bg-black text-white hover:bg-zinc-800'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}>
                        + Add
                      </span>
                    </div>
                  </motion.button>
                ))}
                {sortedProducts.length === 0 ? (
                  <div className={`rounded-lg p-4 text-center text-[12.5px] border ${
                    isLight ? 'border-transparent bg-white text-zinc-500' : 'border-zinc-800 bg-black text-zinc-400'
                  }`}>
                    No in-stock products match your search query.
                  </div>
                ) : null}
              </div>
            </motion.section>
          </div>

          {/* RIGHT COLUMN: SMART INVOICE COMPOSER (Hidden on Mobile if Products Tab active) */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.05, ease: 'easeOut' }}
            className={`rounded-xl p-2.5 flex flex-col justify-between border ${
              isLight
                ? 'border-transparent bg-zinc-50 text-black'
                : 'border-zinc-800 bg-black text-white'
            } ${mobileBillingTab === 'products' ? 'hidden xl:flex' : 'flex'}`}
          >
            <div>
              {/* Header with Search Bar right BESIDE Smart Invoice Composer Name */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                <div className="flex flex-1 items-center gap-2.5 min-w-[240px]">
                  <PanelHeader
                    isLight={isLight}
                    icon={ReceiptText}
                    title="Smart Invoice Composer"
                    meta={selectedCustomer ? selectedCustomer.name : 'Walk-in'}
                  />

                  {/* SEARCH BAR BESIDE SMART INVOICE COMPOSER NAME */}
                  <label className={`flex h-9 flex-1 items-center gap-2 rounded-lg border px-2.5 transition min-w-[140px] ${
                    isLight
                      ? 'border-transparent bg-zinc-100 text-black focus-within:ring-1 focus-within:ring-black'
                      : 'border-zinc-800 bg-black text-white focus-within:ring-1 focus-within:ring-white'
                  }`}>
                    <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <input
                      value={cartQuery}
                      onChange={(event) => setCartQuery(event.target.value)}
                      placeholder="Search items in cart..."
                      className="w-full bg-transparent text-base md:text-[12.5px] font-semibold outline-none placeholder:text-zinc-500"
                    />
                  </label>
                </div>

                {/* ITEMS IN CART BADGE & SELECT ALL CONTROLS */}
                <div className="flex items-center gap-2 shrink-0">
                  {cart.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <label className={`flex items-center gap-1 cursor-pointer select-none ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-white'}`}>
                        <input
                          type="checkbox"
                          checked={cart.length > 0 && cart.every((i) => i.checked !== false)}
                          onChange={(e) => onToggleAllCartItemsCheck?.(e.target.checked)}
                          className="h-3.5 w-3.5 rounded accent-emerald-500 cursor-pointer"
                          title="Select all items"
                        />
                        <span>All</span>
                      </label>
                      {cart.some((i) => i.checked !== false) && (
                        <button
                          type="button"
                          onClick={() => onRemoveSelectedFromCart?.()}
                          className="text-red-400 hover:text-red-300 transition text-[10.5px] uppercase tracking-wider font-extrabold"
                          title="Remove selected items"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold shrink-0 ${
                    isLight
                      ? 'bg-black text-white'
                      : 'bg-white text-black'
                  }`}>
                    <span className="relative flex h-2 w-2">
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isLight ? 'bg-white' : 'bg-black'}`}></span>
                    </span>
                    <span>{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic RECTANGULAR Cart Items List */}
              <div className={`mt-1.5 h-[220px] sm:h-[280px] xl:h-[calc(100vh-450px)] xl:min-h-[180px] xl:max-h-[380px] overflow-y-auto rounded-lg p-1.5 border ${
                isLight ? 'border-transparent bg-white' : 'border-zinc-900 bg-black'
              }`}>
                {cart.length === 0 ? (
                  <div className={`flex h-full items-center justify-center rounded-lg border border-dashed text-center text-[12px] font-medium leading-5 ${
                    isLight ? 'border-slate-300 text-slate-400' : 'border-zinc-800 text-white/40'
                  }`}>
                    Add products from Product Command to begin a stock-linked bill.
                  </div>
                ) : filteredCart.length === 0 ? (
                  <div className={`flex h-full items-center justify-center rounded-lg border border-dashed text-center text-[12px] font-medium leading-5 ${
                    isLight ? 'border-slate-300 text-slate-400' : 'border-zinc-800 text-white/40'
                  }`}>
                    No cart items match your search query.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCart.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-1 transition-all ${
                          isLight
                            ? 'border-slate-200 bg-slate-50/90 text-slate-900'
                            : 'border-zinc-900 bg-black text-white'
                        }`}
                      >
                        {/* Optional Verification Checkbox */}
                        <label className="flex items-center shrink-0 cursor-pointer pr-0.5" title="Re-check or verify physical item">
                          <input
                            type="checkbox"
                            checked={!!item.checked}
                            onChange={() => onToggleCartItemCheck?.(item.id)}
                            className={`h-4 w-4 rounded cursor-pointer transition accent-emerald-500 ${
                              isLight ? 'border-slate-300 bg-white' : 'border-zinc-700 bg-zinc-900'
                            }`}
                          />
                        </label>

                        {/* Item Name & Unit Price */}
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="truncate text-[12.5px] font-bold">{item.name}</span>
                          <span className={`text-[11px] font-semibold shrink-0 ${isLight ? 'text-slate-500' : 'text-white/45'}`}>
                            (₹{formatMoney(item.price)}/ea)
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className={`flex items-center shrink-0 rounded-md border ${
                          isLight ? 'border-slate-300 bg-white' : 'border-zinc-800 bg-black'
                        }`}>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.id, item.qty - 1)}
                            className={`p-0.5 transition ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'}`}
                            aria-label={`Decrease ${item.name}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            value={item.qty}
                            onChange={(event) => onUpdateCartQty(item.id, Number(event.target.value || 1))}
                            className="h-4.5 w-6 bg-transparent text-center text-[11.5px] font-bold outline-none"
                            inputMode="numeric"
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.id, item.qty + 1)}
                            className={`p-0.5 transition ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-white/60 hover:text-white'}`}
                            aria-label={`Increase ${item.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="w-14 text-right text-[12.5px] font-extrabold shrink-0">
                          ₹{formatMoney(item.price * item.qty)}
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item.id)}
                          className={`rounded-md p-0.5 shrink-0 transition ${
                            isLight
                              ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                              : 'text-white/40 hover:bg-red-500/20 hover:text-red-300'
                          }`}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Input fields */}
              <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                <FormSelect isLight={isLight} value={paymentMethod} onChange={onPaymentMethodChange} options={['cash', 'upi', 'card', 'credit']} />
                <FormInput isLight={isLight} value={notes} onChange={onNotesChange} placeholder="Notes" />
                <FormInput isLight={isLight} value={discount} onChange={onDiscountChange} placeholder="Discount (₹)" />
                <FormInput isLight={isLight} value={tax} onChange={onTaxChange} placeholder="Tax (₹)" />
              </div>

              {/* Quick Discount Buttons */}
              <div className="mt-1 flex flex-wrap gap-1">
                {[
                  { label: '1%', action: () => onQuickDiscount(0.01) },
                  { label: '5%', action: () => onQuickDiscount(0.05) },
                  { label: '7%', action: () => onQuickDiscount(0.07) },
                  { label: '10%', action: () => onQuickDiscount(0.1) },
                  { label: '15%', action: () => onQuickDiscount(0.15) },
                  { label: 'GST 18%', action: () => onTaxChange(String(Math.round(subtotal * 0.18))) },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={chip.action}
                    className={`inline-flex h-7.5 items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 text-[11.5px] font-bold transition-all shadow-sm ${
                      isLight
                        ? 'border-transparent bg-zinc-100 text-black hover:bg-zinc-200'
                        : 'border-zinc-800 bg-black text-white hover:bg-zinc-900'
                    }`}
                  >
                    <BadgePercent className={`h-3.5 w-3.5 ${isLight ? 'text-black' : 'text-white'}`} />
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>

              {/* Calculation Summary */}
              <div className={`mt-1.5 rounded-lg border p-2 text-[12px] ${
                isLight ? 'border-transparent bg-white' : 'border-zinc-900 bg-black'
              }`}>
                <TotalLine isLight={isLight} label="Subtotal" value={`₹${formatMoney(subtotal)}`} />
                <TotalLine isLight={isLight} label="Discount" value={`₹${formatMoney(discountAmount)}`} />
                <TotalLine isLight={isLight} label="Tax" value={`₹${formatMoney(taxAmount)}`} />
                <div className={`mt-1 flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-1 text-[15px] font-bold ${
                  isLight ? 'text-black' : 'text-white'
                }`}>
                  <span>Grand Total</span>
                  <span className={`font-black ${isLight ? 'text-black' : 'text-white'}`}>₹{formatMoney(grandTotal)}</span>
                </div>
              </div>

              {status.message ? (
                <div className={`mt-1 rounded-lg px-2.5 py-1 text-[11.5px] font-bold border ${
                  status.type === 'error'
                    ? 'border-red-900 bg-red-950 text-red-200'
                    : 'border-zinc-800 bg-black text-white'
                }`}>
                  {status.message}
                </div>
              ) : null}
            </div>

            {/* Action CTAs - ALWAYS PINNED & VISIBLE WITHOUT SCROLLING */}
            <div className="mt-2 grid gap-1.5 sm:grid-cols-[1fr_auto_auto_auto_auto]">
              <button
                type="button"
                onClick={onCreateBill}
                disabled={cart.length === 0 || isBilling}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-6 text-[13.5px] font-bold transition-all border-0 shadow-md ${
                  isLight
                    ? 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400'
                    : 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isBilling ? 'Creating bill...' : 'Create Bill & Deduct Stock'}
              </button>
              <IconAction isLight={isLight} disabled={!lastInvoice} onClick={() => lastInvoice && downloadInvoicePDF(lastInvoice, { shopName: 'EasyTrader' })} icon={FileText} label="PDF Invoice" />
              <IconAction isLight={isLight} disabled={!lastInvoice} onClick={() => lastInvoice && sendInvoiceTextMessage(lastInvoice, { shopName: 'EasyTrader', channel: 'sms' })} icon={MessageSquare} label="SMS Text" />
              <IconAction isLight={isLight} disabled={!lastInvoice} onClick={onShare} icon={MessageCircle} label="WhatsApp" />
              <IconAction isLight={isLight} disabled={!lastInvoice} onClick={onPrint} icon={Printer} label="Print" />
            </div>
          </motion.section>
        </div>

        {/* Floating Mobile Cart Quick Checkout Pill (< xl ONLY) */}
        {itemCount > 0 && mobileBillingTab === 'products' && (
          <div className="fixed bottom-4 left-4 right-4 z-40 xl:hidden">
            <button
              type="button"
              onClick={() => setMobileBillingTab('cart')}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-700 bg-white px-4 py-3 text-black shadow-2xl transition hover:bg-zinc-100 touch-manipulation min-h-[48px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white text-[12px] font-black">
                  {itemCount}
                </span>
                <div className="text-left">
                  <div className="text-[13px] font-extrabold leading-tight">View Cart & Checkout</div>
                  <div className="text-[11px] font-bold opacity-75">Total: ₹{formatMoney(grandTotal)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[13px] font-extrabold">
                <span>Proceed</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleGallery({
  section,
  data,
  theme = 'dark',
  onDownloadInvoice,
  onAddCustomer,
  onAddSupplier,
  onAddStock,
  onDeleteCustomer,
  marketingForm,
  marketingStatus,
  promoHashtags,
  promoResult,
  selectedMarketingProduct,
  isGeneratingPromo,
  isSyncingGoogle,
  onCopyCaption,
  onCopyHashtags,
  onDownloadPoster,
  onExportInstagramPack,
  onGeneratePromo,
  onMarketingFormChange,
  onDeleteSupplier,
  onDeleteStock,
  onPlaceSupplierOrder,
  onShareInvoice,
  onSendTextInvoice,
  onSharePromo,
  onSyncGoogleBusiness,
}: {
  section: BusinessSectionKey;
  data: DashboardData;
  theme?: 'dark' | 'light';
  onDownloadInvoice: (invoice: any) => void;
  onShareInvoice?: (invoice: any) => void;
  onSendTextInvoice?: (invoice: any) => void;
  onAddCustomer: () => void;
  onAddSupplier: () => void;
  onAddStock: () => void;
  onDeleteCustomer: (customerId: string) => void;
  marketingForm: MarketingForm;
  marketingStatus: { type: 'idle' | 'success' | 'error'; message: string };
  promoHashtags: string;
  promoResult: PromoResult | null;
  selectedMarketingProduct: any | null;
  isGeneratingPromo: boolean;
  isSyncingGoogle: boolean;
  onCopyCaption: () => void;
  onCopyHashtags: () => void;
  onDownloadPoster: () => void;
  onExportInstagramPack: () => void;
  onGeneratePromo: () => void;
  onMarketingFormChange: (form: MarketingForm) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onDeleteStock: (itemId: string) => void;
  onPlaceSupplierOrder: (item: any, supplier?: any) => void;
  onSharePromo: () => void;
  onSyncGoogleBusiness: () => void;
}) {
  const isLight = theme === 'light';

  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  const filteredCustomersList = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return data.customers || [];
    return (data.customers || []).filter((c: any) =>
      `${c.name || ''} ${c.phone || ''}`.toLowerCase().includes(q)
    );
  }, [data.customers, customerSearchQuery]);

  const filteredStockList = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    if (!q) return data.items || [];
    return (data.items || []).filter((item: any) =>
      `${item.name || ''} ${item.category || ''} ${item.supplierName || ''}`.toLowerCase().includes(q)
    );
  }, [data.items, stockSearchQuery]);

  const filteredInvoicesList = useMemo(() => {
    const q = invoiceSearchQuery.trim().toLowerCase();
    if (!q) return data.invoices || [];
    return (data.invoices || []).filter((inv: any) =>
      `${inv.id || ''} ${inv.customer?.name || ''} ${inv.customer?.phone || ''} ${inv.paymentMethod || ''}`.toLowerCase().includes(q)
    );
  }, [data.invoices, invoiceSearchQuery]);

  const filteredSuppliersList = useMemo(() => {
    const q = supplierSearchQuery.trim().toLowerCase();
    if (!q) return data.suppliers || [];
    return (data.suppliers || []).filter((s: any) =>
      `${s.name || ''} ${s.phone || ''} ${s.products || ''}`.toLowerCase().includes(q)
    );
  }, [data.suppliers, supplierSearchQuery]);

  return (
    <div className={`relative overflow-hidden rounded-2xl p-3 transition-colors duration-200 md:p-4 ${
      isLight
        ? 'bg-white text-black shadow-sm'
        : 'bg-black text-white'
    }`}>
      <div className="relative">
        {section === 'customers' ? (
          <ModuleSection isLight={isLight} icon={Users} eyebrow="Customer Profiles" title="Customer Directory" description="Search and manage customer records, purchase histories, and total spent.">
            {/* Header Controls: Search Input + Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
              <RecentSearchInput
                value={customerSearchQuery}
                onChange={setCustomerSearchQuery}
                placeholder="Search customers by name or phone..."
                storageKey="customer_directory"
                isLight={isLight}
                className="min-w-[220px] max-w-md"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full border px-3 py-1 text-[11.5px] font-bold ${
                  isLight ? 'border-transparent bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
                }`}>
                  {filteredCustomersList.length} {filteredCustomersList.length === 1 ? 'Customer' : 'Customers'}
                </span>
                <IconAction isLight={isLight} onClick={onAddCustomer} icon={UserPlus} label="Add New Customer" />
              </div>
            </div>

            {/* Compact Space-Efficient Customer Grid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomersList.map((customer: any) => (
                <div
                  key={customer.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                    isLight
                      ? 'border-transparent bg-zinc-50 text-black hover:bg-zinc-100'
                      : 'border-zinc-900 bg-black hover:border-zinc-700 text-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[13.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                      {customer.name || 'Unnamed customer'}
                    </div>
                    <div className={`mt-0.5 text-[11.5px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {customer.phone || 'No phone'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[11.5px] font-bold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      {customer.purchaseCount || 0} Bills
                    </div>
                    <div className={`text-[12.5px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>
                      ₹{formatMoney(Number(customer.totalSpent || 0))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCustomer(customer.id)}
                    className={`rounded-lg p-1.5 shrink-0 transition ${
                      isLight
                        ? 'text-zinc-400 hover:bg-red-50 hover:text-red-600'
                        : 'text-zinc-500 hover:bg-red-950 hover:text-red-300'
                    }`}
                    title="Delete customer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {filteredCustomersList.length === 0 ? (
                <div className={`col-span-full rounded-xl border p-6 text-center text-[13px] ${
                  isLight ? 'border-transparent bg-zinc-50 text-zinc-500' : 'border-zinc-900 bg-black text-zinc-400'
                }`}>
                  No customers found matching your search.
                </div>
              ) : null}
            </div>
          </ModuleSection>
        ) : null}

        {section === 'stock' ? (
          <ModuleSection isLight={isLight} icon={Boxes} eyebrow="Stock Management" title="Live Stock Inventory" description="Real-time stock levels with search, supplier restock alerts, and instant ordering.">
            {/* Header Controls: Search Input + Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
              <RecentSearchInput
                value={stockSearchQuery}
                onChange={setStockSearchQuery}
                placeholder="Search stock by item, category, supplier..."
                storageKey="stock_inventory"
                isLight={isLight}
                className="min-w-[220px] max-w-md"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full border px-3 py-1 text-[11.5px] font-bold ${
                  isLight ? 'border-transparent bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
                }`}>
                  {filteredStockList.length} Products
                </span>
                <IconAction isLight={isLight} onClick={onAddStock} icon={PackagePlus} label="Add New Stock" />
              </div>
            </div>

            {/* Compact Space-Efficient Stock Grid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStockList.map((item: any) => (
                <div
                  key={item.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                    isLight
                      ? 'border-transparent bg-zinc-50 text-black hover:bg-zinc-100'
                      : 'border-zinc-900 bg-black hover:border-zinc-700 text-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`truncate text-[13.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>{item.name || 'Unnamed item'}</span>
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10.5px] font-extrabold ${
                        Number(item.qty || 0) <= 0
                          ? 'border-red-900 bg-red-950 text-red-200'
                          : isLight ? 'border-transparent bg-zinc-200 text-black' : 'border-zinc-800 bg-black text-white'
                      }`}>
                        Qty: {item.qty || 0} {item.unit || 'pcs'}
                      </span>
                    </div>
                    <div className={`mt-1 flex items-center gap-2 text-[11.5px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <span className={`font-bold ${isLight ? 'text-black' : 'text-white'}`}>₹{formatMoney(Number(item.price || 0))}</span>
                      <span>•</span>
                      <span className="truncate">{item.supplierName || item.category || 'General'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onPlaceSupplierOrder(item)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-bold transition border-0 ${
                        isLight
                          ? 'bg-black text-white hover:bg-zinc-800'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      <PackagePlus className="h-3.5 w-3.5" />
                      <span>Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteStock(item.id)}
                      className={`rounded-lg p-1.5 shrink-0 transition ${
                        isLight
                          ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                          : 'text-white/40 hover:bg-red-500/20 hover:text-red-300'
                      }`}
                      title="Delete stock"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredStockList.length === 0 ? (
                <div className={`col-span-full rounded-xl border p-6 text-center text-[13px] ${
                  isLight ? 'border-slate-200 bg-white text-slate-500' : 'border-zinc-900 bg-black text-zinc-400'
                }`}>
                  No products found matching your search.
                </div>
              ) : null}
            </div>
          </ModuleSection>
        ) : null}

        {section === 'invoices' ? (
          <ModuleSection isLight={isLight} icon={ReceiptText} eyebrow="Invoice Ledger" title="Invoice History" description="Complete invoice register with instant search and download options.">
            {/* Header Controls: Search Input */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
              <RecentSearchInput
                value={invoiceSearchQuery}
                onChange={setInvoiceSearchQuery}
                placeholder="Search invoices by ID, customer name, phone..."
                storageKey="invoice_history"
                isLight={isLight}
                className="min-w-[240px] max-w-md"
              />
              <span className={`rounded-full border px-3 py-1 text-[11.5px] font-bold ${
                isLight ? 'border-transparent bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
              }`}>
                {filteredInvoicesList.length} {filteredInvoicesList.length === 1 ? 'Invoice' : 'Invoices'}
              </span>
            </div>

            {/* High-Density Compact Invoice List */}
            <div className="space-y-1.5">
              {filteredInvoicesList.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-2 transition-all ${
                    isLight
                      ? 'border-transparent bg-zinc-50 text-black hover:bg-zinc-100'
                      : 'border-zinc-900 bg-black hover:border-zinc-700 text-white'
                  }`}
                >
                  <div className="min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                        {invoice.customer?.name || 'Walk-in Customer'}
                      </span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${
                        isLight ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-white'
                      }`}>
                        INV-{String(invoice.id).slice(0, 6)}
                      </span>
                    </div>
                    <div className={`mt-0.5 text-[11.5px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {formatDate(invoice.createdAt)} • <span className="capitalize font-semibold">{invoice.paymentMethod || 'cash'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[12px] font-medium">
                    <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>
                      Subtotal: <strong className={isLight ? 'text-black' : 'text-white'}>₹{formatMoney(Number(invoice.subtotal || 0))}</strong>
                    </span>
                    <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>
                      Discount: <strong className={isLight ? 'text-black' : 'text-white'}>₹{formatMoney(Number(invoice.discount || 0))}</strong>
                    </span>
                    <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>
                      Tax: <strong className={isLight ? 'text-black' : 'text-white'}>₹{formatMoney(Number(invoice.tax || 0))}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[15px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>
                      ₹{formatMoney(Number(invoice.total || 0))}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDownloadInvoice(invoice)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition border-0 ${
                        isLight
                          ? 'bg-black text-white hover:bg-zinc-800'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                      title="Download PDF Tax Invoice"
                    >
                      <FileText className="h-3.5 w-3.5 text-current" />
                      <span>PDF Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendTextInvoice?.(invoice)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition border-0 ${
                        isLight
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-500 text-black hover:bg-blue-400 font-bold'
                      }`}
                      title="Send SMS text message to customer"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-current" />
                      <span>SMS Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onShareInvoice?.(invoice)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition border-0 ${
                        isLight
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-emerald-500 text-black hover:bg-emerald-400 font-bold'
                      }`}
                      title="Share invoice breakdown via WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-current" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
              {filteredInvoicesList.length === 0 ? (
                <div className={`rounded-xl border-0 p-6 text-center text-[13px] ${
                  isLight ? 'bg-zinc-50 text-zinc-500' : 'bg-zinc-900 text-zinc-400'
                }`}>
                  No invoices found matching your search.
                </div>
              ) : null}
            </div>
          </ModuleSection>
        ) : null}

        {section === 'marketing' ? (
          <ModuleSection isLight={isLight} icon={Sparkles} eyebrow="Marketing Operations" title="Marketing Studio" description="Generate a local promo poster, caption, hashtag pack, WhatsApp share, and Google Business update from your inventory.">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className={`rounded-xl border-0 p-4 shadow-sm ${
                  isLight ? 'bg-zinc-50 text-black' : 'bg-black text-white'
                }`}
              >
                <PanelHeader isLight={isLight} icon={Wand2} title="Promo Inputs" meta={selectedMarketingProduct ? selectedMarketingProduct.name : 'Select product'} />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <FormInput
                    isLight={isLight}
                    value={marketingForm.shopName}
                    onChange={(value) => onMarketingFormChange({ ...marketingForm, shopName: value })}
                    placeholder="Shop name"
                  />
                  <FormInput
                    isLight={isLight}
                    value={marketingForm.area}
                    onChange={(value) => onMarketingFormChange({ ...marketingForm, area: value })}
                    placeholder="Area"
                  />
                  <select
                    value={marketingForm.productId}
                    onChange={(event) => onMarketingFormChange({ ...marketingForm, productId: event.target.value })}
                    className={`h-11 rounded-xl border-0 px-4 text-[13.5px] font-semibold outline-none transition sm:col-span-2 ${
                      isLight
                        ? 'bg-zinc-100 text-black focus:ring-1 focus:ring-black'
                        : 'border-white/12 bg-black/45 text-white focus:border-[#78B7FF]'
                    }`}
                  >
                    <option value="">Select product</option>
                    {data.items.map((item: any) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <FormInput
                    isLight={isLight}
                    value={marketingForm.openingHours}
                    onChange={(value) => onMarketingFormChange({ ...marketingForm, openingHours: value })}
                    placeholder="Opening hours"
                  />
                  <FormInput
                    isLight={isLight}
                    value={marketingForm.specialOffer}
                    onChange={(value) => onMarketingFormChange({ ...marketingForm, specialOffer: value })}
                    placeholder="Special offer"
                  />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onGeneratePromo}
                    disabled={isGeneratingPromo}
                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-bold shadow-md transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45 ${
                      isLight
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-black shadow-[0_0_34px_rgba(255,255,255,0.18)]'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGeneratingPromo ? 'Generating...' : 'Generate Promo'}
                  </button>
                  <IconAction isLight={isLight} disabled={isSyncingGoogle} onClick={onSyncGoogleBusiness} icon={ExternalLink} label={isSyncingGoogle ? 'Syncing...' : 'Google Sync'} />
                </div>

                {marketingStatus.message ? (
                  <div className={`mt-4 rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold ${marketingStatus.type === 'error' ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-400/35 dark:bg-red-500/10 dark:text-red-100' : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-500/10 dark:text-emerald-100'}`}>
                    {marketingStatus.message}
                  </div>
                ) : null}

              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: 0.04, ease: 'easeOut' }}
                className={`rounded-xl border p-4 shadow-sm ${
                  isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-[#05070A] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                }`}
              >
                <PanelHeader isLight={isLight} icon={Sparkles} title="Campaign Output" meta={promoResult ? 'Generated' : 'Waiting for promo'} />
                {promoResult ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(220px,0.86fr)_minmax(0,1.14fr)]">
                    <img
                      src={promoResult.posterDataUrl}
                      alt="Generated promo poster"
                      className={`aspect-square w-full rounded-xl border object-cover ${
                        isLight ? 'border-slate-200 bg-slate-100' : 'border-white/12 bg-black/35'
                      }`}
                    />
                    <div className="space-y-3">
                      <div className={`rounded-xl border p-4 ${
                        isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.045] text-white'
                      }`}>
                        <div className={`text-[11px] font-extrabold uppercase tracking-[0.15em] ${
                          isLight ? 'text-slate-500' : 'text-[#78B7FF]'
                        }`}>Caption</div>
                        <p className={`mt-2 text-[14px] font-medium leading-6 ${isLight ? 'text-slate-800' : 'text-white'}`}>{promoResult.caption}</p>
                      </div>
                      <div className={`rounded-xl border p-4 ${
                        isLight ? 'border-slate-200 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.045] text-white'
                      }`}>
                        <div className={`text-[11px] font-extrabold uppercase tracking-[0.15em] ${
                          isLight ? 'text-slate-500' : 'text-[#78B7FF]'
                        }`}>Hashtags</div>
                        <p className={`mt-2 break-words text-[13px] font-medium leading-6 ${isLight ? 'text-slate-700' : 'text-white/80'}`}>{promoHashtags}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <IconAction isLight={isLight} onClick={onCopyCaption} icon={Copy} label="Copy Caption" />
                        <IconAction isLight={isLight} onClick={onDownloadPoster} icon={Download} label="Download Poster" />
                        <IconAction isLight={isLight} onClick={onSharePromo} icon={MessageCircle} label="WhatsApp" />
                        <IconAction isLight={isLight} onClick={onExportInstagramPack} icon={ExternalLink} label="Instagram Pack" />
                        <div className="sm:col-span-2">
                          <IconAction isLight={isLight} onClick={onCopyHashtags} icon={Copy} label="Copy Hashtags" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`mt-4 grid min-h-[360px] place-items-center rounded-xl border border-dashed p-6 text-center ${
                    isLight ? 'border-slate-300 bg-slate-50 text-slate-600' : 'border-white/14 bg-white/[0.035] text-white'
                  }`}>
                    <div>
                      <Sparkles className="mx-auto h-8 w-8 text-[#FF9C2A]" />
                      <div className={`mt-3 text-[16px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>No campaign generated yet</div>
                      <p className={`mt-2 max-w-md text-[13px] font-medium leading-6 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>Choose an inventory item, add the local offer details, and generate a poster with a caption ready for social sharing.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </ModuleSection>
        ) : null}

        {section === 'expenses' ? (
          <ModuleSection isLight={isLight} icon={CreditCard} eyebrow="Expense Control" title="Expense atmosphere" description="Expense entries are back, including the empty-ledger state.">
            {data.expenses.length === 0 ? (
              <EmptyState isLight={isLight} text="No expense entries are recorded yet. The ledger is currently clean." />
            ) : (
              <div className="space-y-3">
                {data.expenses.map((expense: any, index: number) => (
                  <motion.div key={expense.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.03 }} className={`rounded-xl border p-4 ${
                    isLight ? 'border-slate-200 bg-white text-slate-900 shadow-sm' : 'border-zinc-900 bg-black text-white'
                  }`}>
                    <div className={`flex items-center justify-between text-[13px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}><span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{expense.title}</span><span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>₹{formatMoney(Number(expense.amount || 0))}</span></div>
                    <div className={`mt-2 text-[13px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{expense.category} • {formatDate(expense.date || expense.createdAt)}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </ModuleSection>
        ) : null}

        {section === 'suppliers' ? (
          <ModuleSection isLight={isLight} icon={Boxes} eyebrow="Supplier Network" title="Suppliers Directory" description="Manage supplier contact info, lead times, and linked product lines.">
            {/* Header Controls: Search Input + Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
              <RecentSearchInput
                value={supplierSearchQuery}
                onChange={setSupplierSearchQuery}
                placeholder="Search suppliers by name, phone, products..."
                storageKey="supplier_network"
                isLight={isLight}
                className="min-w-[220px] max-w-md"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full border px-3 py-1 text-[11.5px] font-bold ${
                  isLight ? 'border-transparent bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
                }`}>
                  {filteredSuppliersList.length} Suppliers
                </span>
                <IconAction isLight={isLight} onClick={onAddSupplier} icon={PackagePlus} label="Add New Supplier" />
              </div>
            </div>

            {/* Compact Space-Efficient Supplier Grid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSuppliersList.map((supplier: any) => (
                <div
                  key={supplier.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                    isLight
                      ? 'border-transparent bg-zinc-50 text-black hover:bg-zinc-100'
                      : 'border-zinc-900 bg-black hover:border-zinc-700 text-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[13.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                      {supplier.name || 'Unnamed supplier'}
                    </div>
                    <div className={`mt-0.5 text-[11.5px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      Phone: {supplier.phone || 'Not set'} • Lead: {supplier.leadTimeDays || 0}d
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSupplier(supplier.id)}
                    className={`rounded-lg p-1.5 shrink-0 transition ${
                      isLight
                        ? 'text-zinc-400 hover:bg-red-50 hover:text-red-600'
                        : 'text-zinc-500 hover:bg-red-950 hover:text-red-300'
                    }`}
                    title="Delete supplier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {filteredSuppliersList.length === 0 ? (
                <div className={`col-span-full rounded-xl border p-6 text-center text-[13px] ${
                  isLight ? 'border-transparent bg-zinc-50 text-zinc-500' : 'border-zinc-900 bg-black text-zinc-400'
                }`}>
                  No suppliers found matching your search.
                </div>
              ) : null}
            </div>
          </ModuleSection>
        ) : null}
      </div>
    </div>
  );
}

function ModuleSection({ children, description, eyebrow, icon: Icon, isLight, title }: { children: React.ReactNode; description: string; eyebrow: string; icon: any; isLight?: boolean; title: string }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
            isLight ? 'border-transparent bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
          }`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className={`text-[19px] font-bold leading-tight ${isLight ? 'text-black' : 'text-white'}`}>{title}</h3>
            <p className={`text-[12px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{description}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function MotionModuleCard({ children, index, isLight, meta, title, imageUrl }: { children: React.ReactNode; index: number; isLight?: boolean; meta: string; title: string; imageUrl?: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.035, ease: 'easeOut' }}
      whileHover={{ y: -2, scale: 1.004 }}
      className={`relative min-h-[190px] overflow-hidden rounded-xl border-0 p-5 shadow-sm transition-all ${
        isLight
          ? 'bg-zinc-50 text-black hover:bg-white'
          : 'bg-black text-white'
      }`}
    >
      <div className="relative flex h-full flex-col">
        {imageUrl && (
          <div className={`mb-4 h-32 w-full overflow-hidden rounded-lg border-0 ${
            isLight ? 'bg-zinc-100' : 'bg-zinc-900'
          }`}>
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex-grow">
          <div className={`text-[11.5px] font-extrabold uppercase tracking-[0.16em] ${
            isLight ? 'text-zinc-500' : 'text-zinc-400'
          }`}>{meta}</div>
          <div className={`mt-2.5 text-[20px] font-bold ${
            isLight ? 'text-black' : 'text-white'
          }`}>{title}</div>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </motion.article>
  );
}

function SoftStat({ isLight, label, value }: { isLight?: boolean; label: string; value: string }) {
  return (
    <div className={`rounded-xl border-0 p-3.5 ${
      isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
    }`}>
      <div className={`text-[11px] font-extrabold uppercase tracking-[0.15em] ${
        isLight ? 'text-zinc-500' : 'text-zinc-400'
      }`}>{label}</div>
      <div className={`mt-2 text-[20px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function EmptyState({ isLight, text }: { isLight?: boolean; text: string }) {
  return (
    <div className={`rounded-xl border-0 p-6 text-[15px] font-medium leading-7 ${
      isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-900 text-zinc-300'
    }`}>
      {text}
    </div>
  );
}

function PanelHeader({ icon: Icon, isLight, meta, title }: { icon: any; isLight?: boolean; meta?: any; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
          isLight
            ? 'border-transparent bg-zinc-100 text-black'
            : 'border-zinc-900/50 bg-black text-white'
        }`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className={`text-[15px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>{title}</div>
          {meta ? (
            <div className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{meta}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TotalLine({ isLight, label, value }: { isLight?: boolean; label: string; value: string }) {
  return (
    <div className={`flex justify-between py-1 font-bold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
      <span>{label}</span>
      <span className={`font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function FormInput({ isLight, onChange, placeholder, value }: { isLight?: boolean; onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`h-10.5 rounded-xl border px-3.5 text-[13.5px] font-semibold outline-none transition ${
        isLight
          ? 'border-transparent bg-zinc-100 text-black placeholder:text-zinc-400 focus:ring-1 focus:ring-black'
          : 'border-zinc-900/50 bg-black text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-white'
      }`}
    />
  );
}

function FormSelect({ isLight, onChange, options, value }: { isLight?: boolean; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-10.5 rounded-xl border px-3.5 text-[13.5px] font-semibold capitalize outline-none transition ${
        isLight
          ? 'border-transparent bg-zinc-100 text-black focus:ring-1 focus:ring-black'
          : 'border-zinc-900/50 bg-black text-white focus:ring-1 focus:ring-white'
      }`}
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function IconAction({ disabled = false, icon: Icon, isLight, label, onClick }: { disabled?: boolean; icon: any; isLight?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-[13px] font-bold transition shadow-sm ${
        isLight
          ? 'border-transparent bg-zinc-100 text-black hover:bg-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400'
          : 'border-zinc-800 bg-black text-white hover:bg-zinc-900 disabled:bg-black disabled:text-zinc-600'
      }`}
    >
      <Icon className="h-4 w-4 text-current" />
      {label}
    </button>
  );
}
