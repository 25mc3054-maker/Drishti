"use client"

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowRightLeft,
  BadgePercent,
  Boxes,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  LayoutGrid,
  Layers,
  Minus,
  MessageCircle,
  MessageSquare,
  PackagePlus,
  Pause,
  PhoneCall,
  Play,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
  Pencil,
  SplitSquareVertical,
  Tag,
  Trash2,
  Truck,
  UserPlus,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { AddStockModal } from './AddStockModal';
import { EditProductModal } from './EditProductModal';
import { AddCustomerModal } from './AddCustomerModal';
import { AddSupplierModal } from './AddSupplierModal';
import { ExpensesManager } from './ExpensesManager';
import { CosmicNavbar } from './CosmicNavbar';
import { RecentSearchInput } from './RecentSearchInput';
import { WebCallModal, ContactActionGroup, type CallRecipient } from './WebCallModal';
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

export type CartItem = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  qty: number;
  unit?: string;
  availableQty: number;
  checked?: boolean;
};

export interface BillSession {
  id: string;
  label: string;
  customerId: string;
  customTag?: string;
  cart: CartItem[];
  paymentMethod: string;
  discount: string;
  tax: string;
  notes: string;
  isHeld?: boolean;
  createdAt: number;
}

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
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [restockingItem, setRestockingItem] = useState<any | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockMode, setRestockMode] = useState<'add' | 'replace'>('add');

  const [orderingSupplierItem, setOrderingSupplierItem] = useState<any | null>(null);
  const [supplierOrderQty, setSupplierOrderQty] = useState('50');
  const [supplierOrderStatus, setSupplierOrderStatus] = useState<string | null>(null);

  const handleSupplierOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingSupplierItem || !supplierOrderQty) return;

    try {
      const response = await fetch('/api/saas/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orderingSupplierItem.supplierName || 'General Supplier',
          phone: orderingSupplierItem.supplierPhone || '',
          products: orderingSupplierItem.name,
          orderQty: Number(supplierOrderQty),
          itemId: orderingSupplierItem.id,
        }),
      });
      setSupplierOrderStatus(`Supplier order placed for ${supplierOrderQty} ${orderingSupplierItem.unit || 'pcs'} of "${orderingSupplierItem.name}"!`);
      setTimeout(() => {
        setOrderingSupplierItem(null);
        setSupplierOrderStatus(null);
        onDataRefresh?.();
      }, 1600);
    } catch (err) {
      console.error('Failed to order from supplier:', err);
    }
  };

  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingItem || !restockQty) return;
    const incoming = Number(restockQty);
    const newQty = restockMode === 'add' ? Number(restockingItem.qty || 0) + incoming : incoming;

    try {
      const response = await fetch('/api/saas/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...restockingItem,
          qty: newQty,
        }),
      });
      if (response.ok) {
        onDataRefresh?.();
      }
    } catch (err) {
      console.error('Failed to restock item:', err);
    } finally {
      setRestockingItem(null);
      setRestockQty('');
    }
  };
  const createDefaultSession = (id = 'bill-1', label = 'Bill #1'): BillSession => ({
    id,
    label,
    customerId: 'walk-in',
    customTag: '',
    cart: [],
    paymentMethod: 'cash',
    discount: '',
    tax: '',
    notes: '',
    isHeld: false,
    createdAt: Date.now(),
  });

  const [billSessions, setBillSessions] = useState<BillSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('drishti_multi_bill_sessions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error('Failed to load multi-bill sessions from cache:', err);
      }
    }
    return [createDefaultSession('bill-1', 'Bill #1')];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedId = localStorage.getItem('drishti_active_bill_session_id');
        if (savedId) return savedId;
      } catch {}
    }
    return 'bill-1';
  });

  // Keep active session ID valid and persist sessions to LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('drishti_multi_bill_sessions', JSON.stringify(billSessions));
      localStorage.setItem('drishti_active_bill_session_id', activeSessionId);
    } catch (err) {
      console.error('Failed to cache bill sessions:', err);
    }
  }, [billSessions, activeSessionId]);

  // Ensure activeSessionId points to an existing session
  useEffect(() => {
    if (billSessions.length > 0 && !billSessions.some((s) => s.id === activeSessionId)) {
      setActiveSessionId(billSessions[0].id);
    }
  }, [billSessions, activeSessionId]);

  const activeSession = useMemo(() => {
    return billSessions.find((s) => s.id === activeSessionId) || billSessions[0] || createDefaultSession();
  }, [billSessions, activeSessionId]);

  // Convenience helper to update the currently active session
  const updateActiveSession = (updater: (session: BillSession) => BillSession) => {
    setBillSessions((current) =>
      current.map((session) => (session.id === activeSession.id ? updater(session) : session))
    );
  };

  const cart = activeSession.cart || [];
  const customerId = activeSession.customerId || 'walk-in';
  const paymentMethod = activeSession.paymentMethod || 'cash';
  const discount = activeSession.discount || '';
  const tax = activeSession.tax || '';
  const notes = activeSession.notes || '';

  const setCart = (action: CartItem[] | ((curr: CartItem[]) => CartItem[])) => {
    updateActiveSession((session) => ({
      ...session,
      cart: typeof action === 'function' ? action(session.cart || []) : action,
    }));
  };

  const setCustomerId = (newCustomerId: string) => {
    updateActiveSession((session) => {
      // Auto-label tab if linked to a named customer
      let updatedLabel = session.label;
      if (newCustomerId !== 'walk-in') {
        const matched = data.customers.find((c: any) => String(c.id) === String(newCustomerId));
        if (matched && (!session.customTag || session.customTag === '')) {
          updatedLabel = matched.name ? matched.name.split(' ')[0] : session.label;
        }
      }
      return { ...session, customerId: newCustomerId, label: updatedLabel };
    });
  };

  const setPaymentMethod = (newPaymentMethod: string) => {
    updateActiveSession((session) => ({ ...session, paymentMethod: newPaymentMethod }));
  };

  const setDiscount = (newDiscount: string) => {
    updateActiveSession((session) => ({ ...session, discount: newDiscount }));
  };

  const setTax = (newTax: string) => {
    updateActiveSession((session) => ({ ...session, tax: newTax }));
  };

  const setNotes = (newNotes: string) => {
    updateActiveSession((session) => ({ ...session, notes: newNotes }));
  };

  // Multi-Customer Session Operations
  const addNewBillSession = (customLabel?: string, initialCustomer?: any) => {
    const nextNumber = billSessions.length + 1;
    const newId = `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const label = customLabel || (initialCustomer?.name ? initialCustomer.name.split(' ')[0] : `Bill #${nextNumber}`);
    const newSession: BillSession = {
      id: newId,
      label,
      customerId: initialCustomer ? String(initialCustomer.id) : 'walk-in',
      customTag: '',
      cart: [],
      paymentMethod: 'cash',
      discount: '',
      tax: '',
      notes: '',
      isHeld: false,
      createdAt: Date.now(),
    };

    setBillSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newId);
    setBillingStatus({ type: 'idle', message: '' });
  };

  const switchBillSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setBillingStatus({ type: 'idle', message: '' });
  };

  const closeBillSession = (sessionId: string) => {
    const targetSession = billSessions.find((s) => s.id === sessionId);
    if (targetSession && (targetSession.cart?.length || 0) > 0) {
      if (!confirm(`Close ${targetSession.label || 'this bill'}? It has ${targetSession.cart.length} item(s) in cart.`)) {
        return;
      }
    }

    if (billSessions.length <= 1) {
      // Reset the only session
      const resetSession = createDefaultSession();
      setBillSessions([resetSession]);
      setActiveSessionId(resetSession.id);
      return;
    }

    const remaining = billSessions.filter((s) => s.id !== sessionId);
    setBillSessions(remaining);
    if (activeSessionId === sessionId) {
      const closedIndex = billSessions.findIndex((s) => s.id === sessionId);
      const nextActive = remaining[Math.max(0, closedIndex - 1)] || remaining[0];
      setActiveSessionId(nextActive.id);
    }
  };

  const toggleHoldSession = (sessionId: string) => {
    setBillSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, isHeld: !s.isHeld } : s))
    );
  };

  const renameSession = (sessionId: string, newLabel: string, customTag?: string) => {
    setBillSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, label: newLabel, customTag: customTag ?? s.customTag } : s))
    );
  };

  const duplicateBillSession = (sessionId: string) => {
    const source = billSessions.find((s) => s.id === sessionId);
    if (!source) return;
    const newId = `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const clone: BillSession = {
      ...source,
      id: newId,
      label: `${source.label} (Copy)`,
      cart: (source.cart || []).map((i) => ({ ...i })),
      createdAt: Date.now(),
    };
    setBillSessions((prev) => [...prev, clone]);
    setActiveSessionId(newId);
  };

  const transferItem = (fromSessionId: string, toSessionId: string, itemId: string) => {
    const fromSession = billSessions.find((s) => s.id === fromSessionId);
    const toSession = billSessions.find((s) => s.id === toSessionId);
    if (!fromSession || !toSession || fromSessionId === toSessionId) return;

    const itemToMove = fromSession.cart?.find((i) => i.id === itemId);
    if (!itemToMove) return;

    setBillSessions((prev) =>
      prev.map((session) => {
        if (session.id === fromSessionId) {
          return {
            ...session,
            cart: (session.cart || []).filter((i) => i.id !== itemId),
          };
        }
        if (session.id === toSessionId) {
          const existing = (session.cart || []).find((i) => i.id === itemId);
          if (existing) {
            return {
              ...session,
              cart: session.cart.map((i) =>
                i.id === itemId ? { ...i, qty: Math.min(i.availableQty, i.qty + itemToMove.qty) } : i
              ),
            };
          }
          return {
            ...session,
            cart: [...(session.cart || []), { ...itemToMove }],
          };
        }
        return session;
      })
    );
  };

  const clearActiveCart = () => {
    setCart([]);
  };

  const [productQuery, setProductQuery] = useState('');
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
  const [activeCallRecipient, setActiveCallRecipient] = useState<CallRecipient | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const openCallModal = (recipient?: CallRecipient | null) => {
    setActiveCallRecipient(recipient || null);
    setIsCallModalOpen(true);
  };

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

      const itemPrice = Number(item.price || 0);
      return [
        ...current,
        {
          id: item.id,
          name: item.name || 'Unnamed item',
          price: itemPrice,
          originalPrice: itemPrice,
          qty: 1,
          unit: item.unit || 'pcs',
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

  const updateCartPrice = (id: string, nextPrice: number) => {
    setCart((current) => current.map((entry) => (
      entry.id === id ? { ...entry, price: Math.max(0, nextPrice) } : entry
    )));
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

    const supplierPhone = linkedSupplier?.phone ? String(linkedSupplier.phone).replace(/\D/g, '').slice(-10) : '';
    const supplierName = linkedSupplier?.name || item.supplierName || 'Supplier';

    const orderMessage = [
      `Hello ${supplierName},`,
      `📦 *NEW STOCK RESTOCK ORDER*`,
      `Item: *${item.name || 'Product'}*`,
      `Quantity Requested: *50 pcs* (or ${item.unit || 'units'})`,
      item.category ? `Category: ${item.category}` : '',
      `\nPlease confirm availability & expected delivery date. Thank you!`,
    ].filter(Boolean).join('\n');

    const waUrl = supplierPhone
      ? `https://wa.me/91${supplierPhone}?text=${encodeURIComponent(orderMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(orderMessage)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
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
          items: cart.map((item) => ({ id: item.id, cartQty: item.qty, price: item.price })),
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

      // Handle multi-bill transition smoothly:
      // If there are multiple customer bills open, retire this completed bill and switch to the next open bill!
      if (billSessions.length > 1) {
        const remaining = billSessions.filter((s) => s.id !== activeSession.id);
        setBillSessions(remaining);
        const nextWithItems = remaining.find((s) => (s.cart?.length || 0) > 0) || remaining[0];
        setActiveSessionId(nextWithItems.id);
      } else {
        // Reset the single session
        updateActiveSession((session) => ({
          ...session,
          cart: [],
          customerId: 'walk-in',
          customTag: '',
          discount: '',
          tax: '',
          notes: '',
          isHeld: false,
        }));
      }

      setBillingStatus({
        type: 'success',
        message: `Bill #${String(result.invoice.id).slice(0, 8).toUpperCase()} created! Click WhatsApp Bill to send PDF invoice and text message to customer.`,
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

    try {
      await sendInvoiceTextMessage(invoice, { shopName: 'EasyTrader', channel: 'whatsapp' });
    } catch (err) {
      console.error('WhatsApp message dispatch error:', err);
    }
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
    <section className={`relative w-full overflow-hidden px-1 pb-1 pt-0 ${isLight ? 'bg-white text-black' : 'bg-black text-white'}`}>
      <div className="relative mx-auto max-w-[1600px] w-full">
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
                billSessions={billSessions}
                activeSessionId={activeSessionId}
                onAddNewSession={addNewBillSession}
                onSwitchSession={switchBillSession}
                onCloseSession={closeBillSession}
                onToggleHoldSession={toggleHoldSession}
                onRenameSession={renameSession}
                onDuplicateSession={duplicateBillSession}
                onTransferItem={transferItem}
                onClearCart={clearActiveCart}
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
                onUpdateCartPrice={updateCartPrice}
                onOpenCallModal={openCallModal}
              />
            ) : (
              <ModuleGallery
                theme={theme}
                section={activeSection}
                data={data}
                onDataRefresh={onDataRefresh}
                onDownloadInvoice={downloadInvoice}
                onAddCustomer={() => setIsAddingCustomer(true)}
                onAddStock={() => setIsAddingStock(true)}
                onAddSupplier={() => setIsAddingSupplier(true)}
                onDeleteCustomer={deleteCustomer}
                onDeleteStock={deleteStockItem}
                onEditStock={(item) => setEditingProduct(item)}
                onDeleteSupplier={deleteSupplier}
                onQuickRestock={(item) => {
                  setRestockingItem(item);
                  setRestockQty('');
                  setRestockMode('add');
                }}
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
                onOpenCallModal={openCallModal}
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
              theme={theme}
              isLight={isLight}
            />
          )}
          {editingProduct && (
            <EditProductModal
              product={editingProduct}
              suppliers={data.suppliers}
              onClose={() => setEditingProduct(null)}
              onUpdate={() => {
                onDataRefresh?.();
                setEditingProduct(null);
              }}
              theme={theme}
              isLight={isLight}
            />
          )}
          {isAddingStock && (
            <AddStockModal
              onClose={() => setIsAddingStock(false)}
              suppliers={data.suppliers}
              items={data.items}
              onStockAdded={() => {
                onDataRefresh?.();
              }}
              theme={theme}
              isLight={isLight}
            />
          )}
          {isAddingSupplier && (
            <AddSupplierModal
              onClose={() => setIsAddingSupplier(false)}
              onSupplierAdded={() => {
                onDataRefresh?.();
              }}
              theme={theme}
              isLight={isLight}
            />
          )}
          {restockingItem && (
            <div
              className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
                isLight ? 'bg-black/40' : 'bg-black/70'
              }`}
              onClick={(e) => { if (e.target === e.currentTarget) setRestockingItem(null); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl transition-colors ${
                  isLight ? 'border-zinc-200 bg-white text-black' : 'border-zinc-800 bg-[#0A0C0F] text-white'
                }`}
              >
                <div className={`flex items-center justify-between border-b pb-3 ${
                  isLight ? 'border-zinc-200' : 'border-zinc-800'
                }`}>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${
                    isLight ? 'text-black' : 'text-white'
                  }`}>
                    <PackagePlus className={`h-5 w-5 ${isLight ? 'text-black' : 'text-white'}`} />
                    Quick Restock Product
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRestockingItem(null)}
                    className={`rounded-full p-1 transition ${
                      isLight ? 'text-zinc-400 hover:bg-zinc-100 hover:text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleQuickRestockSubmit} className="mt-4 space-y-4">
                  <div className={`p-3 rounded-xl border ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-900/60 border-zinc-800'}`}>
                    <div className="font-bold text-sm">{restockingItem.name}</div>
                    <div className={`text-xs mt-0.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      Current Stock: <strong className={`font-bold ${isLight ? 'text-black' : 'text-white'}`}>{restockingItem.qty || 0} {restockingItem.unit || 'pcs'}</strong>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                      isLight ? 'text-zinc-700' : 'text-zinc-400'
                    }`}>
                      New Incoming Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                      placeholder="e.g. 50"
                      autoFocus
                      required
                      className={`w-full h-11 rounded-xl border px-4 text-sm font-bold outline-none transition ${
                        isLight ? 'bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 focus:border-black focus:bg-white' : 'bg-black/60 border-zinc-800 text-white placeholder:text-white/34 focus:border-zinc-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? 'text-zinc-700' : 'text-zinc-400'
                    }`}>
                      Restock Action
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRestockMode('add')}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                          restockMode === 'add'
                            ? (isLight ? 'border-black bg-black text-white shadow-sm' : 'border-white bg-white text-black font-extrabold shadow-sm')
                            : (isLight ? 'border-zinc-300 bg-zinc-50 text-zinc-600 hover:bg-zinc-100' : 'border-zinc-800 bg-black/40 text-zinc-400 hover:bg-zinc-900')
                        }`}
                      >
                        ➕ Add to Current
                        <div className={`text-[11px] font-normal mt-0.5 ${restockMode === 'add' ? (isLight ? 'text-zinc-200' : 'text-zinc-800') : (isLight ? 'text-zinc-500' : 'text-zinc-400')}`}>
                          {restockingItem.qty || 0} + {Number(restockQty || 0)} = <strong>{Number(restockingItem.qty || 0) + Number(restockQty || 0)}</strong>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRestockMode('replace')}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition ${
                          restockMode === 'replace'
                            ? (isLight ? 'border-black bg-black text-white shadow-sm' : 'border-white bg-white text-black font-extrabold shadow-sm')
                            : (isLight ? 'border-zinc-300 bg-zinc-50 text-zinc-600 hover:bg-zinc-100' : 'border-zinc-800 bg-black/40 text-zinc-400 hover:bg-zinc-900')
                        }`}
                      >
                        🔄 Set New Total
                        <div className={`text-[11px] font-normal mt-0.5 ${restockMode === 'replace' ? (isLight ? 'text-zinc-200' : 'text-zinc-800') : (isLight ? 'text-zinc-500' : 'text-zinc-400')}`}>
                          New Total = <strong>{Number(restockQty || 0)}</strong>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRestockingItem(null)}
                      className={`h-10 rounded-xl px-4 text-xs font-bold transition border ${
                        isLight ? 'text-zinc-600 hover:bg-zinc-100 hover:text-black border-zinc-300' : 'text-zinc-400 hover:text-white border-zinc-800'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`h-10 rounded-xl px-5 text-xs font-extrabold shadow-sm transition border-0 ${
                        isLight ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      Save Stock
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Web Phone & Communication System Modal */}
        <WebCallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          recipient={activeCallRecipient}
          theme={theme}
        />
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
  billSessions,
  activeSessionId,
  onAddNewSession,
  onSwitchSession,
  onCloseSession,
  onToggleHoldSession,
  onRenameSession,
  onDuplicateSession,
  onTransferItem,
  onClearCart,
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
  onUpdateCartPrice,
  onOpenCallModal,
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
  billSessions: BillSession[];
  activeSessionId: string;
  onAddNewSession: (customLabel?: string, initialCustomer?: any) => void;
  onSwitchSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
  onToggleHoldSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newLabel: string, customTag?: string) => void;
  onDuplicateSession: (sessionId: string) => void;
  onTransferItem: (fromSessionId: string, toSessionId: string, itemId: string) => void;
  onClearCart: () => void;
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
  onUpdateCartPrice?: (id: string, price: number) => void;
  onOpenCallModal?: (recipient?: CallRecipient | null) => void;
}) {
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const isLight = theme === 'light';
  const [customerSearch, setCustomerSearch] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [cartQuery, setCartQuery] = useState('');
  const [mobileBillingTab, setMobileBillingTab] = useState<'products' | 'cart'>('products');

  // Multi-Bill Modals State
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [renamingSession, setRenamingSession] = useState<BillSession | null>(null);
  const [renameLabelInput, setRenameLabelInput] = useState('');
  const [renameTagInput, setRenameTagInput] = useState('');

  const activeSession = useMemo(() => {
    return billSessions.find((s) => s.id === activeSessionId) || billSessions[0];
  }, [billSessions, activeSessionId]);

  const heldCount = useMemo(() => {
    return billSessions.filter((s) => s.isHeld).length;
  }, [billSessions]);

  const totalPipelineRevenue = useMemo(() => {
    return billSessions.reduce((totalSum, session) => {
      const sessSubtotal = (session.cart || []).reduce((sum, i) => sum + i.price * i.qty, 0);
      const sessDiscount = Math.max(0, Number(session.discount || 0));
      const sessTax = Math.max(0, Number(session.tax || 0));
      return totalSum + Math.max(0, sessSubtotal - sessDiscount + sessTax);
    }, 0);
  }, [billSessions]);

  // Global Cashier Keyboard Shortcuts (Alt+N, Alt+H, Alt+O, Alt+W, Alt+1..9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'n') {
        e.preventDefault();
        onAddNewSession();
      } else if (key === 'h') {
        e.preventDefault();
        onToggleHoldSession(activeSessionId);
      } else if (key === 'o' || key === 'g') {
        e.preventDefault();
        setIsOverviewOpen((prev) => !prev);
      } else if (key === 'w') {
        e.preventDefault();
        onCloseSession(activeSessionId);
      } else {
        const digit = parseInt(e.key, 10);
        if (!isNaN(digit) && digit >= 1 && digit <= 9) {
          const targetSession = billSessions[digit - 1];
          if (targetSession) {
            e.preventDefault();
            onSwitchSession(targetSession.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billSessions, activeSessionId, onAddNewSession, onSwitchSession, onCloseSession, onToggleHoldSession]);

  const openRenameModal = (session: BillSession) => {
    setRenamingSession(session);
    setRenameLabelInput(session.label || '');
    setRenameTagInput(session.customTag || '');
  };

  const saveRenameModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingSession) return;
    onRenameSession(renamingSession.id, renameLabelInput.trim() || renamingSession.label, renameTagInput.trim());
    setRenamingSession(null);
  };

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
    <div className={`relative overflow-hidden rounded-sm p-2 transition-colors duration-200 md:p-3 border ${
      isLight
        ? 'border-zinc-200 bg-white text-black shadow-sm'
        : 'border-zinc-800 bg-black text-white'
    }`}>
      <div className="relative space-y-2.5">
        {/* ========================================================================= */}
        {/* MULTI-CUSTOMER CONCURRENT COUNTER BAR (TAB STRIP & QUICK ACTIONS) */}
        {/* ========================================================================= */}
        <div className={`rounded-sm p-2.5 border transition-all shadow-xs ${
          isLight
            ? 'border-zinc-200 bg-zinc-50/90 text-black'
            : 'border-zinc-800 bg-zinc-950 text-white'
        }`}>
          {/* Top Bar: Title, Metrics, and Global Quick Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-sm border ${
                isLight ? 'border-zinc-300 bg-white text-black' : 'border-zinc-700 bg-zinc-900 text-white'
              }`}>
                <Layers className="h-4 w-4" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] font-black uppercase tracking-wider">Multi-Customer POS Counter</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {billSessions.length} {billSessions.length === 1 ? 'Customer Lane' : 'Customer Lanes'}
                </span>
                {heldCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Pause className="h-2.5 w-2.5" />
                    {heldCount} on hold
                  </span>
                )}
              </div>
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Hold / Resume Current Active Bill */}
              <button
                type="button"
                onClick={() => onToggleHoldSession(activeSessionId)}
                className={`inline-flex items-center gap-1.5 h-7.5 rounded-sm border px-2.5 text-[11.5px] font-bold transition-all ${
                  activeSession?.isHeld
                    ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30'
                    : isLight
                      ? 'border-zinc-300 bg-white text-zinc-700 hover:text-black hover:border-black'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-500'
                }`}
                title="Park / Hold this customer's bill while they wait (Alt+H)"
              >
                {activeSession?.isHeld ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3" />}
                <span>{activeSession?.isHeld ? 'Resume Bill' : 'Hold / Park'}</span>
                <span className="text-[9.5px] opacity-60 ml-0.5 font-mono">Alt+H</span>
              </button>

              {/* All Bills Overview Grid Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsOverviewOpen(true)}
                className={`inline-flex items-center gap-1.5 h-7.5 rounded-sm border px-2.5 text-[11.5px] font-bold transition-all ${
                  isLight
                    ? 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 hover:border-black'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-500'
                }`}
                title="View all active customer bills side-by-side (Alt+O)"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>All Bills ({billSessions.length})</span>
                <span className="text-[9.5px] opacity-60 ml-0.5 font-mono">Alt+O</span>
              </button>

              {/* Clear Cart for Current Bill */}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all items from this customer bill?')) {
                      onClearCart();
                    }
                  }}
                  className={`inline-flex items-center gap-1 h-7.5 rounded-sm border px-2 text-[11px] font-bold transition-all ${
                    isLight
                      ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'border-red-900/50 bg-red-950/40 text-red-400 hover:bg-red-900/60'
                  }`}
                  title="Clear items in current bill"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer Bill Lane Tabs (Horizontal Scrollable Strip) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-400">
            <div className="flex items-center gap-1.5 min-w-max">
              {billSessions.map((session, index) => {
                const isActive = session.id === activeSessionId;
                const sessionItemCount = (session.cart || []).reduce((sum, item) => sum + item.qty, 0);
                const sessionSubtotal = (session.cart || []).reduce((sum, item) => sum + item.price * item.qty, 0);
                const sessionDiscount = Math.max(0, Number(session.discount || 0));
                const sessionTax = Math.max(0, Number(session.tax || 0));
                const sessionGrandTotal = Math.max(0, sessionSubtotal - sessionDiscount + sessionTax);
                const customer = session.customerId === 'walk-in'
                  ? null
                  : data.customers.find((c: any) => String(c.id) === String(session.customerId));
                const displayName = session.customTag || (customer ? customer.name : session.label || `Bill #${index + 1}`);

                return (
                  <div
                    key={session.id}
                    className={`group relative flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-[12px] font-bold transition-all select-none ${
                      isActive
                        ? isLight
                          ? 'border-black bg-white text-black shadow-md ring-1 ring-black/10'
                          : 'border-white bg-zinc-900 text-white shadow-md ring-1 ring-white/20'
                        : isLight
                          ? 'border-zinc-200 bg-white/70 text-zinc-700 hover:border-zinc-400 hover:bg-white'
                          : 'border-zinc-800 bg-black/60 text-zinc-400 hover:border-zinc-600 hover:text-white'
                    }`}
                  >
                    {/* Lane Number & Hotkey Pill */}
                    <button
                      type="button"
                      onClick={() => onSwitchSession(session.id)}
                      className="flex items-center gap-1.5 text-left outline-none"
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-xs text-[10.5px] font-black ${
                        isActive
                          ? isLight ? 'bg-black text-white' : 'bg-white text-black'
                          : isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-300'
                      }`} title={`Alt+${index + 1}`}>
                        {index + 1}
                      </span>

                      {/* Status Icon */}
                      {session.isHeld ? (
                        <span className="text-amber-500" title="Held / Parked">
                          <Pause className="h-3 w-3 fill-current" />
                        </span>
                      ) : (
                        <span className={isActive ? (isLight ? 'text-black' : 'text-emerald-400') : 'text-zinc-500'}>
                          <ShoppingBag className="h-3 w-3" />
                        </span>
                      )}

                      {/* Customer Name / Label */}
                      <span className={`truncate max-w-[110px] sm:max-w-[140px] font-extrabold ${
                        isActive ? (isLight ? 'text-black' : 'text-white') : ''
                      }`}>
                        {displayName}
                      </span>

                      {/* Items & Total Pill */}
                      <span className={`inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[10.5px] font-black ${
                        isActive
                          ? isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-800 text-white'
                          : isLight ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-900 text-zinc-400'
                      }`}>
                        <span>{sessionItemCount}</span>
                        <span>•</span>
                        <span>₹{formatMoney(sessionGrandTotal)}</span>
                      </span>
                    </button>

                    {/* Quick Rename & Tag Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameModal(session);
                      }}
                      className={`p-1 rounded-xs transition opacity-60 hover:opacity-100 ${
                        isLight ? 'hover:bg-zinc-200 text-zinc-600' : 'hover:bg-zinc-800 text-zinc-300'
                      }`}
                      title="Rename or tag customer bill"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>

                    {/* Close Session Tab Button */}
                    {billSessions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCloseSession(session.id);
                        }}
                        className={`p-1 rounded-xs transition opacity-60 hover:opacity-100 hover:text-red-500 ${
                          isLight ? 'hover:bg-red-50' : 'hover:bg-red-950'
                        }`}
                        title="Close customer bill tab (Alt+W if active)"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* "+ New Customer Bill" Button */}
              <button
                type="button"
                onClick={() => onAddNewSession()}
                className={`inline-flex items-center gap-1.5 h-8.5 rounded-sm border px-3 text-[12px] font-bold transition-all shadow-xs touch-manipulation active:scale-[0.98] ${
                  isLight
                    ? 'border-black bg-black text-white hover:bg-zinc-800 shadow-zinc-300/60'
                    : 'border-white bg-white text-black hover:bg-zinc-200 shadow-black/60'
                }`}
                title="Open a new customer bill lane (Alt+N)"
              >
                <Plus className="h-3.5 w-3.5 stroke-[2.4]" />
                <span>New Bill</span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded-xs ${
                  isLight ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'
                }`}>
                  Alt+N
                </span>
              </button>
            </div>
          </div>

          {/* Quick Cashier Shortcuts Tips Bar */}
          <div className={`mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-semibold px-1 ${
            isLight ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span>💡 <strong>Cashier Hotkeys:</strong></span>
              <span><kbd className="px-1 py-0.5 rounded border border-current font-mono text-[9.5px]">Alt+1..9</kbd> Switch Lanes</span>
              <span><kbd className="px-1 py-0.5 rounded border border-current font-mono text-[9.5px]">Alt+N</kbd> New Customer</span>
              <span><kbd className="px-1 py-0.5 rounded border border-current font-mono text-[9.5px]">Alt+H</kbd> Hold/Park</span>
              <span><kbd className="px-1 py-0.5 rounded border border-current font-mono text-[9.5px]">Alt+O</kbd> All Bills Grid</span>
            </div>
            <div>
              <span>Current: <strong>{activeSession?.customTag || activeSession?.label}</strong> ({itemCount} items, ₹{formatMoney(grandTotal)})</span>
            </div>
          </div>
        </div>

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
          <div className={`space-y-2.5 ${mobileBillingTab === 'cart' ? 'hidden xl:block' : 'block'}`}>
            {/* WALK-IN CUSTOMER & SEARCH FOR OLD CUSTOMER (Top of Left Section) */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className={`rounded-sm p-3 border ${
                isLight
                  ? 'border-zinc-200 bg-zinc-50/80 text-black'
                  : 'border-zinc-800 bg-black text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-current" />
                  <span className="text-[12px] font-bold uppercase tracking-wider">Customer Selection</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onAddCustomer}
                    className={`inline-flex items-center gap-1.5 h-9.5 rounded-full border px-3.5 sm:px-4 text-[12.5px] font-bold transition-all shadow-xs active:scale-[0.97] touch-manipulation ${
                      isLight
                        ? 'border-black bg-black text-white hover:bg-zinc-800'
                        : 'border-white bg-white text-black hover:bg-zinc-200'
                    }`}
                    title="Add New Customer"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0 stroke-[2.2]" />
                    <span>New Customer</span>
                  </button>
                </div>
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {/* Left Select: Walk in Customer dropdown */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1 ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
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
                    className={`h-9 w-full rounded-sm border px-3 text-[12.5px] font-semibold outline-none transition ${
                      isLight
                        ? 'border-zinc-300 bg-white text-black focus:border-black'
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
                  <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1 ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}>
                    Search Old Customer
                  </label>
                  <div className={`flex h-9 items-center gap-2 rounded-sm border px-3 transition-all shadow-2xs ${
                    isLight
                      ? 'border-zinc-300 bg-white text-black focus-within:border-black focus-within:ring-1 focus-within:ring-black'
                      : 'border-zinc-800 bg-black text-white focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-white'
                  }`}>
                    <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
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
                    <div className={`absolute left-0 right-0 top-full z-40 mt-1 max-h-44 overflow-y-auto rounded-sm border p-1 shadow-xl backdrop-blur-md ${
                      isLight ? 'border-zinc-300 bg-white text-zinc-900 shadow-zinc-300/50' : 'border-zinc-800 bg-zinc-950 text-white shadow-black/80'
                    }`}>
                      {displayedCustomers.length === 0 ? (
                        <div className="p-2.5 text-center text-[12px] opacity-50">No customer found</div>
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
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold transition ${
                              isLight ? 'hover:bg-zinc-100 hover:text-black' : 'hover:bg-zinc-900 hover:text-white'
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
              className={`rounded-sm p-3 border ${
                isLight
                  ? 'border-zinc-200 bg-zinc-50/80 text-black'
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
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && sortedProducts.length > 0) {
                    onAddToCart(sortedProducts[0]);
                  }
                }}
              />

              {/* Product List */}
              <div className="mt-2 space-y-1.5 h-[180px] sm:h-[220px] xl:h-[calc(100vh-440px)] xl:min-h-[180px] xl:max-h-[360px] 2xl:max-h-[440px] overflow-y-auto pr-1">
                {sortedProducts.map((item, index) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => onAddToCart(item)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: index * 0.015, ease: 'easeOut' }}
                    whileHover={{ scale: 1.002, x: 2 }}
                    className={`group relative flex w-full items-center justify-between gap-2 rounded-sm border px-3 py-2 text-left transition-all ${
                      isLight
                        ? 'border-zinc-200 bg-white hover:border-black text-black shadow-2xs'
                        : 'border-zinc-800 bg-black hover:border-zinc-600 text-white'
                    }`}
                  >
                    <span className="absolute inset-y-0 left-0 w-1 rounded-l-sm bg-black dark:bg-white opacity-0 transition group-hover:opacity-100" />
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[12.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                        {item.name || 'Unnamed item'}
                      </div>
                      <div className={`mt-0.5 flex items-center gap-1.5 text-[11px] ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        <span>Stock: <strong className={isLight ? 'text-black' : 'text-white'}>{Number(item.qty || 0)} {item.unit || 'pcs'}</strong></span>
                        <span>•</span>
                        <span className="truncate">{item.category || 'General'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`rounded-sm px-2.5 py-1 text-[11.5px] font-bold border ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-100 text-black'
                          : 'border-zinc-800 bg-zinc-900 text-white'
                      }`}>
                        ₹{formatMoney(Number(item.price || 0))}
                      </span>
                      <span className={`inline-flex h-7 items-center justify-center rounded-sm px-3 text-[11.5px] font-bold transition shadow-sm ${
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
                  <div className={`rounded-sm p-4 text-center text-[12.5px] border ${
                    isLight ? 'border-zinc-200 bg-white text-zinc-500' : 'border-zinc-800 bg-black text-zinc-400'
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
            className={`rounded-sm p-3 sm:p-3.5 flex flex-col h-full border ${
              isLight
                ? 'border-zinc-200 bg-zinc-50/80 text-black'
                : 'border-zinc-800 bg-black text-white'
            } ${mobileBillingTab === 'products' ? 'hidden xl:flex' : 'flex'}`}
          >
            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-1 items-center gap-2 min-w-[220px]">
                <PanelHeader
                  isLight={isLight}
                  icon={ReceiptText}
                  title="Smart Invoice Composer"
                  meta={activeSession?.customTag || (selectedCustomer ? selectedCustomer.name : 'Walk-in')}
                />
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => onOpenCallModal?.({ name: selectedCustomer.name, phone: selectedCustomer.phone || '', role: 'Customer' })}
                    className={`inline-flex items-center gap-1.5 h-8.5 rounded-full border px-3 text-[12px] font-bold transition-all shadow-xs active:scale-[0.97] shrink-0 touch-manipulation ${
                      isLight
                        ? 'border-emerald-600/80 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-700'
                        : 'border-emerald-700/80 bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900 hover:border-emerald-500'
                    }`}
                    title={`Call ${selectedCustomer.name} via Web Dialer`}
                  >
                    <PhoneCall className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>Call {selectedCustomer.name.split(' ')[0]}</span>
                  </button>
                )}
                {selectedCustomer?.phone && (
                  <ContactActionGroup
                    phone={selectedCustomer.phone}
                    name={selectedCustomer.name || 'Customer'}
                    role="Customer"
                    onOpenCallModal={onOpenCallModal}
                    isLight={isLight}
                  />
                )}

                {/* SEARCH BAR BESIDE SMART INVOICE COMPOSER NAME */}
                <label className={`flex h-9 flex-1 items-center gap-2 rounded-sm border px-3 transition-all min-w-[150px] sm:min-w-[180px] shadow-2xs ${
                  isLight
                    ? 'border-zinc-300 bg-white text-black focus-within:border-black focus-within:ring-1 focus-within:ring-black'
                    : 'border-zinc-800 bg-black text-white focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-white'
                }`}>
                  <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <input
                    value={cartQuery}
                    onChange={(event) => setCartQuery(event.target.value)}
                    placeholder="Search items in cart..."
                    className="w-full bg-transparent text-sm md:text-[12.5px] font-semibold outline-none placeholder:text-zinc-500"
                  />
                </label>
              </div>

              {/* ITEMS IN CART BADGE & SELECT ALL CONTROLS */}
              <div className="flex items-center gap-2 shrink-0">
                {cart.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <label className={`flex items-center gap-1 cursor-pointer select-none ${isLight ? 'text-zinc-700 hover:text-black' : 'text-zinc-400 hover:text-white'}`}>
                      <input
                        type="checkbox"
                        checked={cart.length > 0 && cart.every((i) => i.checked !== false)}
                        onChange={(e) => onToggleAllCartItemsCheck?.(e.target.checked)}
                        className="h-3.5 w-3.5 rounded-sm accent-black dark:accent-white cursor-pointer"
                        title="Select all items"
                      />
                      <span>All</span>
                    </label>
                    {cart.some((i) => i.checked !== false) && (
                      <button
                        type="button"
                        onClick={() => onRemoveSelectedFromCart?.()}
                        className="text-red-600 dark:text-red-400 hover:underline transition text-[10.5px] uppercase tracking-wider font-extrabold"
                        title="Remove selected items"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
                <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-bold shrink-0 shadow-sm transition-all ${
                  isLight
                    ? 'border-zinc-900 bg-black text-white'
                    : 'border-white bg-white text-black'
                }`}>
                  <span className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isLight ? 'bg-white' : 'bg-black'}`}></span>
                  </span>
                  <span className="whitespace-nowrap">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
                </div>
              </div>
            </div>

            {/* EXPANDED Cart Items List - Fully utilizes all available space */}
            <div className={`mt-2 flex-1 min-h-[200px] sm:min-h-[240px] xl:min-h-[280px] overflow-y-auto rounded-sm p-2 border ${
              isLight ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-black'
            }`}>
              {cart.length === 0 ? (
                <div className={`flex h-full min-h-[180px] flex-col items-center justify-center rounded-sm border border-dashed text-center text-[13px] font-medium leading-relaxed p-6 ${
                  isLight ? 'border-zinc-300 text-zinc-500' : 'border-zinc-800 text-zinc-400'
                }`}>
                  <ReceiptText className="h-7 w-7 mb-2 opacity-40 text-current" />
                  <span>Add products from Product Command to begin a stock-linked bill.</span>
                </div>
              ) : filteredCart.length === 0 ? (
                <div className={`flex h-full min-h-[180px] flex-col items-center justify-center rounded-sm border border-dashed text-center text-[13px] font-medium leading-relaxed p-6 ${
                  isLight ? 'border-zinc-300 text-zinc-500' : 'border-zinc-800 text-zinc-400'
                }`}>
                  <span>No cart items match your search query.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredCart.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-2.5 rounded-sm border px-3 py-2 transition-all ${
                        isLight
                          ? 'border-zinc-200 bg-zinc-50/90 text-black hover:border-zinc-300'
                          : 'border-zinc-800 bg-zinc-950 text-white hover:border-zinc-700'
                      }`}
                    >
                      {/* Verification Checkbox */}
                      <label className="flex items-center shrink-0 cursor-pointer pr-0.5" title="Verify item in cart">
                        <input
                          type="checkbox"
                          checked={!!item.checked}
                          onChange={() => onToggleCartItemCheck?.(item.id)}
                          className={`h-4 w-4 rounded-sm cursor-pointer transition accent-black dark:accent-white ${
                            isLight ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900'
                          }`}
                        />
                      </label>

                      {/* Item Name */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="truncate text-[13px] sm:text-sm font-bold">{item.name}</span>
                      </div>

                      {/* Editable Unit Price Input */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className={`flex h-7.5 items-center rounded-sm border px-2 transition ${
                            isLight
                              ? 'border-zinc-300 bg-white focus-within:border-black'
                              : 'border-zinc-700 bg-zinc-900 focus-within:border-white'
                          }`}
                          title="Click to edit unit price"
                        >
                          <span className="text-xs font-bold text-zinc-500 mr-0.5">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.price}
                            onChange={(event) => onUpdateCartPrice?.(item.id, parseFloat(event.target.value) || 0)}
                            className="w-16 bg-transparent text-xs font-bold outline-none"
                            placeholder="0"
                            aria-label={`Unit price for ${item.name}`}
                          />
                          {item.unit ? <span className="text-[11px] text-zinc-400 font-medium ml-0.5">/{item.unit}</span> : null}
                        </div>
                        {item.originalPrice !== undefined && item.price !== item.originalPrice && (
                          <button
                            type="button"
                            onClick={() => onUpdateCartPrice?.(item.id, item.originalPrice!)}
                            className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                            title={`Reset to original price (₹${item.originalPrice})`}
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className={`flex items-center shrink-0 rounded-sm border ${
                        isLight ? 'border-zinc-300 bg-white' : 'border-zinc-800 bg-black'
                      }`}>
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(item.id, item.qty - 1)}
                          className={`p-1.5 transition ${isLight ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'}`}
                          aria-label={`Decrease ${item.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          value={item.qty}
                          onChange={(event) => onUpdateCartQty(item.id, Number(event.target.value || 1))}
                          className="h-5 w-7 bg-transparent text-center text-xs font-bold outline-none"
                          inputMode="numeric"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(item.id, item.qty + 1)}
                          className={`p-1.5 transition ${isLight ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'}`}
                          aria-label={`Increase ${item.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="w-16 text-right text-[13.5px] font-extrabold shrink-0">
                        ₹{formatMoney(item.price * item.qty)}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(item.id)}
                        className={`rounded-sm p-1.5 shrink-0 transition ${
                          isLight
                            ? 'text-zinc-400 hover:bg-red-50 hover:text-red-600'
                            : 'text-zinc-500 hover:bg-red-950 hover:text-red-300'
                        }`}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Input fields */}
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
              <FormSelect isLight={isLight} value={paymentMethod} onChange={onPaymentMethodChange} options={['cash', 'upi', 'card', 'credit']} />
              <FormInput isLight={isLight} value={notes} onChange={onNotesChange} placeholder="Notes" />
              <FormInput isLight={isLight} value={discount} onChange={onDiscountChange} placeholder="Discount (₹)" />
              <FormInput isLight={isLight} value={tax} onChange={onTaxChange} placeholder="Tax (₹)" />
            </div>

            {/* Quick Discount Buttons */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                  className={`inline-flex h-6.5 items-center gap-1 rounded-sm border px-2.5 text-[11px] font-bold transition-all shadow-2xs ${
                    isLight
                      ? 'border-zinc-300 bg-white text-black hover:bg-zinc-100 hover:border-black'
                      : 'border-zinc-800 bg-black text-white hover:bg-zinc-900 hover:border-zinc-600'
                  }`}
                >
                  <BadgePercent className={`h-3 w-3 ${isLight ? 'text-black' : 'text-white'}`} />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

            {/* Subtotal, Discount & Tax Breakdown Row */}
            <div className={`mt-2 rounded-sm border px-3 py-2 ${
              isLight ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-zinc-950'
            }`}>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-[13px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Subtotal:</span>
                  <span className="font-extrabold text-black dark:text-white">₹{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Discount:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {discountAmount > 0 ? `-₹${formatMoney(discountAmount)}` : '₹0'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Tax:</span>
                  <span className="font-extrabold text-black dark:text-white">₹{formatMoney(taxAmount)}</span>
                </div>
              </div>
            </div>

            {/* Dedicated Standout GRAND TOTAL Bar */}
            <div className={`mt-2 rounded-sm border p-3 flex items-center justify-between transition-all ${
              isLight
                ? 'border-zinc-300 bg-zinc-100/90 text-black shadow-xs'
                : 'border-zinc-800 bg-zinc-950 text-white shadow-xs'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-sm border ${
                  isLight
                    ? 'bg-white border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                }`}>
                  <ReceiptText className="h-4 w-4" />
                </div>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    Grand Total Payable
                  </div>
                  <div className={`text-[11px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} in bill
                    {discountAmount > 0 ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {` • Saved ₹${formatMoney(discountAmount)}`}
                      </span>
                    ) : ''}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xl sm:text-2xl font-black tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
                  ₹{formatMoney(grandTotal)}
                </span>
              </div>
            </div>

            {status.message ? (
              <div className={`mt-2 rounded-sm px-3 py-1.5 text-xs font-bold border ${
                status.type === 'error'
                  ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                  : 'border-zinc-300 bg-zinc-100 text-black dark:border-zinc-800 dark:bg-black dark:text-white'
              }`}>
                {status.message}
              </div>
            ) : null}

            {/* Action CTAs: Create Bill, PDF, SMS, WhatsApp & Print */}
            <div className="mt-2 grid gap-1.5 sm:grid-cols-[1fr_auto_auto_auto_auto]">
              <button
                type="button"
                onClick={onCreateBill}
                disabled={cart.length === 0 || isBilling}
                className={`inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-sm px-5 text-[13px] sm:text-sm font-bold transition-all border-0 shadow-md ${
                  isLight
                    ? 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400'
                    : 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500'
                }`}
              >
                <CheckCircle2 className="h-4.5 w-4.5" />
                {isBilling ? 'Creating bill...' : 'Create Bill & Deduct Stock'}
              </button>
              <IconAction isLight={isLight} disabled={!lastInvoice} onClick={() => lastInvoice && downloadInvoicePDF(lastInvoice, { shopName: 'EasyTrader' })} icon={FileText} label="PDF" />
              <IconAction isLight={isLight} disabled={!lastInvoice} onClick={() => lastInvoice && sendInvoiceTextMessage(lastInvoice, { shopName: 'EasyTrader', channel: 'sms' })} icon={MessageSquare} label="SMS" />
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
              className="flex w-full items-center justify-between gap-3 rounded-sm border border-zinc-700 bg-white px-4 py-3 text-black shadow-2xl transition hover:bg-zinc-100 touch-manipulation min-h-[48px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-black text-white text-[12px] font-black">
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

      {/* ========================================================================= */}
      {/* MULTI-BILL ALL-LANES OVERVIEW GRID MODAL */}
      {/* ========================================================================= */}
      {isOverviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`relative flex flex-col w-full max-w-5xl max-h-[90vh] rounded-lg border shadow-2xl overflow-hidden ${
            isLight ? 'border-zinc-300 bg-white text-black' : 'border-zinc-800 bg-zinc-950 text-white'
          }`}>
            {/* Modal Header */}
            <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b ${
              isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-800 bg-zinc-900/80'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-md ${isLight ? 'bg-black text-white' : 'bg-white text-black'}`}>
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">Concurrent Customer Lanes Overview</h3>
                  <p className={`text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Active Customer Pipeline: <strong>₹{formatMoney(totalPipelineRevenue)}</strong> across {billSessions.length} open bill{billSessions.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onAddNewSession();
                    setIsOverviewOpen(false);
                  }}
                  className={`inline-flex items-center gap-1.5 h-9 rounded-sm border px-3 text-xs font-bold transition shadow-sm ${
                    isLight
                      ? 'border-black bg-black text-white hover:bg-zinc-800'
                      : 'border-white bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.2]" />
                  <span>New Customer Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOverviewOpen(false)}
                  className={`p-2 rounded-sm border transition ${
                    isLight ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-700' : 'border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                  }`}
                  aria-label="Close overview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Responsive Grid of Customer Bills */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {billSessions.map((session, index) => {
                  const isCurrentActive = session.id === activeSessionId;
                  const sessionItemCount = (session.cart || []).reduce((sum, item) => sum + item.qty, 0);
                  const sessionSubtotal = (session.cart || []).reduce((sum, item) => sum + item.price * item.qty, 0);
                  const sessionDiscount = Math.max(0, Number(session.discount || 0));
                  const sessionTax = Math.max(0, Number(session.tax || 0));
                  const sessionGrandTotal = Math.max(0, sessionSubtotal - sessionDiscount + sessionTax);
                  const customer = session.customerId === 'walk-in'
                    ? null
                    : data.customers.find((c: any) => String(c.id) === String(session.customerId));
                  const displayName = session.customTag || (customer ? customer.name : session.label || `Bill #${index + 1}`);

                  return (
                    <div
                      key={session.id}
                      className={`relative flex flex-col justify-between rounded-lg border p-4 transition-all shadow-sm ${
                        isCurrentActive
                          ? isLight
                            ? 'border-black bg-zinc-50/90 ring-2 ring-black shadow-md'
                            : 'border-white bg-zinc-900 ring-2 ring-white shadow-md'
                          : isLight
                            ? 'border-zinc-200 bg-white hover:border-zinc-400 hover:shadow'
                            : 'border-zinc-800 bg-black hover:border-zinc-700 hover:shadow'
                      }`}
                    >
                      {/* Top Lane Header */}
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-sm text-xs font-black ${
                              isCurrentActive
                                ? isLight ? 'bg-black text-white' : 'bg-white text-black'
                                : isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-300'
                            }`}>
                              #{index + 1}
                            </span>
                            <div>
                              <div className="text-sm font-black truncate max-w-[150px]">{displayName}</div>
                              <div className={`text-[10.5px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                {customer?.phone ? customer.phone : 'Walk-in customer'}
                              </div>
                            </div>
                          </div>

                          {/* Status Pill */}
                          <div className="flex items-center gap-1">
                            {session.isHeld ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <Pause className="h-2.5 w-2.5" />
                                Held
                              </span>
                            ) : isCurrentActive ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            ) : (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                                isLight ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-900 text-zinc-400'
                              }`}>
                                Open
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Item List Preview */}
                        <div className="mt-3 space-y-1.5 min-h-[90px] max-h-[140px] overflow-y-auto pr-1">
                          {(session.cart || []).length === 0 ? (
                            <div className={`py-4 text-center text-xs italic ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              No items added yet
                            </div>
                          ) : (
                            (session.cart || []).slice(0, 4).map((i) => (
                              <div key={i.id} className="flex items-center justify-between text-xs">
                                <span className="truncate pr-2">{i.qty}× {i.name}</span>
                                <span className="font-mono font-bold shrink-0">₹{formatMoney(i.price * i.qty)}</span>
                              </div>
                            ))
                          )}
                          {(session.cart || []).length > 4 && (
                            <div className={`text-[11px] font-bold text-center pt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              + {(session.cart || []).length - 4} more items...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing Summary & Actions */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-baseline justify-between mb-3">
                          <span className={`text-xs font-bold uppercase tracking-wide ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            Grand Total ({sessionItemCount} pcs)
                          </span>
                          <span className="text-lg font-black">₹{formatMoney(sessionGrandTotal)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onSwitchSession(session.id);
                              setIsOverviewOpen(false);
                            }}
                            className={`inline-flex items-center justify-center gap-1.5 h-8 rounded-sm text-xs font-bold transition ${
                              isCurrentActive
                                ? isLight
                                  ? 'bg-black text-white'
                                  : 'bg-white text-black'
                                : isLight
                                  ? 'border border-zinc-300 bg-white hover:bg-zinc-100 text-black'
                                  : 'border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                            <span>{isCurrentActive ? 'Current Desk' : 'Switch To Bill'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleHoldSession(session.id)}
                            className={`inline-flex items-center justify-center gap-1.5 h-8 rounded-sm border text-xs font-bold transition ${
                              session.isHeld
                                ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                : isLight
                                  ? 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                                  : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {session.isHeld ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3" />}
                            <span>{session.isHeld ? 'Resume' : 'Hold'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK RENAME & CUSTOM TAG MODAL */}
      {/* ========================================================================= */}
      {renamingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-100">
          <form
            onSubmit={saveRenameModal}
            className={`w-full max-w-md rounded-lg border p-5 shadow-2xl ${
              isLight ? 'border-zinc-300 bg-white text-black' : 'border-zinc-800 bg-zinc-950 text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Rename Customer Bill Lane</h4>
              </div>
              <button
                type="button"
                onClick={() => setRenamingSession(null)}
                className={`p-1 rounded-sm ${isLight ? 'hover:bg-zinc-100 text-zinc-500' : 'hover:bg-zinc-900 text-zinc-400'}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wide mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Bill Title
                </label>
                <input
                  type="text"
                  value={renameLabelInput}
                  onChange={(e) => setRenameLabelInput(e.target.value)}
                  placeholder="e.g. Bill #1, Walk-in counter"
                  className={`w-full h-9 rounded-sm border px-3 text-xs font-semibold outline-none transition ${
                    isLight ? 'border-zinc-300 bg-white focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wide mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Custom Customer Tag / Reference Note (Optional)
                </label>
                <input
                  type="text"
                  value={renameTagInput}
                  onChange={(e) => setRenameTagInput(e.target.value)}
                  placeholder="e.g. Table 4, Blue Shirt Brother, Urgent delivery"
                  className={`w-full h-9 rounded-sm border px-3 text-xs font-semibold outline-none transition ${
                    isLight ? 'border-zinc-300 bg-white focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                  }`}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingSession(null)}
                className={`h-9 px-4 rounded-sm border text-xs font-bold transition ${
                  isLight ? 'border-zinc-300 hover:bg-zinc-100' : 'border-zinc-800 hover:bg-zinc-900'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`h-9 px-4 rounded-sm text-xs font-bold transition ${
                  isLight ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ModuleGallery({
  section,
  data,
  theme = 'dark',
  onDataRefresh,
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
  onEditStock,
  onPlaceSupplierOrder,
  onShareInvoice,
  onSendTextInvoice,
  onSharePromo,
  onSyncGoogleBusiness,
  onQuickRestock,
  onOpenCallModal,
}: {
  section: BusinessSectionKey;
  data: DashboardData;
  theme?: 'dark' | 'light';
  onDataRefresh?: () => Promise<void>;
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
  onEditStock?: (item: any) => void;
  onPlaceSupplierOrder: (item: any, supplier?: any) => void;
  onSharePromo: () => void;
  onSyncGoogleBusiness: () => void;
  onQuickRestock?: (item: any) => void;
  onOpenCallModal?: (recipient?: CallRecipient | null) => void;
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
    <div className={`relative overflow-hidden rounded-sm p-3 transition-colors duration-200 md:p-4 border ${
      isLight
        ? 'border-zinc-200 bg-white text-black shadow-sm'
        : 'border-zinc-800 bg-black text-white'
    }`}>
      <div className="relative">
        {section === 'customers' ? (
          <ModuleSection isLight={isLight} icon={Users} eyebrow="Customer Profiles" title="Customer Directory" description="Search and manage customer records, purchase histories, and total spent.">
            {/* Header Controls: Search Input + Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
              <RecentSearchInput
                value={customerSearchQuery}
                onChange={setCustomerSearchQuery}
                placeholder="Search customers by name or phone..."
                storageKey="customer_directory"
                isLight={isLight}
                className="min-w-[240px] max-w-md"
              />
              <div className="flex items-center gap-2.5 shrink-0">
                <span className={`h-11 flex items-center rounded-sm border px-4 text-[12px] font-extrabold shadow-2xs ${
                  isLight ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
                }`}>
                  {filteredCustomersList.length} {filteredCustomersList.length === 1 ? 'Customer' : 'Customers'}
                </span>
                <IconAction isLight={isLight} onClick={onAddCustomer} icon={UserPlus} label="Add New Customer" variant="primary" />
              </div>
            </div>

            {/* Compact Space-Efficient Customer Grid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomersList.map((customer: any) => (
                <div
                  key={customer.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-sm border px-3.5 py-2.5 transition-all ${
                    isLight
                      ? 'border-zinc-200 bg-zinc-50/80 text-black hover:bg-zinc-100 hover:border-black'
                      : 'border-zinc-900 bg-black hover:border-zinc-700 text-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[13.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                      {customer.name || 'Unnamed customer'}
                    </div>
                    <div className={`mt-0.5 text-[11.5px] font-medium flex items-center gap-2 flex-wrap ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      <span>{customer.phone || 'No phone'}</span>
                      {customer.phone && (
                        <ContactActionGroup
                          phone={customer.phone}
                          name={customer.name || 'Customer'}
                          role="Customer"
                          onOpenCallModal={onOpenCallModal}
                          isLight={isLight}
                        />
                      )}
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
                    className={`rounded-sm p-1.5 shrink-0 transition ${
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
                <div className={`col-span-full rounded-sm border p-6 text-center text-[13px] ${
                  isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : 'border-zinc-900 bg-black text-zinc-400'
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
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
              <RecentSearchInput
                value={stockSearchQuery}
                onChange={setStockSearchQuery}
                placeholder="Search stock by item, category, supplier..."
                storageKey="stock_inventory"
                isLight={isLight}
                className="min-w-[240px] max-w-md"
              />
              <div className="flex items-center gap-2.5 shrink-0">
                <span className={`h-11 flex items-center rounded-sm border px-4 text-[12px] font-extrabold shadow-2xs ${
                  isLight ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
                }`}>
                  {filteredStockList.length} Products
                </span>
                <IconAction isLight={isLight} onClick={onAddStock} icon={PackagePlus} label="Add New Stock" variant="primary" />
              </div>
            </div>

            {/* Compact Space-Efficient Stock Grid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStockList.map((item: any) => (
                <div
                  key={item.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-sm border px-3.5 py-2.5 transition-all ${
                    isLight
                      ? 'border-zinc-200 bg-zinc-50/80 text-black hover:bg-zinc-100 hover:border-black'
                      : 'border-zinc-900 bg-black hover:border-zinc-700 text-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13.5px] font-extrabold truncate ${isLight ? 'text-black' : 'text-white'}`}>
                        {item.name || 'Unnamed item'}
                      </span>
                      {Number(item.qty || 0) <= 0 && (
                        <span className="rounded-sm border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-extrabold text-white shrink-0">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <div className={`mt-1 flex flex-wrap items-center gap-2 text-[11.5px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      <span className={`font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>
                        ₹{formatMoney(Number(item.price || 0))}{item.unit && item.unit !== 'pcs' ? ` / ${item.unit}` : ''}
                      </span>
                      <span>•</span>
                      <span className={`font-bold ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
                        {Number(item.qty || 0)} in stock
                      </span>
                      {item.category && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.category}</span>
                        </>
                      )}
                      {item.supplierName && (
                        <>
                          <span>•</span>
                          <span className={`truncate font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                            Supplier: {item.supplierName}
                          </span>
                        </>
                      )}
                      {!item.category && !item.supplierName && (
                        <>
                          <span>•</span>
                          <span className="truncate">General</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditStock?.(item)}
                      className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[11.5px] font-bold transition border ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-100 text-black hover:bg-zinc-200'
                          : 'border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                      title="Edit Product Details"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickRestock?.(item)}
                      className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[11.5px] font-extrabold transition border ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-100 text-black hover:bg-zinc-200'
                          : 'border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                      title="Quick Restock / Add Stock"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Restock</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPlaceSupplierOrder?.(item)}
                      className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-[11.5px] font-bold transition border-0 ${
                        isLight
                          ? 'bg-black text-white hover:bg-zinc-800'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                      title="Order from Supplier"
                    >
                      <PackagePlus className="h-3.5 w-3.5" />
                      <span>Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteStock(item.id)}
                      className={`rounded-sm p-1.5 shrink-0 transition ${
                        isLight
                          ? 'text-zinc-400 hover:bg-red-50 hover:text-red-600'
                          : 'text-zinc-500 hover:bg-red-950 hover:text-red-300'
                      }`}
                      title="Delete stock"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredStockList.length === 0 ? (
                <div className={`col-span-full rounded-sm border p-6 text-center text-[13px] ${
                  isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : 'border-zinc-900 bg-black text-zinc-400'
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
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
              <RecentSearchInput
                value={invoiceSearchQuery}
                onChange={setInvoiceSearchQuery}
                placeholder="Search invoices by ID, customer name, phone..."
                storageKey="invoice_history"
                isLight={isLight}
                className="min-w-[240px] max-w-md"
              />
              <span className={`h-11 flex items-center rounded-sm border px-4 text-[12px] font-extrabold shadow-2xs ${
                isLight ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
              }`}>
                {filteredInvoicesList.length} {filteredInvoicesList.length === 1 ? 'Invoice' : 'Invoices'}
              </span>
            </div>

            {/* High-Density Compact Invoice List */}
            <div className="space-y-1.5">
              {filteredInvoicesList.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-sm border px-3.5 py-2.5 transition-all ${
                    isLight
                      ? 'border-zinc-200 bg-zinc-50/80 text-black hover:bg-zinc-100 hover:border-black'
                      : 'border-zinc-900 bg-black hover:border-zinc-700 text-white'
                  }`}
                >
                  <div className="min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className={`text-[13.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                        {invoice.customer?.name || 'Walk-in Customer'}
                      </span>
                      <span className={`rounded-sm px-1.5 py-0.5 text-[10.5px] font-bold border ${
                        isLight ? 'border-zinc-300 bg-zinc-200 text-black' : 'border-zinc-800 bg-zinc-800 text-white'
                      }`}>
                        INV-{String(invoice.id).slice(0, 6)}
                      </span>
                    </div>
                    {invoice.customer?.phone && (
                      <div className="mt-1">
                        <ContactActionGroup
                          phone={invoice.customer.phone}
                          name={invoice.customer.name || 'Customer'}
                          role="Customer"
                          onOpenCallModal={onOpenCallModal}
                          isLight={isLight}
                        />
                      </div>
                    )}
                    <div className={`mt-0.5 text-[11.5px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
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
                      onClick={() => onShareInvoice?.(invoice)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition border-0 ${
                        isLight
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-emerald-500 text-black hover:bg-emerald-400 font-bold'
                      }`}
                      title="Send bill text message & download PDF invoice on WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-current" />
                      <span>WhatsApp Bill</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadInvoice(invoice)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition border-0 ${
                        isLight
                          ? 'bg-black text-white hover:bg-zinc-800'
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                      title="Print or download PDF Tax Invoice"
                    >
                      <Printer className="h-3.5 w-3.5 text-current" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              ))}
              {filteredInvoicesList.length === 0 ? (
                <div className={`rounded-sm border p-6 text-center text-[13px] ${
                  isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : 'border-zinc-900 bg-black text-zinc-400'
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
                className={`rounded-sm border p-4 shadow-xs ${
                  isLight ? 'border-zinc-200 bg-zinc-50/80 text-black' : 'border-zinc-800 bg-black text-white'
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
                    className={`h-10.5 rounded-sm border px-3.5 text-[13.5px] font-semibold outline-none transition sm:col-span-2 ${
                      isLight
                        ? 'border-zinc-300 bg-white text-black focus:border-black'
                        : 'border-zinc-800 bg-black text-white focus:border-white'
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
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-sm px-5 text-[13.5px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                      isLight
                        ? 'bg-black text-white hover:bg-zinc-800'
                        : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    {isGeneratingPromo ? 'Generating...' : 'Generate Promo'}
                  </button>
                  <IconAction isLight={isLight} disabled={isSyncingGoogle} onClick={onSyncGoogleBusiness} icon={ExternalLink} label={isSyncingGoogle ? 'Syncing...' : 'Google Sync'} />
                </div>

                {marketingStatus.message ? (
                  <div className={`mt-4 rounded-sm border px-3.5 py-2.5 text-[13px] font-semibold ${marketingStatus.type === 'error' ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200' : 'border-zinc-300 bg-zinc-100 text-black dark:border-zinc-800 dark:bg-black dark:text-white'}`}>
                    {marketingStatus.message}
                  </div>
                ) : null}

              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: 0.04, ease: 'easeOut' }}
                className={`rounded-sm border p-4 shadow-xs ${
                  isLight ? 'border-zinc-200 bg-white text-black' : 'border-zinc-800 bg-black text-white'
                }`}
              >
                <PanelHeader isLight={isLight} icon={Sparkles} title="Campaign Output" meta={promoResult ? 'Generated' : 'Waiting for promo'} />
                {promoResult ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(220px,0.86fr)_minmax(0,1.14fr)]">
                    <img
                      src={promoResult.posterDataUrl}
                      alt="Generated promo poster"
                      className={`aspect-square w-full rounded-sm border object-cover ${
                        isLight ? 'border-zinc-200 bg-zinc-100' : 'border-zinc-800 bg-black'
                      }`}
                    />
                    <div className="space-y-3">
                      <div className={`rounded-sm border p-3.5 ${
                        isLight ? 'border-zinc-200 bg-zinc-50 text-black' : 'border-zinc-800 bg-zinc-900 text-white'
                      }`}>
                        <div className={`text-[11px] font-extrabold uppercase tracking-wider ${
                          isLight ? 'text-zinc-600' : 'text-zinc-400'
                        }`}>Caption</div>
                        <p className={`mt-1.5 text-[13.5px] font-medium leading-6 ${isLight ? 'text-black' : 'text-white'}`}>{promoResult.caption}</p>
                      </div>
                      <div className={`rounded-sm border p-3.5 ${
                        isLight ? 'border-zinc-200 bg-zinc-50 text-black' : 'border-zinc-800 bg-zinc-900 text-white'
                      }`}>
                        <div className={`text-[11px] font-extrabold uppercase tracking-wider ${
                          isLight ? 'text-zinc-600' : 'text-zinc-400'
                        }`}>Hashtags</div>
                        <p className={`mt-1.5 break-words text-[12.5px] font-medium leading-6 ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>{promoHashtags}</p>
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
                  <div className={`mt-4 grid min-h-[360px] place-items-center rounded-sm border border-dashed p-6 text-center ${
                    isLight ? 'border-zinc-300 bg-zinc-50 text-zinc-600' : 'border-zinc-800 bg-black text-zinc-400'
                  }`}>
                    <div>
                      <Sparkles className="mx-auto h-8 w-8 text-black dark:text-white" />
                      <div className={`mt-3 text-[16px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>No campaign generated yet</div>
                      <p className={`mt-2 max-w-md text-[13px] font-medium leading-6 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>Choose an inventory item, add the local offer details, and generate a poster with a caption ready for social sharing.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </ModuleSection>
        ) : null}

        {section === 'expenses' ? (
          <ExpensesManager
            expenses={data.expenses || []}
            onDataRefresh={onDataRefresh}
            theme={theme}
          />
        ) : null}

        {section === 'suppliers' ? (
          <ModuleSection isLight={isLight} icon={Boxes} eyebrow="Supplier Network" title="Suppliers Directory" description="Manage supplier contact info, lead times, and linked product lines.">
            {/* Header Controls: Search Input + Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
              <RecentSearchInput
                value={supplierSearchQuery}
                onChange={setSupplierSearchQuery}
                placeholder="Search suppliers by name, phone, products..."
                storageKey="supplier_network"
                isLight={isLight}
                className="min-w-[240px] max-w-md"
              />
              <div className="flex items-center gap-2.5 shrink-0">
                <span className={`h-11 flex items-center rounded-sm border px-4 text-[12px] font-extrabold shadow-2xs ${
                  isLight ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
                }`}>
                  {filteredSuppliersList.length} Suppliers
                </span>
                <IconAction isLight={isLight} onClick={onAddSupplier} icon={PackagePlus} label="Add New Supplier" variant="primary" />
              </div>
            </div>

            {/* Compact Space-Efficient Supplier Grid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSuppliersList.map((supplier: any) => (
                <div
                  key={supplier.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-sm border px-3.5 py-2.5 transition-all ${
                    isLight
                      ? 'border-zinc-200 bg-zinc-50/80 text-black hover:bg-zinc-100 hover:border-black'
                      : 'border-zinc-900 bg-black hover:border-zinc-700 text-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[13.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                      {supplier.name || 'Unnamed supplier'}
                    </div>
                    <div className={`mt-0.5 text-[11.5px] font-medium flex items-center gap-2 flex-wrap ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      <span>Phone: {supplier.phone || 'Not set'} • Lead: {supplier.leadTimeDays || 0}d</span>
                      {supplier.phone && (
                        <ContactActionGroup
                          phone={supplier.phone}
                          name={supplier.name || 'Supplier'}
                          role="Supplier"
                          onOpenCallModal={onOpenCallModal}
                          isLight={isLight}
                        />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSupplier(supplier.id)}
                    className={`rounded-sm p-1.5 shrink-0 transition ${
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
                <div className={`col-span-full rounded-sm border p-6 text-center text-[13px] ${
                  isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : 'border-zinc-900 bg-black text-zinc-400'
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
          <span className={`flex h-7 w-7 items-center justify-center rounded-sm border ${
            isLight ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
          }`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className={`text-[18px] font-extrabold leading-tight ${isLight ? 'text-black' : 'text-white'}`}>{title}</h3>
            <p className={`text-[12px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{description}</p>
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
      className={`relative min-h-[190px] overflow-hidden rounded-sm border p-4 transition-all ${
        isLight
          ? 'border-zinc-200 bg-zinc-50/80 text-black hover:bg-white hover:border-black'
          : 'border-zinc-800 bg-black text-white'
      }`}
    >
      <div className="relative flex h-full flex-col">
        {imageUrl && (
          <div className={`mb-4 h-32 w-full overflow-hidden rounded-sm border ${
            isLight ? 'border-zinc-200 bg-zinc-100' : 'border-zinc-800 bg-zinc-900'
          }`}>
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex-grow">
          <div className={`text-[11.5px] font-extrabold uppercase tracking-[0.16em] ${
            isLight ? 'text-zinc-600' : 'text-zinc-400'
          }`}>{meta}</div>
          <div className={`mt-2 text-[19px] font-bold ${
            isLight ? 'text-black' : 'text-white'
          }`}>{title}</div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </motion.article>
  );
}

function SoftStat({ isLight, label, value }: { isLight?: boolean; label: string; value: string }) {
  return (
    <div className={`rounded-sm border p-3 ${
      isLight ? 'border-zinc-200 bg-zinc-100/90 text-black' : 'border-zinc-800 bg-zinc-900 text-white'
    }`}>
      <div className={`text-[11px] font-extrabold uppercase tracking-[0.15em] ${
        isLight ? 'text-zinc-600' : 'text-zinc-400'
      }`}>{label}</div>
      <div className={`mt-1.5 text-[19px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function EmptyState({ isLight, text }: { isLight?: boolean; text: string }) {
  return (
    <div className={`rounded-sm border p-5 text-[14px] font-medium leading-7 ${
      isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-700' : 'border-zinc-800 bg-zinc-900 text-zinc-300'
    }`}>
      {text}
    </div>
  );
}

function PanelHeader({ icon: Icon, isLight, meta, title }: { icon: any; isLight?: boolean; meta?: any; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-sm border ${
          isLight
            ? 'border-zinc-300 bg-white text-black'
            : 'border-zinc-800 bg-black text-white'
        }`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className={`text-[14.5px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{title}</div>
          {meta ? (
            <div className={`text-[10.5px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{meta}</div>
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
      className={`h-8.5 rounded-sm border px-2.5 text-[12px] font-semibold outline-none transition ${
        isLight
          ? 'border-zinc-300 bg-white text-black placeholder:text-zinc-400 focus:border-black'
          : 'border-zinc-800 bg-black text-white placeholder:text-zinc-500 focus:border-white'
      }`}
    />
  );
}

function FormSelect({ isLight, onChange, options, value }: { isLight?: boolean; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-8.5 rounded-sm border px-2.5 text-[12px] font-semibold capitalize outline-none transition ${
        isLight
          ? 'border-zinc-300 bg-white text-black focus:border-black'
          : 'border-zinc-800 bg-black text-white focus:border-white'
      }`}
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function IconAction({
  disabled = false,
  icon: Icon,
  isLight,
  label,
  onClick,
  variant = 'secondary',
  className = '',
}: {
  disabled?: boolean;
  icon: any;
  isLight?: boolean;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 sm:px-6 text-[13.5px] font-bold transition-all shadow-xs active:scale-[0.98] ${
        isPrimary
          ? (isLight
              ? 'bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 border border-black shadow-sm'
              : 'bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 border border-white shadow-sm')
          : (isLight
              ? 'border border-zinc-300 bg-white text-black hover:bg-zinc-100 hover:border-black disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-200'
              : 'border border-zinc-800 bg-black text-white hover:bg-zinc-900 hover:border-zinc-700 disabled:bg-black disabled:text-zinc-600')
      } ${className}`}
    >
      <Icon className="h-4 w-4 text-current shrink-0" />
      <span>{label}</span>
    </button>
  );
}
