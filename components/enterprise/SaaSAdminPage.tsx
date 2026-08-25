"use client"

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Settings,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
  Palette,
  Zap,
  Store,
  MessageSquare,
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  Moon,
  Sun,
  Check,
  Receipt,
  Building,
  CreditCard,
  Sliders,
  Trash2,
  Save,
  HelpCircle,
  SlidersHorizontal,
  LayoutGrid,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

type SaaSAdminPageProps = {
  onDataRefresh?: () => Promise<void>;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
};

type TabKey = 'general' | 'billing' | 'appearance' | 'khata' | 'team' | 'backup';

export function SaaSAdminPage({ onDataRefresh, theme = 'dark', onThemeChange }: SaaSAdminPageProps) {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  // Staff & Settings state
  const [staff, setStaff] = useState<any[]>([]);
  const [settings, setSettings] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Staff Form
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'cashier', password: '' });

  // Master Settings Form
  const [settingsForm, setSettingsForm] = useState({
    // Store Profile
    shopName: '',
    shopTagline: '',
    shopAddress: '',
    shopPhone: '',
    shopEmail: '',
    gstin: '',
    // Invoicing & Tax
    receiptHeader: 'Thank you for shopping with us!',
    receiptFooter: 'Goods once sold can be exchanged within 7 days with original invoice.',
    taxPercent: '0',
    invoicePrefix: 'INV',
    currencySymbol: '₹',
    decimalPrecision: '0',
    // POS & Workflow Defaults
    defaultLanding: 'billing',
    autoFocusSearch: true,
    autoClearCart: true,
    autoPrintReceipt: false,
    defaultPaymentMethod: 'cash',
    soundEffects: true,
    compactDensity: false,
    // Khata & Reminders
    creditReminderDays: '7',
    allowWalkinCredit: true,
    whatsappTemplate: 'Dear {customer_name}, greetings from {shop_name}. This is a gentle reminder that your pending balance of ₹{amount} (Bill #{invoice_id}) is due for settlement. Thank you!',
  });

  const [importJson, setImportJson] = useState('{\n  "items": [],\n  "customers": [],\n  "suppliers": [],\n  "invoices": []\n}');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const load = async () => {
    try {
      const [staffRes, settingsRes] = await Promise.all([
        fetch('/api/saas/staff').then((response) => response.json()),
        fetch('/api/saas/settings').then((response) => response.json()),
      ]);

      setStaff(staffRes.staff || []);
      const savedSettings = settingsRes.settings || null;
      setSettings(savedSettings);

      // Hydrate local preferences
      const savedLanding = (typeof window !== 'undefined' ? localStorage.getItem('drishti_default_landing') : null) || 'billing';
      const savedDensity = typeof window !== 'undefined' && localStorage.getItem('drishti_compact_density') === 'true';
      const savedSound = typeof window !== 'undefined' ? localStorage.getItem('drishti_sound_effects') !== 'false' : true;
      const savedCurrency = (typeof window !== 'undefined' ? localStorage.getItem('drishti_currency_symbol') : null) || '₹';
      const savedDecimals = (typeof window !== 'undefined' ? localStorage.getItem('drishti_decimal_precision') : null) || '0';

      if (savedSettings) {
        setSettingsForm({
          shopName: savedSettings.shopName || '',
          shopTagline: savedSettings.shopTagline || '',
          shopAddress: savedSettings.shopAddress || '',
          shopPhone: savedSettings.shopPhone || '',
          shopEmail: savedSettings.shopEmail || '',
          gstin: savedSettings.gstin || '',
          receiptHeader: savedSettings.receiptHeader || 'Thank you for shopping with us!',
          receiptFooter: savedSettings.receiptFooter || 'Goods once sold can be exchanged within 7 days with original invoice.',
          taxPercent: String(savedSettings.taxPercent ?? 0),
          invoicePrefix: savedSettings.invoicePrefix || 'INV',
          currencySymbol: savedSettings.currencySymbol || savedCurrency,
          decimalPrecision: String(savedSettings.decimalPrecision ?? savedDecimals),
          defaultLanding: savedSettings.defaultLanding || savedLanding,
          autoFocusSearch: savedSettings.autoFocusSearch !== false,
          autoClearCart: savedSettings.autoClearCart !== false,
          autoPrintReceipt: Boolean(savedSettings.autoPrintReceipt),
          defaultPaymentMethod: savedSettings.defaultPaymentMethod || 'cash',
          soundEffects: savedSettings.soundEffects !== false && savedSound,
          compactDensity: savedSettings.compactDensity === true || savedDensity,
          creditReminderDays: String(savedSettings.creditReminderDays || '7'),
          allowWalkinCredit: savedSettings.allowWalkinCredit !== false,
          whatsappTemplate: savedSettings.whatsappTemplate || 'Dear {customer_name}, greetings from {shop_name}. This is a gentle reminder that your pending balance of ₹{amount} (Bill #{invoice_id}) is due for settlement. Thank you!',
        });
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateField = (key: keyof typeof settingsForm, value: any) => {
    setSettingsForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const setSuccess = (message: string) => {
    setStatus({ type: 'success', message });
    toast.success(message);
  };
  const setError = (message: string) => {
    setStatus({ type: 'error', message });
    toast.error(message);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('drishti_default_landing', settingsForm.defaultLanding);
        localStorage.setItem('drishti_compact_density', String(settingsForm.compactDensity));
        localStorage.setItem('drishti_sound_effects', String(settingsForm.soundEffects));
        localStorage.setItem('drishti_currency_symbol', settingsForm.currencySymbol);
        localStorage.setItem('drishti_decimal_precision', settingsForm.decimalPrecision);
      }

      const response = await fetch('/api/saas/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settingsForm,
          taxPercent: Number(settingsForm.taxPercent || 0),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to save settings.');

      setHasChanges(false);
      setSuccess('Settings saved successfully.');
      await onDataRefresh?.();
    } catch (err: any) {
      setError(err.message || 'Unable to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const addStaff = async () => {
    if (!staffForm.name || !staffForm.email) {
      setError('Name and email are required to add staff.');
      return;
    }

    try {
      const response = await fetch('/api/saas/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to create staff account.');
      setStaffForm({ name: '', email: '', role: 'cashier', password: '' });
      setSuccess(`Staff account created for ${staffForm.name}.`);
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to save staff account.');
    }
  };

  const runImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      const response = await fetch('/api/saas/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Import failed.');
      setSuccess(`Import complete: ${result.imported.items} items, ${result.imported.customers} customers, ${result.imported.suppliers} suppliers.`);
      await onDataRefresh?.();
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format or import failed.');
    }
  };

  const exportTemplate = () => {
    const template = {
      items: [
        { name: 'Basmati Rice 5kg', price: 450, qty: 25, category: 'Staples', barcode: '890123456789' },
        { name: 'Full Cream Milk 1L', price: 68, qty: 50, category: 'Dairy', barcode: '890987654321' }
      ],
      customers: [{ name: 'Suresh Kumar', phone: '9876543210' }],
      suppliers: [{ name: 'Global Agri Traders', phone: '9876500000', products: 'Grains & Pulses' }],
      invoices: [],
    };
    setImportJson(JSON.stringify(template, null, 2));
    setSuccess('Sample bulk import template loaded.');
  };

  const downloadFullBackup = async () => {
    try {
      const [itemsRes, customersRes, invoicesRes, suppliersRes] = await Promise.all([
        fetch('/api/saas/items').then(r => r.json()),
        fetch('/api/saas/customers').then(r => r.json()),
        fetch('/api/saas/invoices').then(r => r.json()),
        fetch('/api/saas/suppliers').then(r => r.json()),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        shop: settingsForm.shopName || 'My Store',
        items: itemsRes.items || [],
        customers: customersRes.customers || [],
        invoices: invoicesRes.invoices || [],
        suppliers: suppliersRes.suppliers || [],
        settings: settingsForm,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSuccess('Full store database backup downloaded successfully.');
    } catch {
      setError('Failed to download backup.');
    }
  };

  const navTabs = [
    { id: 'general' as TabKey, label: 'Store & Invoicing', icon: Store },
    { id: 'billing' as TabKey, label: 'Billing & POS', icon: Zap },
    { id: 'appearance' as TabKey, label: 'Theme & Display', icon: Palette },
    { id: 'khata' as TabKey, label: 'Khata & WhatsApp', icon: MessageSquare },
    { id: 'team' as TabKey, label: 'Team & Staff', icon: Users },
    { id: 'backup' as TabKey, label: 'Data & Backup', icon: Database },
  ];

  return (
    <div className={`mx-auto max-w-5xl space-y-6 pb-12 transition-colors ${isLight ? 'text-black' : 'text-white'}`}>
      {/* 1. Header with Breadcrumbs & Save Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Settings
          </h1>
          <p className={`text-xs sm:text-sm font-medium mt-1 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Manage your store information, billing speed, theme preferences, and staff permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {hasChanges && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-sm border ${
              isLight ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-amber-800 bg-amber-950/60 text-amber-300'
            }`}>
              Unsaved changes
            </span>
          )}

          <button
            type="button"
            onClick={() => { void saveSettings(); }}
            disabled={isSaving}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm px-5 text-xs sm:text-sm font-bold transition-all border shadow-sm active:scale-[0.98] ${
              isLight
                ? 'border-black bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400'
                : 'border-white bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500'
            }`}
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {status.message && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-sm border p-3.5 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
            status.type === 'error'
              ? (isLight ? 'bg-red-50 text-red-800 border-red-200' : 'bg-red-950/60 text-red-200 border-red-900')
              : (isLight ? 'bg-zinc-100 text-black border-zinc-300' : 'bg-zinc-900 text-white border-zinc-800')
          }`}
        >
          <div className="flex items-center gap-2.5">
            {status.type === 'error' ? <AlertCircle className="h-4 w-4 text-red-500 shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
            <span>{status.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatus({ type: 'idle', message: '' })}
            className="text-[11px] uppercase tracking-wider font-extrabold hover:underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* 2. Sleek Horizontal Navigation Bar (Linear / Apple Style) */}
      <div className={`flex items-center gap-1 overflow-x-auto border-b pb-px ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? (isLight ? 'text-black' : 'text-white')
                  : (isLight ? 'text-zinc-500 hover:text-black' : 'text-zinc-400 hover:text-white')
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="settingsActiveIndicator"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${isLight ? 'bg-black' : 'bg-white'}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content Area */}
      <AnimatePresence mode="wait">
        {/* TAB 1: STORE & INVOICING */}
        {activeTab === 'general' && (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Store Information Card */}
            <SettingsCard
              isLight={isLight}
              title="Store Identity"
              description="Basic profile details of your shop printed on receipts and customer invoices."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  isLight={isLight}
                  label="Store Trade Name"
                  value={settingsForm.shopName}
                  onChange={(v) => updateField('shopName', v)}
                  placeholder="e.g. Sri Lakshmi Provisions"
                />
                <Field
                  isLight={isLight}
                  label="Store Tagline"
                  value={settingsForm.shopTagline}
                  onChange={(v) => updateField('shopTagline', v)}
                  placeholder="e.g. Quality Groceries at Wholesale Rates"
                />
                <Field
                  isLight={isLight}
                  label="Contact Phone"
                  value={settingsForm.shopPhone}
                  onChange={(v) => updateField('shopPhone', v)}
                  placeholder="e.g. 9876543210"
                />
                <Field
                  isLight={isLight}
                  label="GSTIN / Tax ID"
                  value={settingsForm.gstin}
                  onChange={(v) => updateField('gstin', v)}
                  placeholder="e.g. 36AAAAA0000A1Z5"
                />
                <div className="sm:col-span-2">
                  <Field
                    isLight={isLight}
                    label="Official Store Address"
                    value={settingsForm.shopAddress}
                    onChange={(v) => updateField('shopAddress', v)}
                    placeholder="e.g. Shop #4, Main Market Road, Bangalore"
                  />
                </div>
              </div>
            </SettingsCard>

            {/* Invoicing Policies Card */}
            <SettingsCard
              isLight={isLight}
              title="Invoicing & Receipt Rules"
              description="Customize bill number prefixes, tax calculations, and exchange policy terms."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  isLight={isLight}
                  label="Invoice Prefix"
                  value={settingsForm.invoicePrefix}
                  onChange={(v) => updateField('invoicePrefix', v)}
                  placeholder="INV"
                />
                <Field
                  isLight={isLight}
                  label="Default GST Tax Rate (%)"
                  type="number"
                  value={settingsForm.taxPercent}
                  onChange={(v) => updateField('taxPercent', v)}
                  placeholder="0"
                />
                <div className="sm:col-span-2">
                  <Field
                    isLight={isLight}
                    label="Receipt Header Greeting"
                    value={settingsForm.receiptHeader}
                    onChange={(v) => updateField('receiptHeader', v)}
                    placeholder="Thank you for shopping with us!"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Receipt Footer / Exchange Terms
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.receiptFooter}
                    onChange={(e) => updateField('receiptFooter', e.target.value)}
                    placeholder="Goods once sold can be exchanged within 7 days with original invoice."
                    className={`w-full rounded-sm border p-3 text-xs sm:text-sm font-medium outline-none transition ${
                      isLight ? 'border-zinc-300 bg-white text-black focus:border-black' : 'border-zinc-800 bg-black text-white focus:border-white'
                    }`}
                  />
                </div>
              </div>
            </SettingsCard>
          </motion.div>
        )}

        {/* TAB 2: BILLING & POS */}
        {activeTab === 'billing' && (
          <motion.div
            key="billing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Startup Screen */}
            <SettingsCard
              isLight={isLight}
              title="Daily Startup Landing Screen"
              description="Choose which module opens automatically whenever you launch Drishti."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
                {[
                  { id: 'billing', label: '⚡ Billing POS', desc: 'Direct fast checkout counter' },
                  { id: 'overview', label: '🌐 Store Overview', desc: 'Summary executive dashboard' },
                  { id: 'stock', label: '📦 Stock Desk', desc: 'Inventory & item updates' },
                  { id: 'insights', label: '📊 Insights', desc: 'Sales trends & profit analytics' },
                ].map((opt) => {
                  const isSelected = settingsForm.defaultLanding === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateField('defaultLanding', opt.id)}
                      className={`flex flex-col text-left p-3.5 rounded-sm border transition-all ${
                        isSelected
                          ? (isLight ? 'border-black bg-zinc-100 text-black shadow-xs font-bold' : 'border-white bg-zinc-900 text-white shadow-xs font-bold')
                          : (isLight ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400' : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700')
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold">{opt.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <span className={`text-[11px] mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SettingsCard>

            {/* Default Payment Method */}
            <SettingsCard
              isLight={isLight}
              title="Default Payment Mode"
              description="Pre-selected payment mode on new customer bills to eliminate extra clicks."
            >
              <div className="grid gap-3 sm:grid-cols-4 pt-1">
                {[
                  { id: 'cash', label: '💵 Cash', desc: 'Standard counter cash' },
                  { id: 'upi', label: '📱 UPI / QR', desc: 'Instant QR payment' },
                  { id: 'card', label: '💳 Card Swipe', desc: 'POS card machine' },
                  { id: 'credit', label: '⏳ Khata Credit', desc: 'Customer balance ledger' },
                ].map((m) => {
                  const isSelected = settingsForm.defaultPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateField('defaultPaymentMethod', m.id)}
                      className={`flex flex-col text-left p-3.5 rounded-sm border transition-all ${
                        isSelected
                          ? (isLight ? 'border-black bg-zinc-100 text-black shadow-xs font-bold' : 'border-white bg-zinc-900 text-white shadow-xs font-bold')
                          : (isLight ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400' : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700')
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold">{m.label}</span>
                        {isSelected && <Check className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <span className={`text-[11px] mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                        {m.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </SettingsCard>

            {/* Speed Automations */}
            <SettingsCard
              isLight={isLight}
              title="Counter Speed & Automations"
              description="Automate repetitive checkout operations for maximum cashier velocity."
            >
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <ToggleRow
                  isLight={isLight}
                  title="Auto-Focus Barcode / Product Search"
                  description="Places cursor into the search field immediately upon loading the billing desk."
                  checked={settingsForm.autoFocusSearch}
                  onChange={(v) => updateField('autoFocusSearch', v)}
                />
                <ToggleRow
                  isLight={isLight}
                  title="Auto-Clear Cart after Bill Creation"
                  description="Immediately resets the cart and customer field after invoice completion to prep for the next customer."
                  checked={settingsForm.autoClearCart}
                  onChange={(v) => updateField('autoClearCart', v)}
                />
                <ToggleRow
                  isLight={isLight}
                  title="Auto-Launch Browser Print Dialog"
                  description="Triggers the receipt print dialog automatically whenever an invoice is created."
                  checked={settingsForm.autoPrintReceipt}
                  onChange={(v) => updateField('autoPrintReceipt', v)}
                />
              </div>
            </SettingsCard>
          </motion.div>
        )}

        {/* TAB 3: THEME & DISPLAY */}
        {activeTab === 'appearance' && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Color Theme Selector */}
            <SettingsCard
              isLight={isLight}
              title="Color Theme"
              description="Choose between high-contrast Light mode and deep Dark mode."
            >
              <div className="grid gap-4 sm:grid-cols-2 pt-1">
                <button
                  type="button"
                  onClick={() => onThemeChange?.('dark')}
                  className={`flex items-center justify-between p-4 rounded-sm border text-left transition-all ${
                    theme === 'dark'
                      ? 'border-white bg-zinc-900 text-white shadow-xs font-bold'
                      : (isLight ? 'border-zinc-200 bg-white text-zinc-700 hover:border-black' : 'border-zinc-800 bg-black text-zinc-400')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5" />
                    <div>
                      <div className="text-sm font-extrabold">Dark Mode</div>
                      <div className="text-xs text-zinc-400">High-contrast black workspace</div>
                    </div>
                  </div>
                  {theme === 'dark' && <Check className="h-4 w-4 text-emerald-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => onThemeChange?.('light')}
                  className={`flex items-center justify-between p-4 rounded-sm border text-left transition-all ${
                    theme === 'light'
                      ? 'border-black bg-zinc-100 text-black shadow-xs font-bold'
                      : (isLight ? 'border-zinc-200 bg-white text-zinc-700 hover:border-black' : 'border-zinc-800 bg-black text-zinc-400')
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sun className="h-5 w-5" />
                    <div>
                      <div className="text-sm font-extrabold">Light Mode</div>
                      <div className="text-xs text-zinc-500">Bright, clean daytime clarity</div>
                    </div>
                  </div>
                  {theme === 'light' && <Check className="h-4 w-4 text-emerald-500" />}
                </button>
              </div>
            </SettingsCard>

            {/* Currency & Formatting */}
            <SettingsCard
              isLight={isLight}
              title="Currency & Numbers"
              description="Configure monetary symbols and decimal places."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Currency Symbol
                  </label>
                  <select
                    value={settingsForm.currencySymbol}
                    onChange={(e) => updateField('currencySymbol', e.target.value)}
                    className={`w-full h-10 rounded-sm border px-3 text-xs sm:text-sm font-bold outline-none transition ${
                      isLight ? 'border-zinc-300 bg-white text-black focus:border-black' : 'border-zinc-800 bg-black text-white focus:border-white'
                    }`}
                  >
                    <option value="₹">₹ Indian Rupee (INR)</option>
                    <option value="$">$ US Dollar (USD)</option>
                    <option value="€">€ Euro (EUR)</option>
                    <option value="£">£ British Pound (GBP)</option>
                    <option value="AED">AED UAE Dirham</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Decimal Precision
                  </label>
                  <select
                    value={settingsForm.decimalPrecision}
                    onChange={(e) => updateField('decimalPrecision', e.target.value)}
                    className={`w-full h-10 rounded-sm border px-3 text-xs sm:text-sm font-bold outline-none transition ${
                      isLight ? 'border-zinc-300 bg-white text-black focus:border-black' : 'border-zinc-800 bg-black text-white focus:border-white'
                    }`}
                  >
                    <option value="0">0 Decimals (e.g. ₹500)</option>
                    <option value="2">2 Decimals (e.g. ₹500.00)</option>
                  </select>
                </div>
              </div>
            </SettingsCard>

            {/* Audio Feedback & Density */}
            <SettingsCard
              isLight={isLight}
              title="Audio & Interface Density"
              description="Feedback sounds and compact layout toggles."
            >
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <ToggleRow
                  isLight={isLight}
                  title="Counter Audio Feedback"
                  description="Plays an instant verification beep when adding products to cart."
                  checked={settingsForm.soundEffects}
                  onChange={(v) => updateField('soundEffects', v)}
                />
                <ToggleRow
                  isLight={isLight}
                  title="Ultra-Compact Table Density"
                  description="Reduces row height in tables so more items fit on screen without scrolling."
                  checked={settingsForm.compactDensity}
                  onChange={(v) => updateField('compactDensity', v)}
                />
              </div>
            </SettingsCard>
          </motion.div>
        )}

        {/* TAB 4: KHATA & WHATSAPP */}
        {activeTab === 'khata' && (
          <motion.div
            key="khata"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <SettingsCard
              isLight={isLight}
              title="Khata Credit Rules"
              description="Configure customer balance reminder intervals and credit eligibility."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Follow-up Reminder Interval
                  </label>
                  <select
                    value={settingsForm.creditReminderDays}
                    onChange={(e) => updateField('creditReminderDays', e.target.value)}
                    className={`w-full h-10 rounded-sm border px-3 text-xs sm:text-sm font-bold outline-none transition ${
                      isLight ? 'border-zinc-300 bg-white text-black focus:border-black' : 'border-zinc-800 bg-black text-white focus:border-white'
                    }`}
                  >
                    <option value="3">Every 3 Days (Fast recovery)</option>
                    <option value="7">Every 7 Days (Weekly statement)</option>
                    <option value="15">Every 15 Days (Bi-weekly)</option>
                    <option value="30">Every 30 Days (Monthly cycle)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-sm border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <div className="text-xs sm:text-sm font-bold">Allow Walk-in Customer Credit</div>
                    <div className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Permits credit bills without prior registration</div>
                  </div>
                  <ToggleSwitch
                    isLight={isLight}
                    checked={settingsForm.allowWalkinCredit}
                    onChange={(v) => updateField('allowWalkinCredit', v)}
                  />
                </div>
              </div>
            </SettingsCard>

            <SettingsCard
              isLight={isLight}
              title="WhatsApp Payment Reminder Message"
              description="Message template sent to customers for pending balance settlements."
            >
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={settingsForm.whatsappTemplate}
                  onChange={(e) => updateField('whatsappTemplate', e.target.value)}
                  className={`w-full rounded-sm border p-3 text-xs sm:text-sm font-medium outline-none transition ${
                    isLight ? 'border-zinc-300 bg-white text-black focus:border-black' : 'border-zinc-800 bg-black text-white focus:border-white'
                  }`}
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-xs font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Insert Tag:</span>
                  {['{customer_name}', '{amount}', '{shop_name}', '{invoice_id}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => updateField('whatsappTemplate', settingsForm.whatsappTemplate + ' ' + tag)}
                      className={`rounded-sm border px-2.5 py-1 text-[11px] font-bold transition ${
                        isLight ? 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-black' : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white'
                      }`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </SettingsCard>
          </motion.div>
        )}

        {/* TAB 5: TEAM & STAFF */}
        {activeTab === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
              {/* Add Staff */}
              <SettingsCard
                isLight={isLight}
                title="Add Staff Member"
                description="Create login credentials for cashiers or managers."
              >
                <div className="space-y-3 pt-1">
                  <Field
                    isLight={isLight}
                    label="Full Name"
                    value={staffForm.name}
                    onChange={(v) => setStaffForm({ ...staffForm, name: v })}
                    placeholder="e.g. Ramesh Cashier"
                  />
                  <Field
                    isLight={isLight}
                    label="Email Login"
                    type="email"
                    value={staffForm.email}
                    onChange={(v) => setStaffForm({ ...staffForm, email: v })}
                    placeholder="e.g. ramesh@store.com"
                  />
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      Assigned Role
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                      className={`w-full h-10 rounded-sm border px-3 text-xs sm:text-sm font-semibold outline-none transition ${
                        isLight ? 'border-zinc-300 bg-white text-black' : 'border-zinc-800 bg-black text-white'
                      }`}
                    >
                      <option value="cashier">Cashier (Billing & Invoices only)</option>
                      <option value="manager">Store Manager (Billing, Stock, Suppliers)</option>
                      <option value="admin">Admin (Full Access & Settings)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => { void addStaff(); }}
                    className={`w-full inline-flex h-10 items-center justify-center gap-2 rounded-sm border text-xs sm:text-sm font-bold transition shadow-xs ${
                      isLight ? 'bg-black text-white border-black hover:bg-zinc-800' : 'bg-white text-black border-white hover:bg-zinc-200'
                    }`}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Create Staff Account</span>
                  </button>
                </div>
              </SettingsCard>

              {/* Staff Roster */}
              <SettingsCard
                isLight={isLight}
                title="Active Staff Accounts"
                description={`${staff.length} registered counter users.`}
              >
                <div className="space-y-2 pt-1 max-h-[360px] overflow-y-auto pr-1">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between rounded-sm border p-3 text-xs sm:text-sm transition ${
                        isLight ? 'border-zinc-200 bg-zinc-50 text-black' : 'border-zinc-800 bg-zinc-950 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-sm border flex items-center justify-center font-black ${
                          isLight ? 'border-zinc-300 bg-white text-black' : 'border-zinc-700 bg-black text-white'
                        }`}>
                          {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold">{member.name}</div>
                          <div className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{member.email}</div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-sm text-[11px] font-extrabold uppercase tracking-wider border ${
                        isLight ? 'border-zinc-300 bg-white text-black' : 'border-zinc-700 bg-zinc-900 text-white'
                      }`}>
                        {member.role}
                      </span>
                    </div>
                  ))}

                  {staff.length === 0 && (
                    <div className={`text-center py-12 text-xs sm:text-sm border border-dashed rounded-sm ${
                      isLight ? 'border-zinc-300 text-zinc-500' : 'border-zinc-800 text-zinc-400'
                    }`}>
                      No extra staff accounts created yet. You are logged in as Store Admin.
                    </div>
                  )}
                </div>
              </SettingsCard>
            </div>
          </motion.div>
        )}

        {/* TAB 6: DATA & BACKUP */}
        {activeTab === 'backup' && (
          <motion.div
            key="backup"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <SettingsCard
                isLight={isLight}
                title="1-Click Complete Database Backup"
                description="Download a full offline JSON backup containing all products, stock levels, customers, suppliers, bills, and settings."
              >
                <div className="space-y-3 pt-1">
                  <p className={`text-xs sm:text-sm ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    Protect your store from data loss by downloading an offline copy to your computer or USB drive.
                  </p>
                  <button
                    type="button"
                    onClick={() => { void downloadFullBackup(); }}
                    className={`w-full inline-flex h-11 items-center justify-center gap-2 rounded-sm border text-xs sm:text-sm font-bold transition shadow-xs ${
                      isLight
                        ? 'border-zinc-300 bg-zinc-100 text-black hover:bg-zinc-200'
                        : 'border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download JSON Backup File</span>
                  </button>
                </div>
              </SettingsCard>

              <SettingsCard
                isLight={isLight}
                title="Onboarding & Welcome Guides"
                description="Reset first-time tour or theme selection dialogs."
              >
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('drishti_has_seen_overview');
                      }
                      setSuccess('First-time tour reset. On next page refresh, the Overview will open first.');
                    }}
                    className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-sm border px-3 text-xs sm:text-sm font-bold transition ${
                      isLight ? 'border-zinc-300 bg-zinc-50 text-black hover:bg-zinc-100' : 'border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Reset Tour</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('drishti_theme_chosen');
                      }
                      setSuccess('Theme preference prompt reset. You will be prompted on next page refresh.');
                    }}
                    className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-sm border px-3 text-xs sm:text-sm font-bold transition ${
                      isLight ? 'border-zinc-300 bg-zinc-50 text-black hover:bg-zinc-100' : 'border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Reset Theme Prompt</span>
                  </button>
                </div>
              </SettingsCard>
            </div>

            {/* Bulk Data Importer */}
            <SettingsCard
              isLight={isLight}
              title="Bulk Data Importer"
              description="Paste raw JSON data to import thousands of products, customers, and suppliers in a single operation."
            >
              <textarea
                value={importJson}
                onChange={(event) => setImportJson(event.target.value)}
                rows={5}
                className={`w-full rounded-sm border p-3.5 font-mono text-xs leading-5 outline-none transition ${
                  isLight ? 'border-zinc-300 bg-zinc-50 text-black' : 'border-zinc-800 bg-zinc-950 text-white'
                }`}
              />
              <div className="mt-3 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={exportTemplate}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm border px-4 text-xs sm:text-sm font-bold transition ${
                    isLight ? 'border-zinc-300 bg-zinc-100 text-black hover:bg-zinc-200' : 'border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Load Sample Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => { void runImport(); }}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-sm border px-5 text-xs sm:text-sm font-bold transition ${
                    isLight ? 'border-black bg-black text-white hover:bg-zinc-800' : 'border-white bg-white text-black hover:bg-zinc-200'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span>Execute Bulk Import</span>
                </button>
              </div>
            </SettingsCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sleek Linear-style Card Container
function SettingsCard({
  title,
  description,
  children,
  isLight,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  isLight?: boolean;
}) {
  return (
    <div className={`rounded-sm border p-5 sm:p-6 transition-all shadow-xs ${
      isLight ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-[#09090b]'
    }`}>
      <div className="border-b pb-3.5 mb-4 border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm sm:text-base font-extrabold tracking-tight">{title}</h2>
        <p className={`text-xs sm:text-[13px] font-medium mt-0.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

// Clean Form Field Component
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  isLight,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  isLight?: boolean;
}) {
  return (
    <div>
      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-10 rounded-sm border px-3 text-xs sm:text-sm font-semibold outline-none transition ${
          isLight ? 'border-zinc-300 bg-white text-black focus:border-black' : 'border-zinc-800 bg-black text-white focus:border-white'
        }`}
      />
    </div>
  );
}

// Clean Toggle Row Component
function ToggleRow({
  title,
  description,
  checked,
  onChange,
  isLight,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  isLight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <div className="text-xs sm:text-sm font-extrabold">{title}</div>
        <div className={`text-[11px] sm:text-xs mt-0.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {description}
        </div>
      </div>
      <ToggleSwitch isLight={isLight} checked={checked} onChange={onChange} />
    </div>
  );
}

// Smooth Monochrome Toggle Switch
function ToggleSwitch({
  checked,
  onChange,
  isLight,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  isLight?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 ease-in-out ${
        checked
          ? (isLight ? 'border-black bg-black' : 'border-white bg-white')
          : (isLight ? 'border-zinc-300 bg-zinc-200' : 'border-zinc-700 bg-zinc-800')
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full transition-transform duration-200 ease-in-out ${
          checked
            ? (isLight ? 'translate-x-5.5 bg-white' : 'translate-x-5.5 bg-black')
            : (isLight ? 'translate-x-0.5 bg-white' : 'translate-x-0.5 bg-zinc-400')
        }`}
      />
    </button>
  );
}
