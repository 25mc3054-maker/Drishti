"use client"

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BadgePercent,
  Boxes,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Minus,
  MessageCircle,
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
import type { BusinessSectionKey, DashboardData } from './types';
import { formatDate, formatMoney } from './utils';

interface BusinessSuiteProps {
  data: DashboardData;
  onDataRefresh?: () => Promise<void>;
  initialSection?: BusinessSectionKey;
}

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  availableQty: number;
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

export function BusinessSuite({ data, onDataRefresh, initialSection }: BusinessSuiteProps) {
  const [activeSection, setActiveSection] = useState<BusinessSectionKey>(initialSection || 'billing');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('walk-in');
  const [productQuery, setProductQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
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
      setDiscount('0');
      setTax('0');
      setNotes('');
      setBillingStatus({ type: 'success', message: `Bill ${String(result.invoice.id).slice(0, 10)} created. Inventory is updated.` });
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

  const shareLastBill = () => {
    if (!lastInvoice) return;
    const customerPhone = lastInvoice.customer?.phone ? String(lastInvoice.customer.phone).replace(/\D/g, '') : '';
    const billText = [
      `EasyTrader bill ${String(lastInvoice.id).slice(0, 10)}`,
      ...lastInvoice.items.map((item: any) => `${item.name} x ${item.qty} = ₹${formatMoney(Number(item.lineTotal || 0))}`),
      `Total: ₹${formatMoney(Number(lastInvoice.total || 0))}`,
    ].join('\n');
    const phoneParam = customerPhone ? `91${customerPhone.slice(-10)}` : '';
    window.open(`https://wa.me/${phoneParam}?text=${encodeURIComponent(billText)}`, '_blank', 'noopener,noreferrer');
  };

  const downloadInvoice = (invoice: any) => {
    if (!invoice) return;

    const customerName = invoice.customer?.name ? invoice.customer.name.replace(/\s/g, '_') : 'Walk-in';
    const invoiceId = String(invoice.id).slice(0, 6);
    const fileName = `EasyTrader_Invoice_${customerName}_${invoiceId}.txt`;

    const billText = [
      `EasyTrader Invoice: ${String(invoice.id)}`,
      `Date: ${formatDate(invoice.createdAt)}`,
      `Customer: ${invoice.customer?.name || 'Walk-in'}`,
      `Payment Method: ${invoice.paymentMethod || 'cash'}`,
      '---',
      'Items:',
      ...invoice.items.map((item: any) => `- ${item.name} x ${item.qty} @ ₹${formatMoney(Number(item.price || 0))} = ₹${formatMoney(Number(item.lineTotal || 0))}`),
      '---',
      `Subtotal: ₹${formatMoney(Number(invoice.subtotal || 0))}`,
      `Discount: ₹${formatMoney(Number(invoice.discount || 0))}`,
      `Tax: ₹${formatMoney(Number(invoice.tax || 0))}`,
      `Total: ₹${formatMoney(Number(invoice.total || 0))}`,
      invoice.notes ? `Notes: ${invoice.notes}` : '',
    ].filter(Boolean).join('\n');

    const blob = new Blob([billText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <section className="relative -mx-4 overflow-hidden px-4 pb-12 pt-3 md:-mx-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,156,42,0.16),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(59,168,255,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_28%)]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-28 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative mx-auto max-w-[1400px] space-y-6">
        <CosmicNavbar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

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
                onShare={shareLastBill}
                onTaxChange={setTax}
                onUpdateCartQty={updateCartQty}
              />
            ) : (
              <ModuleGallery
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
                onSharePromo={sharePromoOnWhatsApp}
                onSyncGoogleBusiness={syncGoogleBusiness}
              />
            )}
        </div>
        <AnimatePresence>
          {isAddingCustomer && (
            <AddCustomerModal
              onClose={() => setIsAddingCustomer(false)}
              onCustomerAdded={() => {
                onDataRefresh?.();
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
  onShare: () => void;
  onTaxChange: (value: string) => void;
  onUpdateCartQty: (id: string, qty: number) => void;
}) {
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="relative overflow-hidden rounded-[8px] border border-white/12 bg-black/45 p-3 shadow-[0_28px_120px_rgba(0,0,0,0.46)] backdrop-blur-2xl md:p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_8%,rgba(255,156,42,0.18),transparent_26%),radial-gradient(circle_at_76%_24%,rgba(59,168,255,0.20),transparent_30%)]" />
      <div className="relative space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <SoftStat label="Items in cart" value={String(itemCount)} />
          <SoftStat label="Bill value" value={`₹${formatMoney(grandTotal)}`} />
          <SoftStat label="Customer" value={selectedCustomer ? selectedCustomer.name : 'Walk-in'} />
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(360px,0.86fr)_minmax(0,1.14fr)]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="rounded-[8px] border border-white/10 bg-[#05070A]/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <PanelHeader icon={Search} title="Product Command" meta={`${filteredProducts.length} available`} />
            <select
              value={customerId}
              onChange={(event) => {
                if (event.target.value === 'add-new-customer') {
                  onAddCustomer();
                } else {
                  onCustomerChange(event.target.value);
                }
              }}
              className="mt-4 h-12 w-full rounded-full border border-white/12 bg-black/55 px-4 text-[14px] font-semibold text-white outline-none transition focus:border-[#78B7FF]"
            >
              <option value="walk-in">Walk-in customer</option>
              <option value="add-new-customer">-- Add New Customer --</option>
              {data.customers.map((customer: any) => (
                <option key={customer.id} value={customer.id}>{customer.name} {customer.phone ? `- ${customer.phone}` : ''}</option>
              ))}
            </select>

            <label className="mt-3 flex h-12 items-center gap-2 rounded-full border border-white/12 bg-black/55 px-4 text-white/55 transition focus-within:border-[#78B7FF]">
              <Search className="h-4 w-4" />
              <input
                value={productQuery}
                onChange={(event) => onProductQueryChange(event.target.value)}
                placeholder="Search products, category, description"
                className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/35"
              />
            </label>

            <div className="mt-4 grid max-h-[610px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {filteredProducts.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => onAddToCart(item)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.018, ease: 'easeOut' }}
                  whileHover={{ y: -2, scale: 1.006 }}
                  className="group relative flex min-h-[86px] w-full items-center justify-between gap-3 overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045] px-4 py-3 text-left transition hover:border-white/22 hover:bg-white/[0.075]"
                >
                  <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#FF9C2A] to-[#3BA8FF] opacity-0 transition group-hover:opacity-100" />
                  <span>
                    <span className="block text-[14px] font-semibold text-white">{item.name || 'Unnamed item'}</span>
                    <span className="mt-1 block text-[12px] text-white/48">Stock {Number(item.qty || 0)} • {item.category || 'General'}</span>
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[13px] font-semibold text-white">₹{formatMoney(Number(item.price || 0))}</span>
                </motion.button>
              ))}
              {filteredProducts.length === 0 ? (
                <div className="rounded-[8px] border border-white/10 bg-white/[0.045] px-4 py-10 text-center text-[14px] text-white/52">
                  No in-stock products match your search.
                </div>
              ) : null}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.05, ease: 'easeOut' }}
            className="rounded-[8px] border border-white/10 bg-[#05070A]/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <PanelHeader icon={ReceiptText} title="Smart Invoice Composer" meta={selectedCustomer ? selectedCustomer.name : 'Walk-in'} />
            <div className="mt-4 min-h-[240px] rounded-[8px] border border-white/10 bg-black/45 p-3">
              {cart.length === 0 ? (
                <div className="flex h-[216px] items-center justify-center rounded-[6px] border border-dashed border-white/14 text-center text-[14px] leading-6 text-white/48">
                  Add products to begin a stock-linked bill.
                </div>
              ) : (
                <div className="grid gap-2 lg:grid-cols-2">
                  {cart.map((item) => (
                    <div key={item.id} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[14px] font-semibold text-white">{item.name}</div>
                          <div className="mt-1 text-[12px] text-white/45">₹{formatMoney(item.price)} each • {item.availableQty} available</div>
                        </div>
                        <button type="button" onClick={() => onRemoveFromCart(item.id)} className="rounded-full p-2 text-white/42 transition hover:bg-white/10 hover:text-white" aria-label={`Remove ${item.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-white/12 bg-black/45">
                          <button type="button" onClick={() => onUpdateCartQty(item.id, item.qty - 1)} className="p-2.5 text-white/52 hover:text-white" aria-label={`Decrease ${item.name}`}>
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            value={item.qty}
                            onChange={(event) => onUpdateCartQty(item.id, Number(event.target.value || 1))}
                            className="h-9 w-12 bg-transparent text-center text-[14px] font-semibold text-white outline-none"
                            inputMode="numeric"
                          />
                          <button type="button" onClick={() => onUpdateCartQty(item.id, item.qty + 1)} className="p-2.5 text-white/52 hover:text-white" aria-label={`Increase ${item.name}`}>
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-[15px] font-semibold text-white">₹{formatMoney(item.price * item.qty)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <FormSelect value={paymentMethod} onChange={onPaymentMethodChange} options={['cash', 'upi', 'card', 'credit']} />
              <FormInput value={notes} onChange={onNotesChange} placeholder="Notes" />
              <FormInput value={discount} onChange={onDiscountChange} placeholder="Discount" />
              <FormInput value={tax} onChange={onTaxChange} placeholder="Tax" />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => onQuickDiscount(0.05)} className="chip-button"><BadgePercent className="h-3.5 w-3.5" />5%</button>
              <button type="button" onClick={() => onQuickDiscount(0.1)} className="chip-button"><BadgePercent className="h-3.5 w-3.5" />10%</button>
              <button type="button" onClick={() => onTaxChange(String(Math.round(subtotal * 0.18)))} className="chip-button"><Wand2 className="h-3.5 w-3.5" />GST 18%</button>
            </div>

            <div className="mt-4 rounded-[8px] border border-white/10 bg-white/[0.045] p-4 text-[13px]">
              <TotalLine label="Subtotal" value={`₹${formatMoney(subtotal)}`} />
              <TotalLine label="Discount" value={`₹${formatMoney(discountAmount)}`} />
              <TotalLine label="Tax" value={`₹${formatMoney(taxAmount)}`} />
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-[17px] font-semibold text-white">
                <span>Grand Total</span>
                <span>₹{formatMoney(grandTotal)}</span>
              </div>
            </div>

            {status.message ? (
              <div className={`mt-3 rounded-[8px] border px-3 py-2 text-[13px] ${status.type === 'error' ? 'border-red-400/35 bg-red-500/10 text-red-100' : 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100'}`}>
                {status.message}
              </div>
            ) : null}

            <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto_auto]">
              <button
                type="button"
                onClick={onCreateBill}
                disabled={cart.length === 0 || isBilling}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black shadow-[0_0_34px_rgba(255,255,255,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isBilling ? 'Creating bill...' : 'Create Bill & Deduct Stock'}
              </button>
              <IconAction disabled={!lastInvoice} onClick={onPrint} icon={Printer} label="Print" />
              <IconAction disabled={!lastInvoice} onClick={onShare} icon={MessageCircle} label="WhatsApp" />
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function ModuleGallery({
  section,
  data,
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
  onSharePromo,
  onSyncGoogleBusiness,
}: {
  section: BusinessSectionKey;
  data: DashboardData;
  onDownloadInvoice: (invoice: any) => void;
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
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-white/12 bg-black/45 p-4 shadow-[0_28px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,156,42,0.14),transparent_26%),radial-gradient(circle_at_86%_18%,rgba(59,168,255,0.16),transparent_30%)]" />
      <div className="relative">
        {section === 'customers' ? (
          <ModuleSection icon={Users} eyebrow="Customer Profiles" title="Customer memory" description="Your customer cards are restored with phone, purchase count, and lifetime spend.">
            <div className="mb-4 flex justify-end">
              <IconAction onClick={onAddCustomer} icon={UserPlus} label="Add New Customer" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.customers.slice(0, 12).map((customer: any, index: number) => (
                <MotionModuleCard key={customer.id} index={index} title={customer.name || 'Unnamed customer'} meta={customer.phone || 'Customer'}>
                  <div className="text-[13px] text-white/58">Purchases: <span className="text-white">{customer.purchaseCount || 0}</span></div>
                  <div className="mt-2 text-[13px] text-white/58">Spent: <span className="text-white">₹{formatMoney(Number(customer.totalSpent || 0))}</span></div>
                  <div className="mt-3 flex justify-end">
                    <IconAction onClick={() => onDeleteCustomer(customer.id)} icon={Trash2} label="Delete" />
                  </div>
                </MotionModuleCard>
              ))}
            </div>
          </ModuleSection>
        ) : null}

        {section === 'stock' ? (
          <ModuleSection icon={Boxes} eyebrow="Stock Management" title="Live stock field" description="Inventory quantities remain visible and update after stock-linked billing.">
            <div className="mb-4 flex justify-end">
              <IconAction onClick={onAddStock} icon={PackagePlus} label="Add New Stock" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.items.slice(0, 12).map((item: any, index: number) => (
                <MotionModuleCard key={item.id} index={index} title={item.name || 'Unnamed item'} meta={`Qty ${item.qty || 0}`} imageUrl={item.imageUrl}>
                  <div className="text-[13px] text-white/58">Unit price: <span className="text-white">₹{formatMoney(Number(item.price || 0))}</span></div>
                  <div className="mt-2 text-[13px] text-white/58">Supplier: <span className="text-white">{item.supplierName || 'Not linked'}</span></div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#FF9C2A] to-[#3BA8FF]" style={{ width: `${Math.min(100, Math.max(6, Number(item.qty || 0)))}%` }} />
                  </div>
                  {Number(item.qty || 0) <= 0 ? (
                    <div className="mt-3 rounded-[8px] border border-amber-300/25 bg-amber-400/10 p-3 text-[12px] leading-5 text-amber-100">
                      Stock completed. Place a supplier order now.
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <IconAction onClick={() => onPlaceSupplierOrder(item)} icon={PackagePlus} label="Order" />
                    <IconAction onClick={() => onDeleteStock(item.id)} icon={Trash2} label="Delete" />
                  </div>
                </MotionModuleCard>
              ))}
            </div>
          </ModuleSection>
        ) : null}

        {section === 'invoices' ? (
          <ModuleSection icon={ReceiptText} eyebrow="Invoice Ledger" title="Invoice constellation" description="The invoice details view is back, with subtotal, discount, tax, and total.">
            <div className="space-y-3">
              {data.invoices.slice(0, 8).map((invoice: any, index: number) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.035, ease: 'easeOut' }}
                  className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 text-[13px] text-white/58">
                    <div>
                      <span className="font-semibold text-white">{invoice.customer?.name || 'Walk-in Customer'}</span>
                      <span className="ml-3 text-white/40">INV-{String(invoice.id).slice(0, 6)}</span>
                    </div>
                    <span>{formatDate(invoice.createdAt)}</span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <SoftStat label="Subtotal" value={`₹${formatMoney(Number(invoice.subtotal || 0))}`} />
                    <SoftStat label="Discount" value={`₹${formatMoney(Number(invoice.discount || 0))}`} />
                    <SoftStat label="Tax" value={`₹${formatMoney(Number(invoice.tax || 0))}`} />
                    <SoftStat label="Total" value={`₹${formatMoney(Number(invoice.total || 0))}`} />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <IconAction disabled={!invoice} onClick={() => onDownloadInvoice(invoice)} icon={Download} label="Download" />
                  </div>
                </motion.div>
              ))}
            </div>
          </ModuleSection>
        ) : null}

        {section === 'marketing' ? (
          <ModuleSection icon={Sparkles} eyebrow="Marketing Operations" title="Marketing Studio" description="Generate a local promo poster, caption, hashtag pack, WhatsApp share, and Google Business update from your inventory.">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="rounded-[8px] border border-white/10 bg-[#05070A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <PanelHeader icon={Wand2} title="Promo Inputs" meta={selectedMarketingProduct ? selectedMarketingProduct.name : 'Select product'} />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <FormInput
                    value={marketingForm.shopName}
                    onChange={(value) => onMarketingFormChange({ ...marketingForm, shopName: value })}
                    placeholder="Shop name"
                  />
                  <FormInput
                    value={marketingForm.area}
                    onChange={(value) => onMarketingFormChange({ ...marketingForm, area: value })}
                    placeholder="Area"
                  />
                  <select
                    value={marketingForm.productId}
                    onChange={(event) => onMarketingFormChange({ ...marketingForm, productId: event.target.value })}
                    className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] font-semibold text-white outline-none transition focus:border-[#78B7FF] sm:col-span-2"
                  >
                    <option value="">Select product</option>
                    {data.items.map((item: any) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <FormInput
                    value={marketingForm.openingHours}
                    onChange={(value) => onMarketingFormChange({ ...marketingForm, openingHours: value })}
                    placeholder="Opening hours"
                  />
                  <FormInput
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
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black shadow-[0_0_34px_rgba(255,255,255,0.18)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGeneratingPromo ? 'Generating...' : 'Generate Promo'}
                  </button>
                  <IconAction disabled={isSyncingGoogle} onClick={onSyncGoogleBusiness} icon={ExternalLink} label={isSyncingGoogle ? 'Syncing...' : 'Google Sync'} />
                </div>

                {marketingStatus.message ? (
                  <div className={`mt-4 rounded-[8px] border px-3 py-2 text-[13px] ${marketingStatus.type === 'error' ? 'border-red-400/35 bg-red-500/10 text-red-100' : 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100'}`}>
                    {marketingStatus.message}
                  </div>
                ) : null}

              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: 0.04, ease: 'easeOut' }}
                className="rounded-[8px] border border-white/10 bg-[#05070A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                <PanelHeader icon={Sparkles} title="Campaign Output" meta={promoResult ? 'Generated' : 'Waiting for promo'} />
                {promoResult ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(220px,0.86fr)_minmax(0,1.14fr)]">
                    <img
                      src={promoResult.posterDataUrl}
                      alt="Generated promo poster"
                      className="aspect-square w-full rounded-[8px] border border-white/12 bg-black/35 object-cover"
                    />
                    <div className="space-y-3">
                      <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
                        <div className="text-[11px] uppercase tracking-[0.15em] text-white/38">Caption</div>
                        <p className="mt-2 text-[14px] leading-6 text-white">{promoResult.caption}</p>
                      </div>
                      <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
                        <div className="text-[11px] uppercase tracking-[0.15em] text-white/38">Hashtags</div>
                        <p className="mt-2 break-words text-[13px] leading-6 text-white/68">{promoHashtags}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <IconAction onClick={onCopyCaption} icon={Copy} label="Copy Caption" />
                        <IconAction onClick={onDownloadPoster} icon={Download} label="Download Poster" />
                        <IconAction onClick={onSharePromo} icon={MessageCircle} label="WhatsApp" />
                        <IconAction onClick={onExportInstagramPack} icon={ExternalLink} label="Instagram Pack" />
                        <div className="sm:col-span-2">
                          <IconAction onClick={onCopyHashtags} icon={Copy} label="Copy Hashtags" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid min-h-[360px] place-items-center rounded-[8px] border border-dashed border-white/14 bg-white/[0.035] p-6 text-center">
                    <div>
                      <Sparkles className="mx-auto h-8 w-8 text-[#FFB866]" />
                      <div className="mt-3 text-[16px] font-semibold text-white">No campaign generated yet</div>
                      <p className="mt-2 max-w-md text-[13px] leading-6 text-white/54">Choose an inventory item, add the local offer details, and generate a poster with a caption ready for social sharing.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </ModuleSection>
        ) : null}

        {section === 'expenses' ? (
          <ModuleSection icon={CreditCard} eyebrow="Expense Control" title="Expense atmosphere" description="Expense entries are back, including the empty-ledger state.">
            {data.expenses.length === 0 ? (
              <EmptyState text="No expense entries are recorded yet. The ledger is currently clean." />
            ) : (
              <div className="space-y-3">
                {data.expenses.map((expense: any, index: number) => (
                  <motion.div key={expense.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.03 }} className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
                    <div className="flex items-center justify-between text-[13px] text-white/58"><span className="font-semibold text-white">{expense.title}</span><span>₹{formatMoney(Number(expense.amount || 0))}</span></div>
                    <div className="mt-2 text-[13px] text-white/38">{expense.category} • {formatDate(expense.date || expense.createdAt)}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </ModuleSection>
        ) : null}

        {section === 'suppliers' ? (
          <ModuleSection icon={Boxes} eyebrow="Supplier Network" title="Supplier orbit" description="Supplier cards are restored with product lines, lead time, and phone.">
            <div className="mb-4 flex justify-end">
              <IconAction onClick={onAddSupplier} icon={PackagePlus} label="Add New Supplier" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.suppliers.map((supplier: any, index: number) => (
                <MotionModuleCard key={supplier.id} index={index} title={supplier.name || 'Unnamed supplier'} meta={supplier.products || 'Supplier'}>
                  <div className="text-[13px] text-white/58">Lead time: <span className="text-white">{supplier.leadTimeDays || 0} days</span></div>
                  <div className="mt-2 text-[13px] text-white/58">Phone: <span className="text-white">{supplier.phone || 'Not set'}</span></div>
                  {supplier.notes ? <div className="mt-2 text-[13px] leading-6 text-white/48">{supplier.notes}</div> : null}
                  <div className="mt-3 flex justify-end">
                    <IconAction onClick={() => onDeleteSupplier(supplier.id)} icon={Trash2} label="Delete" />
                  </div>
                </MotionModuleCard>
              ))}
              {data.suppliers.length === 0 ? (
                <EmptyState text="No suppliers are linked yet. Add one to enable fast reorder messages from stock alerts." />
              ) : null}
            </div>
          </ModuleSection>
        ) : null}
      </div>
    </div>
  );
}

function ModuleSection({ children, description, eyebrow, icon: Icon, title }: { children: React.ReactNode; description: string; eyebrow: string; icon: any; title: string }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[0.45fr_1fr] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/52">
            <Icon className="h-3.5 w-3.5 text-[#7EA7FF]" />
            {eyebrow}
          </div>
          <h3 className="mt-4 text-[38px] font-semibold leading-[1.04] tracking-normal text-white">{title}</h3>
        </div>
        <p className="max-w-2xl text-[15px] leading-7 text-white/58">{description}</p>
      </div>
      {children}
    </div>
  );
}

function MotionModuleCard({ children, index, meta, title, imageUrl }: { children: React.ReactNode; index: number; meta: string; title: string; imageUrl?: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.035, ease: 'easeOut' }}
      whileHover={{ y: -2, scale: 1.004 }}
      className="relative min-h-[190px] overflow-hidden rounded-[8px] border border-white/10 bg-[#05070A] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,156,42,0.14),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(59,168,255,0.16),transparent_32%)]" />
      <div className="relative flex h-full flex-col">
        {imageUrl && (
            <div className="w-full h-32 mb-4 rounded-md overflow-hidden border border-white/10">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
        )}
        <div className="flex-grow">
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/38">{meta}</div>
            <div className="mt-3 text-[20px] font-semibold text-white">{title}</div>
            <div className="mt-4">{children}</div>
        </div>
      </div>
    </motion.article>
  );
}

function SoftStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
      <div className="text-[11px] uppercase tracking-[0.15em] text-white/38">{label}</div>
      <div className="mt-2 text-[20px] font-semibold text-white">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-6 text-[15px] leading-7 text-white/58">
      {text}
    </div>
  );
}

function PanelHeader({ icon: Icon, title, meta }: { icon: any; title: string; meta: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.07] text-white">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[15px] font-semibold text-white">{title}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/38">{meta}</div>
        </div>
      </div>
    </div>
  );
}

function TotalLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 text-white/58">
      <span>{label}</span>
      <span className="text-white/78">{value}</span>
    </div>
  );
}

function FormInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] text-white outline-none placeholder:text-white/34 transition focus:border-[#78B7FF]"
    />
  );
}

function FormSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] font-semibold capitalize text-white outline-none transition focus:border-[#78B7FF]"
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function IconAction({ disabled = false, icon: Icon, label, onClick }: { disabled?: boolean; icon: any; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] font-semibold text-white transition hover:border-white/28 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
