"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  LayoutGrid,
  Menu,
  Megaphone,
  Minus,
  MessageCircle,
  Package,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import StockManagement from '@/components/StockManagement';

type Product = { id: string; name: string; description?: string; image?: string; price: number; qty: number };
type Customer = { id: string; name: string; phone: string; email?: string; address?: string; loyaltyPoints?: number; totalSpent?: number; purchaseCount?: number; balance?: number };
type CartItem = Product & { cartQty: number };
type Expense = { id: string; title: string; amount: number; category: string; date: string; note?: string };
type Supplier = { id: string; name: string; phone: string; products?: string; leadTimeDays?: number; notes?: string };
type TaskItem = { id: string; title: string; dueDate?: string; priority: 'low' | 'medium' | 'high'; done: boolean };
type BackupPreview = {
  items: number;
  customers: number;
  invoices: number;
  expenses: number;
  suppliers: number;
  tasks: number;
};
type ProductsSlide = 'add' | 'manage';
type CustomersSlide = 'add' | 'directory';
type MarketingSlide = 'poster' | 'sync';
type BackupSlide = 'export' | 'restore';

type Section = 'billing' | 'products' | 'customers' | 'stock' | 'invoices' | 'marketing' | 'expenses' | 'suppliers' | 'tasks' | 'insights' | 'backup';
type NavItem = { key: Section; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { title: string; items: NavItem[] };

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<Section>('billing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [sectionQuery, setSectionQuery] = useState('');
  const [paletteQuery, setPaletteQuery] = useState('');
  const [favoriteSections, setFavoriteSections] = useState<Section[]>([]);
  const [recentSections, setRecentSections] = useState<Section[]>(['billing']);
  const [isRightRailOpen, setIsRightRailOpen] = useState(true);
  const [rightRailWidth, setRightRailWidth] = useState(290);
  const [isRailResizing, setIsRailResizing] = useState(false);
  const [isUtilityDrawerOpen, setIsUtilityDrawerOpen] = useState(false);
  const [utilityTab, setUtilityTab] = useState<'automation' | 'layout' | 'shortcuts'>('automation');
  const [layoutMode, setLayoutMode] = useState<'standard' | 'focus' | 'analytics'>('standard');
  const [isMounted, setIsMounted] = useState(false);
  const sectionSearchRef = useRef<HTMLInputElement>(null);
  const paletteSearchRef = useRef<HTMLInputElement>(null);
  const railResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const [items, setItems] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [productForm, setProductForm] = useState({ name: '', price: '', qty: '', image: '', description: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [billingState, setBillingState] = useState({ search: '', paymentMethod: 'cash', discount: '0', tax: '0', notes: '' });
  const [productsSlide, setProductsSlide] = useState<ProductsSlide>('add');
  const [customersSlide, setCustomersSlide] = useState<CustomersSlide>('add');
  const [marketingSlide, setMarketingSlide] = useState<MarketingSlide>('poster');
  const [backupSlide, setBackupSlide] = useState<BackupSlide>('export');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [latestInvoice, setLatestInvoice] = useState<any | null>(null);

  const [marketingForm, setMarketingForm] = useState({
    shopName: 'My Shop',
    area: 'RGIPT area',
    productId: '',
    openingHours: '9:00 AM - 9:00 PM',
    specialOffer: 'Fresh stock available at best price. Visit today!',
  });
  const [promoResult, setPromoResult] = useState<{ posterDataUrl: string; caption: string } | null>(null);
  const [isGeneratingPromo, setIsGeneratingPromo] = useState(false);
  const [isSyncingGmb, setIsSyncingGmb] = useState(false);

  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: '', date: '', note: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', products: '', leadTimeDays: '', notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', priority: 'medium' as 'low' | 'medium' | 'high' });
  const [backupFileName, setBackupFileName] = useState('');
  const [backupPayload, setBackupPayload] = useState<any | null>(null);
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);

  const selectedCustomer = customers.find((entry) => entry.id === selectedCustomerId) || null;
  const selectedMarketingProduct = items.find((item) => item.id === marketingForm.productId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section') as Section | null;
    if (section && ['billing', 'products', 'customers', 'stock', 'invoices', 'marketing', 'expenses', 'suppliers', 'tasks', 'insights', 'backup'].includes(section)) {
      setActiveSection(section);
    }
  }, []);

  useEffect(() => {
    if (!isCommandPaletteOpen) return;
    const timer = setTimeout(() => paletteSearchRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    const rawFavorites = localStorage.getItem('drishti_favorite_sections');
    const rawRightRailOpen = localStorage.getItem('drishti_right_rail_open');
    const rawRightRailWidth = localStorage.getItem('drishti_right_rail_width');

    if (rawFavorites) {
      try {
        const parsed = JSON.parse(rawFavorites);
        if (Array.isArray(parsed)) {
          setFavoriteSections(parsed.filter((value): value is Section => typeof value === 'string'));
        }
      } catch {}
    }

    if (rawRightRailOpen === '0') setIsRightRailOpen(false);
    if (rawRightRailWidth) {
      const parsedWidth = Number(rawRightRailWidth);
      if (!Number.isNaN(parsedWidth)) setRightRailWidth(Math.min(420, Math.max(240, parsedWidth)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('drishti_favorite_sections', JSON.stringify(favoriteSections));
  }, [favoriteSections]);

  useEffect(() => {
    localStorage.setItem('drishti_right_rail_open', isRightRailOpen ? '1' : '0');
  }, [isRightRailOpen]);

  useEffect(() => {
    localStorage.setItem('drishti_right_rail_width', String(rightRailWidth));
  }, [rightRailWidth]);

  useEffect(() => {
    const isInputTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      const tagName = element.tagName;
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || element.isContentEditable;
    };

    const isTypingContext = (event: KeyboardEvent) => {
      if (event.isComposing) return true;
      if (isInputTarget(event.target)) return true;
      return isInputTarget(document.activeElement);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen((previous) => !previous);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === '.') {
        event.preventDefault();
        setIsRightRailOpen((previous) => !previous);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        setIsUtilityDrawerOpen((previous) => !previous);
        return;
      }

      if (event.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
        return;
      }

      if (isTypingContext(event)) return;

      if (event.key === '/') {
        event.preventDefault();
        sectionSearchRef.current?.focus();
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setFavoriteSections((previous) =>
          previous.includes(activeSection)
            ? previous.filter((section) => section !== activeSection)
            : [...previous, activeSection]
        );
        return;
      }

      const shortcutMap: Record<string, Section> = {
        b: 'billing',
        p: 'products',
        c: 'customers',
        s: 'stock',
        i: 'invoices',
        m: 'marketing',
        e: 'expenses',
        u: 'suppliers',
        t: 'tasks',
        n: 'insights',
        k: 'backup',
      };

      const targetSection = shortcutMap[event.key.toLowerCase()];
      if (!targetSection) return;

      switchSection(targetSection);
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [activeSection, isCommandPaletteOpen]);

  useEffect(() => {
    if (layoutMode === 'focus') {
      setIsRightRailOpen(false);
      setIsSidebarCollapsed(true);
      return;
    }

    if (layoutMode === 'analytics') {
      setIsRightRailOpen(true);
      setIsSidebarCollapsed(false);
      return;
    }

    setIsSidebarCollapsed(false);
  }, [layoutMode]);

  useEffect(() => {
    if (activeSection === 'products') setProductsSlide('add');
    if (activeSection === 'customers') setCustomersSlide('add');
    if (activeSection === 'marketing') setMarketingSlide('poster');
    if (activeSection === 'backup') setBackupSlide('export');
  }, [activeSection]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onRailResize);
      window.removeEventListener('mouseup', stopRailResize);
    };
  }, []);

  async function loadAll() {
    await Promise.all([loadItems(), loadCustomers(), loadInvoices(), loadExpenses(), loadSuppliers(), loadTasks()]);
  }

  async function loadItems() {
    const response = await fetch('/api/items');
    const data = await response.json();
    setItems(data.items || []);
  }

  async function loadCustomers() {
    const response = await fetch('/api/customers');
    const data = await response.json();
    setCustomers(data.customers || []);
  }

  async function loadInvoices() {
    const response = await fetch('/api/invoices');
    const data = await response.json();
    setInvoices(data.invoices || []);
  }

  async function loadExpenses() {
    const response = await fetch('/api/expenses');
    const data = await response.json();
    setExpenses(data.expenses || []);
  }

  async function loadSuppliers() {
    const response = await fetch('/api/suppliers');
    const data = await response.json();
    setSuppliers(data.suppliers || []);
  }

  async function loadTasks() {
    const response = await fetch('/api/tasks');
    const data = await response.json();
    setTasks(data.tasks || []);
  }

  const filteredProducts = useMemo(() => {
    if (!billingState.search.trim()) return items;
    return items.filter((entry) => entry.name.toLowerCase().includes(billingState.search.toLowerCase()));
  }, [items, billingState.search]);

  const stockValue = useMemo(() => items.reduce((sum, entry) => sum + Number(entry.price || 0) * Number(entry.qty || 0), 0), [items]);
  const lowStockCount = useMemo(() => items.filter((entry) => Number(entry.qty || 0) <= 5).length, [items]);
  const lowStockItems = useMemo(() => items.filter((entry) => Number(entry.qty || 0) <= 5), [items]);
  const outOfStockItems = useMemo(() => items.filter((entry) => Number(entry.qty || 0) <= 0), [items]);
  const subtotal = useMemo(() => cart.reduce((sum, entry) => sum + Number(entry.price) * Number(entry.cartQty), 0), [cart]);
  const discount = Number(billingState.discount || 0);
  const tax = Number(billingState.tax || 0);
  const grandTotal = Math.max(0, subtotal - discount + tax);
  const todaySales = useMemo(() => invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0), [invoices]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, entry) => sum + Number(entry.amount || 0), 0), [expenses]);
  const pendingTasks = useMemo(() => tasks.filter((task) => !task.done).length, [tasks]);
  const openTaskTitles = useMemo(() => tasks.filter((task) => !task.done).map((task) => task.title.toLowerCase()), [tasks]);

  const splitSupplierProducts = (value?: string) =>
    String(value || '')
      .toLowerCase()
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);

  const getMatchingSuppliers = (productName: string) => {
    const target = productName.toLowerCase();
    return suppliers.filter((supplier) => {
      const terms = splitSupplierProducts(supplier.products);
      if (!terms.length) return true;
      return terms.some((term) => target.includes(term) || term.includes(target));
    });
  };

  const hasPendingOrderRequest = (productName: string, supplierName?: string) => {
    const productToken = productName.toLowerCase();
    const supplierToken = supplierName?.toLowerCase() || '';
    return openTaskTitles.some((title) => {
      if (!title.includes('order request') || !title.includes(productToken)) return false;
      if (!supplierToken) return true;
      return title.includes(supplierToken);
    });
  };
  const sectionMeta: Record<Section, { title: string; description: string; chip: string }> = {
    billing: { title: 'Billing Control Desk', description: 'Fast checkout, payment control and invoice actions in one place.', chip: 'Checkout Live' },
    products: { title: 'Product Master', description: 'Manage catalog, pricing, stock-ready details and product visibility.', chip: 'Catalog Ops' },
    customers: { title: 'Customer Profiles', description: 'Track customer history, dues and relationship data.', chip: 'CRM Ready' },
    stock: { title: 'Stock Management', description: 'Monitor inventory movement and quantity updates.', chip: 'Inventory Live' },
    invoices: { title: 'Invoice Center', description: 'Review bills and quickly print/share records.', chip: 'Billing Records' },
    marketing: { title: 'Marketing Studio', description: 'Generate promos, captions and update local presence.', chip: 'Growth Engine' },
    expenses: { title: 'Expense Tracker', description: 'Capture spending and keep cost visibility clear.', chip: 'Cost Control' },
    suppliers: { title: 'Supplier Hub', description: 'Maintain supplier contacts, products and lead times.', chip: 'Procurement' },
    tasks: { title: 'Tasks & Reminders', description: 'Plan daily operations and close action items.', chip: 'Execution' },
    insights: { title: 'Business Insights', description: 'View top metrics and business health snapshots.', chip: 'Analytics' },
    backup: { title: 'Backup & Restore', description: 'Protect data with export and safe restore controls.', chip: 'Data Safety' },
  };
  const sectionAccent: Record<Section, {
    activeButton: string;
    activeTab: string;
    spotlight: string;
    chip: string;
    container: string;
    dot: string;
  }> = {
    billing: {
      activeButton: 'bg-blue-500/25 border-blue-300/70 text-white shadow-[0_0_20px_rgba(59,130,246,0.32)]',
      activeTab: 'bg-blue-500/35 border-blue-300/75 text-white shadow-[0_0_16px_rgba(59,130,246,0.32)]',
      spotlight: 'from-blue-500/25 via-blue-500/10 to-transparent border-blue-400/45',
      chip: 'border-blue-300/55 bg-blue-500/25 text-blue-100',
      container: 'border-blue-500/30 from-blue-500/10',
      dot: 'bg-blue-300 shadow-[0_0_10px_rgba(96,165,250,0.95)]',
    },
    products: {
      activeButton: 'bg-violet-500/25 border-violet-300/70 text-white shadow-[0_0_20px_rgba(139,92,246,0.32)]',
      activeTab: 'bg-violet-500/35 border-violet-300/75 text-white shadow-[0_0_16px_rgba(139,92,246,0.32)]',
      spotlight: 'from-violet-500/25 via-violet-500/10 to-transparent border-violet-400/45',
      chip: 'border-violet-300/55 bg-violet-500/25 text-violet-100',
      container: 'border-violet-500/30 from-violet-500/10',
      dot: 'bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.95)]',
    },
    customers: {
      activeButton: 'bg-cyan-500/25 border-cyan-300/70 text-white shadow-[0_0_20px_rgba(6,182,212,0.32)]',
      activeTab: 'bg-cyan-500/35 border-cyan-300/75 text-white shadow-[0_0_16px_rgba(6,182,212,0.32)]',
      spotlight: 'from-cyan-500/25 via-cyan-500/10 to-transparent border-cyan-400/45',
      chip: 'border-cyan-300/55 bg-cyan-500/25 text-cyan-100',
      container: 'border-cyan-500/30 from-cyan-500/10',
      dot: 'bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.95)]',
    },
    stock: {
      activeButton: 'bg-emerald-500/25 border-emerald-300/70 text-white shadow-[0_0_20px_rgba(16,185,129,0.32)]',
      activeTab: 'bg-emerald-500/35 border-emerald-300/75 text-white shadow-[0_0_16px_rgba(16,185,129,0.32)]',
      spotlight: 'from-emerald-500/25 via-emerald-500/10 to-transparent border-emerald-400/45',
      chip: 'border-emerald-300/55 bg-emerald-500/25 text-emerald-100',
      container: 'border-emerald-500/30 from-emerald-500/10',
      dot: 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.95)]',
    },
    invoices: {
      activeButton: 'bg-indigo-500/25 border-indigo-300/70 text-white shadow-[0_0_20px_rgba(99,102,241,0.32)]',
      activeTab: 'bg-indigo-500/35 border-indigo-300/75 text-white shadow-[0_0_16px_rgba(99,102,241,0.32)]',
      spotlight: 'from-indigo-500/25 via-indigo-500/10 to-transparent border-indigo-400/45',
      chip: 'border-indigo-300/55 bg-indigo-500/25 text-indigo-100',
      container: 'border-indigo-500/30 from-indigo-500/10',
      dot: 'bg-indigo-300 shadow-[0_0_10px_rgba(165,180,252,0.95)]',
    },
    marketing: {
      activeButton: 'bg-pink-500/25 border-pink-300/70 text-white shadow-[0_0_20px_rgba(236,72,153,0.32)]',
      activeTab: 'bg-pink-500/35 border-pink-300/75 text-white shadow-[0_0_16px_rgba(236,72,153,0.32)]',
      spotlight: 'from-pink-500/25 via-pink-500/10 to-transparent border-pink-400/45',
      chip: 'border-pink-300/55 bg-pink-500/25 text-pink-100',
      container: 'border-pink-500/30 from-pink-500/10',
      dot: 'bg-pink-300 shadow-[0_0_10px_rgba(249,168,212,0.95)]',
    },
    expenses: {
      activeButton: 'bg-amber-500/25 border-amber-300/70 text-white shadow-[0_0_20px_rgba(245,158,11,0.32)]',
      activeTab: 'bg-amber-500/35 border-amber-300/75 text-white shadow-[0_0_16px_rgba(245,158,11,0.32)]',
      spotlight: 'from-amber-500/25 via-amber-500/10 to-transparent border-amber-400/45',
      chip: 'border-amber-300/55 bg-amber-500/25 text-amber-100',
      container: 'border-amber-500/30 from-amber-500/10',
      dot: 'bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.95)]',
    },
    suppliers: {
      activeButton: 'bg-orange-500/25 border-orange-300/70 text-white shadow-[0_0_20px_rgba(249,115,22,0.32)]',
      activeTab: 'bg-orange-500/35 border-orange-300/75 text-white shadow-[0_0_16px_rgba(249,115,22,0.32)]',
      spotlight: 'from-orange-500/25 via-orange-500/10 to-transparent border-orange-400/45',
      chip: 'border-orange-300/55 bg-orange-500/25 text-orange-100',
      container: 'border-orange-500/30 from-orange-500/10',
      dot: 'bg-orange-300 shadow-[0_0_10px_rgba(253,186,116,0.95)]',
    },
    tasks: {
      activeButton: 'bg-teal-500/25 border-teal-300/70 text-white shadow-[0_0_20px_rgba(20,184,166,0.32)]',
      activeTab: 'bg-teal-500/35 border-teal-300/75 text-white shadow-[0_0_16px_rgba(20,184,166,0.32)]',
      spotlight: 'from-teal-500/25 via-teal-500/10 to-transparent border-teal-400/45',
      chip: 'border-teal-300/55 bg-teal-500/25 text-teal-100',
      container: 'border-teal-500/30 from-teal-500/10',
      dot: 'bg-teal-300 shadow-[0_0_10px_rgba(153,246,228,0.95)]',
    },
    insights: {
      activeButton: 'bg-fuchsia-500/25 border-fuchsia-300/70 text-white shadow-[0_0_20px_rgba(217,70,239,0.32)]',
      activeTab: 'bg-fuchsia-500/35 border-fuchsia-300/75 text-white shadow-[0_0_16px_rgba(217,70,239,0.32)]',
      spotlight: 'from-fuchsia-500/25 via-fuchsia-500/10 to-transparent border-fuchsia-400/45',
      chip: 'border-fuchsia-300/55 bg-fuchsia-500/25 text-fuchsia-100',
      container: 'border-fuchsia-500/30 from-fuchsia-500/10',
      dot: 'bg-fuchsia-300 shadow-[0_0_10px_rgba(240,171,252,0.95)]',
    },
    backup: {
      activeButton: 'bg-sky-500/25 border-sky-300/70 text-white shadow-[0_0_20px_rgba(14,165,233,0.32)]',
      activeTab: 'bg-sky-500/35 border-sky-300/75 text-white shadow-[0_0_16px_rgba(14,165,233,0.32)]',
      spotlight: 'from-sky-500/25 via-sky-500/10 to-transparent border-sky-400/45',
      chip: 'border-sky-300/55 bg-sky-500/25 text-sky-100',
      container: 'border-sky-500/30 from-sky-500/10',
      dot: 'bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.95)]',
    },
  };
  const activeAccent = sectionAccent[activeSection];
  const navigationGroups: NavGroup[] = [
    {
      title: 'Core Operations',
      items: [
        { key: 'billing', label: 'Billing Desk', icon: ShoppingCart },
        { key: 'products', label: 'Product Master', icon: Package },
        { key: 'customers', label: 'Customer Profiles', icon: Users },
        { key: 'stock', label: 'Stock Management', icon: BarChart3 },
        { key: 'invoices', label: 'Invoices', icon: Printer },
      ],
    },
    {
      title: 'Growth & Planning',
      items: [
        { key: 'marketing', label: 'Marketing', icon: Megaphone },
        { key: 'expenses', label: 'Expenses', icon: Receipt },
        { key: 'suppliers', label: 'Suppliers', icon: Truck },
        { key: 'tasks', label: 'Tasks & Reminders', icon: ClipboardList },
        { key: 'insights', label: 'Business Insights', icon: LayoutGrid },
      ],
    },
    {
      title: 'Safety',
      items: [{ key: 'backup', label: 'Export & Backup', icon: Download }],
    },
  ];
  const allNavItems: NavItem[] = navigationGroups.flatMap((group) => group.items);
  const filteredPaletteItems = paletteQuery.trim()
    ? allNavItems.filter((item) => item.label.toLowerCase().includes(paletteQuery.toLowerCase()))
    : allNavItems;
  const productsSlideMeta: Array<{ key: ProductsSlide; label: string; hint: string }> = [
    { key: 'add', label: 'Add Product', hint: 'Create new catalog entries' },
    { key: 'manage', label: 'Manage Products', hint: 'Review and remove products' },
  ];
  const customersSlideMeta: Array<{ key: CustomersSlide; label: string; hint: string }> = [
    { key: 'add', label: 'Add Customer', hint: 'Create or update customer profile' },
    { key: 'directory', label: 'Customer Directory', hint: 'View visits, phone and balance' },
  ];
  const marketingSlideMeta: Array<{ key: MarketingSlide; label: string; hint: string }> = [
    { key: 'poster', label: 'Poster Studio', hint: 'Generate promo, caption and social actions' },
    { key: 'sync', label: 'Google Sync', hint: 'Update maps listing details' },
  ];
  const backupSlideMeta: Array<{ key: BackupSlide; label: string; hint: string }> = [
    { key: 'export', label: 'Export', hint: 'Download JSON/CSV backup files' },
    { key: 'restore', label: 'Restore', hint: 'Import backup with preview + safety confirm' },
  ];

  async function addProduct(event: React.FormEvent) {
    event.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.qty) {
      toast.error('Name, price and quantity are required');
      return;
    }
    const response = await fetch('/api/items', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...productForm, price: Number(productForm.price), qty: Number(productForm.qty) }),
    });
    const data = await response.json();
    if (!data.success) return void toast.error(data.error || 'Could not add product');
    setProductForm({ name: '', price: '', qty: '', image: '', description: '' });
    await loadItems();
    toast.success('Product added');
  }

  async function removeProduct(id: string) {
    const response = await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!data.success) return void toast.error(data.error || 'Could not remove product');
    await loadItems();
    toast.success('Product removed');
  }

  async function addCustomer(event: React.FormEvent) {
    event.preventDefault();
    if (!customerForm.name || !customerForm.phone) return void toast.error('Customer name and phone are required');
    const response = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customerForm) });
    const data = await response.json();
    if (!data.success) return void toast.error(data.error || 'Could not save customer');
    setCustomerForm({ name: '', phone: '', email: '', address: '' });
    await loadCustomers();
    setSelectedCustomerId(data.customer.id);
    toast.success('Customer saved');
  }

  function addToCart(item: Product) {
    setCart((previous) => {
      const existing = previous.find((entry) => entry.id === item.id);
      const qtyInCart = existing ? existing.cartQty : 0;
      if (qtyInCart >= item.qty) {
        toast.error(`Only ${item.qty} units in stock`);
        return previous;
      }
      if (existing) return previous.map((entry) => (entry.id === item.id ? { ...entry, cartQty: entry.cartQty + 1 } : entry));
      return [...previous, { ...item, cartQty: 1 }];
    });
  }

  function updateCartQty(id: string, change: number) {
    setCart((previous) => previous.map((entry) => {
      if (entry.id !== id) return entry;
      const nextQty = entry.cartQty + change;
      const stock = Number(items.find((item) => item.id === id)?.qty || 0);
      if (nextQty <= 0) return null as any;
      if (nextQty > stock) return entry;
      return { ...entry, cartQty: nextQty };
    }).filter(Boolean));
  }

  async function createBill() {
    if (cart.length === 0) return void toast.error('Add items to billing cart first');
    
    // Handle Credit Payment
    if (billingState.paymentMethod === 'credit' && selectedCustomer) {
      const newBalance = (selectedCustomer.balance || 0) + grandTotal;
      
      // Update customer balance
      await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCustomer.id, balance: newBalance })
      });
      
      toast.info(`Added ₹${grandTotal} to ${selectedCustomer.name}'s credit`);
    }

    const response = await fetch('/api/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, discount, tax, paymentMethod: billingState.paymentMethod, notes: billingState.notes, customer: selectedCustomer }),
    });
    const data = await response.json();
    if (!data.success) return void toast.error(data.error || 'Billing failed');
    setLatestInvoice(data.invoice);
    setCart([]);
    await Promise.all([loadItems(), loadInvoices(), loadCustomers()]);
    toast.success('Invoice created');
  }

  function printInvoice(invoice: any) {
    if (!invoice) return void toast.error('No invoice available to print');
    const rows = (invoice.items || []).map((entry: any) => `<tr><td style="padding:8px;border:1px solid #ddd;">${entry.name}</td><td style="padding:8px;border:1px solid #ddd;text-align:center;">${entry.qty}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">₹${entry.price}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">₹${entry.lineTotal}</td></tr>`).join('');
    const html = `<html><head><title>Invoice ${invoice.id}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}</style></head><body><h1>Shop Invoice</h1><p>Invoice ID: ${invoice.id}</p><p>Date: ${new Date(invoice.createdAt).toLocaleString()}</p><table><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:left;">Item</th><th style="padding:8px;border:1px solid #ddd;">Qty</th><th style="padding:8px;border:1px solid #ddd;text-align:right;">Price</th><th style="padding:8px;border:1px solid #ddd;text-align:right;">Total</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return void toast.error('Enable popups to print invoice');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }

  function sendWhatsAppBill(invoice: any) {
    if (!invoice) return void toast.error('No invoice available to send');
    
    let phone = invoice.customer?.phone || customers.find(c => c.id === invoice.customerId)?.phone;
    if (!phone) phone = window.prompt("Enter customer WhatsApp number (e.g., 919876543210):");
    if (!phone) return;

    const text = `*INVOICE: ${invoice.id.slice(0, 8)}*\n` +
      `Date: ${new Date(invoice.createdAt).toLocaleDateString()}\n\n` +
      `*Items:*\n${(invoice.items || []).map((item: any) => `• ${item.name} x ${item.qty || item.cartQty} = ₹${item.price * (item.qty || item.cartQty)}`).join('\n')}\n\n` +
      `*Total: ₹${invoice.total}*\n\n` +
      `Thank you for shopping with us!`;

    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function addExpense(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...expenseForm, amount: Number(expenseForm.amount) }) });
    const data = await response.json();
    if (!data.success) return void toast.error(data.error || 'Failed to add expense');
    setExpenseForm({ title: '', amount: '', category: '', date: '', note: '' });
    await loadExpenses();
  }

  async function removeExpense(id: string) { await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' }); await loadExpenses(); }
  async function addSupplier(event: React.FormEvent) { event.preventDefault(); const response = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...supplierForm, leadTimeDays: Number(supplierForm.leadTimeDays || 0) }) }); const data = await response.json(); if (!data.success) return void toast.error(data.error || 'Failed to add supplier'); setSupplierForm({ name: '', phone: '', products: '', leadTimeDays: '', notes: '' }); await loadSuppliers(); }
  async function removeSupplier(id: string) { await fetch(`/api/suppliers?id=${id}`, { method: 'DELETE' }); await loadSuppliers(); }
  async function addTask(event: React.FormEvent) { event.preventDefault(); const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskForm) }); const data = await response.json(); if (!data.success) return void toast.error(data.error || 'Failed to add task'); setTaskForm({ title: '', dueDate: '', priority: 'medium' }); await loadTasks(); }
  async function toggleTask(task: TaskItem) { await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, done: !task.done }) }); await loadTasks(); }
  async function removeTask(id: string) { await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' }); await loadTasks(); }

  async function createOrderRequestTask(product: Product, supplier?: Supplier, options?: { silent?: boolean }) {
    if (hasPendingOrderRequest(product.name, supplier?.name)) {
      if (!options?.silent) toast.info(`Order request already pending for ${product.name}`);
      return false;
    }

    const leadTimeDays = Math.max(0, Number(supplier?.leadTimeDays || 0));
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + leadTimeDays);

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: supplier
          ? `Order request: ${product.name} from ${supplier.name}`
          : `Order request: ${product.name} (supplier not mapped)`,
        dueDate: dueDate.toISOString().slice(0, 10),
        priority: product.qty <= 0 ? 'high' : 'medium',
      }),
    });

    const data = await response.json();
    if (!data.success) {
      if (!options?.silent) toast.error(data.error || 'Failed to create order request');
      return false;
    }

    return true;
  }

  async function createOrderRequestForItem(product: Product) {
    const supplier = getMatchingSuppliers(product.name)[0];
    const created = await createOrderRequestTask(product, supplier);
    if (!created) return;
    await loadTasks();
    toast.success(`Order request created for ${product.name}`);
  }

  async function createOrderRequestsForShortage() {
    const targetItems = outOfStockItems.length > 0 ? outOfStockItems : lowStockItems;
    if (!targetItems.length) {
      toast.success('No low stock items to request right now');
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const product of targetItems) {
      const supplier = getMatchingSuppliers(product.name)[0];
      const success = await createOrderRequestTask(product, supplier, { silent: true });
      if (success) created += 1;
      else skipped += 1;
    }

    await loadTasks();

    if (created === 0) {
      toast.info('Order requests already exist for selected stock shortage items');
      return;
    }

    toast.success(`Created ${created} order request${created > 1 ? 's' : ''}${skipped ? `, skipped ${skipped}` : ''}`);
  }

  function getPromoHashtags() {
    const product = selectedMarketingProduct?.name?.replace(/\s+/g, '') || 'ShopProduct';
    const area = marketingForm.area.replace(/\s+/g, '') || 'LocalArea';
    return `#${product} #FreshStock #BestPrice #${area} #LocalShop #DailyDeals`;
  }

  function getPosterFileMeta(dataUrl: string) {
    if (dataUrl.startsWith('data:image/png')) return { mimeType: 'image/png', extension: 'png' };
    if (dataUrl.startsWith('data:image/jpeg')) return { mimeType: 'image/jpeg', extension: 'jpg' };
    if (dataUrl.startsWith('data:image/webp')) return { mimeType: 'image/webp', extension: 'webp' };
    if (dataUrl.startsWith('data:image/svg+xml')) return { mimeType: 'image/svg+xml', extension: 'svg' };
    return { mimeType: 'image/png', extension: 'png' };
  }

  async function dataUrlToBlob(dataUrl: string) {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  async function downloadPosterFile(options?: { silent?: boolean }) {
    if (!promoResult) return void toast.error('Generate promo first');

    const { extension } = getPosterFileMeta(promoResult.posterDataUrl);
    const safeProduct = (selectedMarketingProduct?.name || 'poster').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const fileName = `${safeProduct || 'promo-poster'}-${Date.now()}.${extension}`;

    try {
      const blob = await dataUrlToBlob(promoResult.posterDataUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (!options?.silent) toast.success('Poster downloaded');
      return fileName;
    } catch {
      if (!options?.silent) toast.error('Unable to download poster');
      return null;
    }
  }

  async function generatePromo() {
    if (!selectedMarketingProduct) return void toast.error('Select a product for promo generation');
    setIsGeneratingPromo(true);
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
      const data = await response.json();
      if (!data.success) return void toast.error(data.error || 'Failed to generate promo');
      setPromoResult(data.data);
      toast.success('Promo generated');
    } finally { setIsGeneratingPromo(false); }
  }

  async function syncGoogleBusiness() {
    setIsSyncingGmb(true);
    try {
      const response = await fetch('/api/marketing/google-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ openingHours: marketingForm.openingHours, specialOffer: marketingForm.specialOffer }) });
      const data = await response.json();
      if (!data.success) return void toast.error(data.error || 'Google sync failed');
      if (data?.data?.liveSync) {
        toast.success(data.message || 'Google My Business updated');
      } else {
        toast.success(data.message || 'Google sync saved in demo mode');
      }
    } finally { setIsSyncingGmb(false); }
  }

  async function sharePromoOnWhatsApp() {
    if (!promoResult) return void toast.error('Generate promo first');

    const shareText = `${promoResult.caption}\n\n${getPromoHashtags()}`;
    const { mimeType, extension } = getPosterFileMeta(promoResult.posterDataUrl);

    try {
      const blob = await dataUrlToBlob(promoResult.posterDataUrl);
      const file = new File([blob], `promo-poster.${extension}`, { type: mimeType });

      if (navigator.share && (navigator as any).canShare?.({ files: [file] })) {
        await navigator.share({
          text: shareText,
          files: [file],
          title: 'Promo Poster',
        });
        return;
      }
    } catch {}

    const captionCopied = await navigator.clipboard.writeText(shareText).then(() => true).catch(() => false);
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    const fileName = await downloadPosterFile({ silent: true });
    const copiedLabel = captionCopied ? 'Caption copied' : 'Caption ready in WhatsApp';

    if (fileName) {
      toast.success(`${copiedLabel}. Poster downloaded as ${fileName}. Attach it from Downloads in WhatsApp.`);
    } else {
      toast.success(`${copiedLabel}. WhatsApp opened.`);
      toast.error('Poster auto-download failed. Use Download Poster button, then attach the file manually in WhatsApp.');
    }
  }

  function downloadInstagramCaptionPack() {
    if (!promoResult) return void toast.error('Generate promo first');
    const content = `Caption:\n${promoResult.caption}\n\nHashtags:\n${getPromoHashtags()}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'instagram-caption-pack.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadBackup(format: 'json' | 'csv') {
    try {
      const response = await fetch(`/api/export?format=${format}`);
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Export failed');
        return;
      }

      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shopkeeper-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        const csvText = await response.text();
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shopkeeper-backup-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      toast.success(`Backup downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  }

  function getBackupPreview(payload: any): BackupPreview {
    const source = payload?.data ? payload.data : payload;
    return {
      items: Array.isArray(source?.items) ? source.items.length : 0,
      customers: Array.isArray(source?.customers) ? source.customers.length : 0,
      invoices: Array.isArray(source?.invoices) ? source.invoices.length : 0,
      expenses: Array.isArray(source?.expenses) ? source.expenses.length : 0,
      suppliers: Array.isArray(source?.suppliers) ? source.suppliers.length : 0,
      tasks: Array.isArray(source?.tasks) ? source.tasks.length : 0,
    };
  }

  async function handleBackupFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setBackupFileName('');
      setBackupPayload(null);
      setBackupPreview(null);
      setRestoreConfirmed(false);
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const preview = getBackupPreview(parsed);

      setBackupFileName(file.name);
      setBackupPayload(parsed);
      setBackupPreview(preview);
      setRestoreConfirmed(false);
      toast.success('Backup preview loaded');
    } catch {
      setBackupFileName('');
      setBackupPayload(null);
      setBackupPreview(null);
      setRestoreConfirmed(false);
      toast.error('Invalid JSON backup file');
    }
  }

  async function restoreBackupFromJson() {
    if (!backupPayload) return void toast.error('Select a valid backup JSON file first');
    if (!restoreConfirmed) return void toast.error('Please confirm restore before continuing');

    setIsRestoringBackup(true);
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupPayload),
      });
      const data = await response.json();
      if (!data.success) return void toast.error(data.error || 'Restore failed');

      await loadAll();
      toast.success('Backup restored successfully');
      setRestoreConfirmed(false);
    } catch {
      toast.error('Restore failed');
    } finally {
      setIsRestoringBackup(false);
    }
  }

  function switchSection(section: Section) {
    setActiveSection(section);
    setIsSidebarOpen(false);
    setRecentSections((previous) => {
      const next = [section, ...previous.filter((entry) => entry !== section)];
      return next.slice(0, 6);
    });
  }

  function toggleFavorite(section: Section) {
    setFavoriteSections((previous) =>
      previous.includes(section)
        ? previous.filter((entry) => entry !== section)
        : [...previous, section]
    );
  }

  function startRailResize(event: React.MouseEvent<HTMLDivElement>) {
    setIsRailResizing(true);
    railResizeRef.current = { startX: event.clientX, startWidth: rightRailWidth };
    window.addEventListener('mousemove', onRailResize);
    window.addEventListener('mouseup', stopRailResize);
  }

  function onRailResize(event: MouseEvent) {
    if (!railResizeRef.current) return;
    const delta = event.clientX - railResizeRef.current.startX;
    const nextWidth = Math.min(420, Math.max(240, railResizeRef.current.startWidth + delta));
    setRightRailWidth(nextWidth);
  }

  function stopRailResize() {
    setIsRailResizing(false);
    railResizeRef.current = null;
    window.removeEventListener('mousemove', onRailResize);
    window.removeEventListener('mouseup', stopRailResize);
  }

  function getSectionBadge(section: Section) {
    switch (section) {
      case 'billing':
        return cart.length;
      case 'products':
        return items.length;
      case 'customers':
        return customers.length;
      case 'stock':
        return lowStockCount;
      case 'invoices':
        return invoices.length;
      case 'marketing':
        return selectedMarketingProduct ? 1 : 0;
      case 'expenses':
        return expenses.length;
      case 'suppliers':
        return suppliers.length;
      case 'tasks':
        return pendingTasks;
      case 'insights':
        return Math.max(0, Math.round(todaySales - totalExpenses));
      case 'backup':
        return backupPayload ? 1 : 0;
      default:
        return 0;
    }
  }

  if (!isMounted) {
    return <main className="app-shell relative overflow-hidden" suppressHydrationWarning />;
  }

  return (
    <main className="app-shell relative overflow-hidden" suppressHydrationWarning>
      <div className="pointer-events-none absolute inset-0 app-grid-bg opacity-35" />
      <div className="pointer-events-none absolute -top-24 right-0 h-[26rem] w-[26rem] rounded-full bg-gemini-blue-500/15 blur-[160px]" />

      <div className="relative z-10 mx-auto max-w-[92rem] px-4 md:px-6 xl:px-8 py-8 md:py-10 space-y-8">
        <header className="premium-card neon-panel admin-hero">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-gemini-blue-300">Shopkeeper Operating System</p>
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white to-gemini-blue-200 bg-clip-text text-transparent">One Place for All Shopkeeper Services</h1>
              <p className="mt-3 text-gemini-blue-200 max-w-2xl">Billing, inventory, marketing, supplier management, expenses, tasks and insights.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => setActiveSection('marketing')} className="premium-button-primary float-on-hover text-sm">Open Marketing</button>
                <button type="button" onClick={() => setActiveSection('billing')} className="premium-button-ghost float-on-hover text-sm">Open Billing</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="admin-kpi-card border-gemini-blue-400/45 bg-gradient-to-br from-gemini-blue-500/20 to-black/50"><p className="text-gemini-blue-200">Stock Value</p><p className="text-white font-bold">₹{stockValue.toFixed(0)}</p><p className="text-[10px] text-gemini-blue-300 mt-1">Low stock: {lowStockCount}</p></div>
              <div className="admin-kpi-card border-gemini-blue-400/45 bg-gradient-to-br from-gemini-blue-500/20 to-black/50"><p className="text-gemini-blue-200">Today Sales</p><p className="text-white font-bold">₹{todaySales.toFixed(0)}</p><p className="text-[10px] text-gemini-blue-300 mt-1">Invoices: {invoices.length}</p></div>
              <div className="admin-kpi-card border-gemini-blue-400/45 bg-gradient-to-br from-gemini-blue-500/20 to-black/50"><p className="text-gemini-blue-200">Expenses</p><p className="text-white font-bold">₹{totalExpenses.toFixed(0)}</p><p className="text-[10px] text-gemini-blue-300 mt-1">Entries: {expenses.length}</p></div>
              <div className="admin-kpi-card border-gemini-blue-400/45 bg-gradient-to-br from-gemini-blue-500/20 to-black/50"><p className="text-gemini-blue-200">Pending Tasks</p><p className="text-white font-bold">{pendingTasks}</p><p className="text-[10px] text-gemini-blue-300 mt-1">Suppliers: {suppliers.length}</p></div>
            </div>
          </div>
        </header>

        <section className={`xl:col-span-2 grid gap-6 items-start relative ${isSidebarCollapsed ? 'lg:grid-cols-[92px_1fr]' : 'lg:grid-cols-[290px_1fr]'}`}>
          <div className="lg:hidden flex items-center justify-between mb-2">
            <button type="button" onClick={() => setIsSidebarOpen(true)} className="premium-button-ghost">
              <Menu className="w-4 h-4 mr-2" /> Open Navigation
            </button>
            <p className="text-xs uppercase tracking-[0.16em] text-gemini-blue-300">Current: {activeSection}</p>
          </div>

          {isSidebarOpen && (
            <button
              type="button"
              aria-label="Close sidebar overlay"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <aside className={`premium-card neon-panel p-4 lg:sticky lg:top-6 z-30 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'fixed top-6 left-4 right-4 translate-x-0 max-h-[85vh] overflow-auto' : 'fixed top-6 left-4 right-4 -translate-x-[120%] max-h-[85vh] overflow-auto'} lg:relative lg:left-auto lg:right-auto lg:top-auto`}>
            <div className="flex items-center justify-between mb-3">
              {!isSidebarCollapsed && <p className="text-xs uppercase tracking-[0.18em] text-gemini-blue-300">Workspace</p>}
              <div className="flex items-center gap-2">
                <button type="button" className="premium-button-ghost hidden lg:inline-flex px-2 py-1 text-xs" onClick={() => setIsSidebarCollapsed((previous) => !previous)}>
                  {isSidebarCollapsed ? 'Expand' : 'Collapse'}
                </button>
              <button type="button" className="premium-button-ghost lg:hidden px-2 py-1" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </button>
              </div>
            </div>
            <div className="space-y-4">
              {navigationGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  {!isSidebarCollapsed && <p className="text-[11px] uppercase tracking-[0.16em] text-gemini-blue-400/80">{group.title}</p>}
                  <div className="space-y-2">
                    {group.items.map((tab) => (
                      <button key={tab.key} type="button" onClick={() => switchSection(tab.key as Section)} className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 flex items-center gap-2 ${activeSection === tab.key ? sectionAccent[tab.key as Section].activeButton : 'bg-black/40 border-gemini-blue-500/25 text-gemini-blue-200 hover:bg-gemini-blue-500/10'}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${activeSection === tab.key ? sectionAccent[tab.key as Section].dot : 'bg-gemini-blue-500/40'}`} />
                        <tab.icon className="w-4 h-4" />
                        {!isSidebarCollapsed && <span className="text-sm font-medium flex-1">{tab.label}</span>}
                        {!isSidebarCollapsed && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${activeSection === tab.key ? 'border-gemini-blue-200/60 text-gemini-blue-100 bg-gemini-blue-500/30' : 'border-gemini-blue-500/30 text-gemini-blue-300 bg-black/30'}`}>
                            {getSectionBadge(tab.key as Section)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className={`grid gap-6 min-w-0 ${isRightRailOpen ? 'xl:grid-cols-[1fr_auto]' : 'xl:grid-cols-1'}`}>
            <div className="space-y-6 min-w-0">
            <div className="premium-card neon-panel p-3">
              <div>
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-gemini-blue-300 absolute left-3 top-3.5" />
                  <input
                    ref={sectionSearchRef}
                    className="premium-input pl-9 w-full h-11"
                    placeholder="Command search: jump to Billing, Stock, Marketing..."
                    value={sectionQuery}
                    onChange={(e) => setSectionQuery(e.target.value)}
                  />
                </div>
              </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setLayoutMode('standard')} className={`px-3 py-1.5 rounded-md border text-xs ${layoutMode === 'standard' ? 'border-gemini-blue-300/70 bg-gemini-blue-500/25 text-white' : 'border-gemini-blue-500/30 text-gemini-blue-100 bg-black/35'}`}>Standard Mode</button>
                  <button type="button" onClick={() => setLayoutMode('focus')} className={`px-3 py-1.5 rounded-md border text-xs ${layoutMode === 'focus' ? 'border-gemini-blue-300/70 bg-gemini-blue-500/25 text-white' : 'border-gemini-blue-500/30 text-gemini-blue-100 bg-black/35'}`}>Focus Mode</button>
                  <button type="button" onClick={() => setLayoutMode('analytics')} className={`px-3 py-1.5 rounded-md border text-xs ${layoutMode === 'analytics' ? 'border-gemini-blue-300/70 bg-gemini-blue-500/25 text-white' : 'border-gemini-blue-500/30 text-gemini-blue-100 bg-black/35'}`}>Analytics Mode</button>
                </div>
              <div className="mt-2 text-[11px] text-gemini-blue-300 flex flex-wrap gap-x-4 gap-y-1">
                <span>⌘/Ctrl + K: Command Palette</span>
                  <span>⌘/Ctrl + J: Utility Slidebar</span>
                <span>/ : Focus Command Search</span>
                <span>B/M/P/T: Quick Jump</span>
                <span>Shift + F: Pin/Unpin Active</span>
              </div>
            </div>

            <div className="premium-card neon-panel p-3 sticky top-3 z-10">
              <div className={`rounded-xl border bg-gradient-to-r px-3 py-2.5 mb-3 ${activeAccent.spotlight}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-gemini-blue-200">Active Workspace</p>
                    <p className="text-sm md:text-base font-semibold text-white">{sectionMeta[activeSection].title}</p>
                    <p className="text-xs text-gemini-blue-200">{sectionMeta[activeSection].description}</p>
                  </div>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${activeAccent.chip}`}>
                    {sectionMeta[activeSection].chip}
                  </span>
                </div>
              </div>
              <div className="mt-2 rounded-lg border border-gemini-blue-500/25 bg-black/25 px-3 py-2 text-xs text-gemini-blue-200">
                Use the left Workspace menu as the single page switch bar.
              </div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={activeSection} initial={{ opacity: 0, y: 20, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.992 }} transition={{ type: 'spring', stiffness: 170, damping: 24, mass: 0.75 }} className={`admin-content-stage rounded-2xl border bg-gradient-to-b to-transparent p-1 ${activeAccent.container}`}>

                {activeSection === 'billing' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-gemini-blue-300" />Billing Desk</h2>
                    <div className="grid gap-4 mb-4 xl:grid-cols-[1.35fr_1fr]">
                      <div className="rounded-2xl border border-gemini-blue-500/30 bg-black/30 p-4 space-y-3">
                        <p className="text-sm text-gemini-blue-200">Select customer and add products.</p>
                        <div className="flex gap-2">
                          <select className="premium-input flex-1" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                            <option value="">Walk-in customer</option>
                            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} • {customer.phone}</option>)}
                          </select>
                          {selectedCustomer && (
                            <div className={`px-3 py-2 rounded-lg border flex items-center ${selectedCustomer.balance && selectedCustomer.balance > 0 ? 'border-red-500/50 bg-red-500/10 text-red-200' : 'border-green-500/50 bg-green-500/10 text-green-200'}`}>
                              <span className="text-xs font-mono whitespace-nowrap">Due: ₹{selectedCustomer.balance || 0}</span>
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <Search className="w-4 h-4 text-gemini-blue-300 absolute left-3 top-3.5" />
                          <input
                            className="premium-input pl-9"
                            placeholder="Search products for billing"
                            value={billingState.search}
                            onChange={(e) => setBillingState({ ...billingState, search: e.target.value })}
                          />
                        </div>
                        <div className="max-h-64 overflow-auto space-y-2">
                          {filteredProducts.slice(0, 14).map((item) => (
                            <button key={item.id} type="button" className="w-full text-left border border-gemini-blue-500/25 rounded-xl p-3 bg-black/35 hover:border-gemini-blue-300/50" onClick={() => addToCart(item)}>
                              <div className="flex items-center justify-between"><p className="text-white font-medium">{item.name}</p><p className="text-gemini-blue-200">₹{item.price}</p></div>
                              <p className="text-xs text-gemini-blue-300">Available: {item.qty}</p>
                            </button>
                          ))}
                          {filteredProducts.length === 0 && (
                            <div className="rounded-xl border border-gemini-blue-500/25 bg-black/35 p-3 text-sm text-gemini-blue-200">No products match current search.</div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gemini-blue-500/30 bg-black/30 p-4 space-y-3">
                        <p className="text-sm text-gemini-blue-200">Review cart and create invoice.</p>
                        <div className="space-y-3 max-h-52 overflow-auto pr-1">
                          {cart.map((entry) => (
                            <div key={entry.id} className="border border-gemini-blue-500/25 rounded-xl p-3 bg-black/35 flex items-center justify-between">
                              <div><p className="text-white font-medium">{entry.name}</p><p className="text-xs text-gemini-blue-300">₹{entry.price} each</p></div>
                              <div className="flex items-center gap-2">
                                <button className="premium-button-ghost p-2" type="button" onClick={() => updateCartQty(entry.id, -1)}><Minus className="h-4 w-4" /></button>
                                <span className="text-white min-w-7 text-center">{entry.cartQty}</span>
                                <button className="premium-button-ghost p-2" type="button" onClick={() => updateCartQty(entry.id, 1)}><Plus className="h-4 w-4" /></button>
                              </div>
                            </div>
                          ))}
                          {cart.length === 0 && (
                            <div className="rounded-xl border border-gemini-blue-500/25 bg-black/35 p-3 text-sm text-gemini-blue-200">Cart is empty. Add products from the left panel.</div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <select className="premium-input" value={billingState.paymentMethod} onChange={(e) => setBillingState({ ...billingState, paymentMethod: e.target.value })}>
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="card">Card</option>
                            <option value="credit">Credit (Udhaar)</option>
                          </select>
                          <input className="premium-input" placeholder="Notes" value={billingState.notes} onChange={(e) => setBillingState({ ...billingState, notes: e.target.value })} />
                          <input className="premium-input" type="number" min="0" placeholder="Discount" value={billingState.discount} onChange={(e) => setBillingState({ ...billingState, discount: e.target.value })} />
                          <input className="premium-input" type="number" min="0" placeholder="Tax" value={billingState.tax} onChange={(e) => setBillingState({ ...billingState, tax: e.target.value })} />
                        </div>

                        <div className="rounded-xl border border-gemini-blue-500/30 bg-black/45 p-4 text-sm">
                          <div className="flex justify-between"><span className="text-gemini-blue-300">Subtotal</span><span className="text-white">₹{subtotal.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gemini-blue-300">Discount</span><span className="text-white">₹{discount.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gemini-blue-300">Tax</span><span className="text-white">₹{tax.toFixed(2)}</span></div>
                          <div className="flex justify-between font-semibold pt-2 border-t border-gemini-blue-500/25"><span className="text-white">Grand Total</span><span className="text-white">₹{grandTotal.toFixed(2)}</span></div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button className="premium-button-primary text-xs" type="button" onClick={createBill} disabled={cart.length === 0}>Create Bill & Deduct Stock</button>
                          <button className="premium-button-ghost text-xs" type="button" onClick={() => printInvoice(latestInvoice)}><Printer className="h-4 w-4 mr-1" />Print Last Bill</button>
                          <button className="premium-button-ghost text-xs text-green-400 hover:text-green-300" type="button" onClick={() => sendWhatsAppBill(latestInvoice)}><MessageCircle className="h-4 w-4 mr-1" />WhatsApp Bill</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'products' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-gemini-blue-300" />Product Master</h2>
                    <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-gemini-blue-500/30 bg-black/30 p-2">
                      {productsSlideMeta.map((slide) => (
                        <button
                          key={slide.key}
                          type="button"
                          onClick={() => setProductsSlide(slide.key)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${productsSlide === slide.key ? 'border-gemini-blue-300/75 bg-gemini-blue-500/20 text-white' : 'border-gemini-blue-500/25 bg-black/35 text-gemini-blue-100 hover:bg-gemini-blue-500/10'}`}
                        >
                          {slide.label}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={productsSlide}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{ type: 'spring', stiffness: 190, damping: 24 }}
                        className="rounded-2xl border border-gemini-blue-500/30 bg-black/30 p-4"
                      >
                        {productsSlide === 'add' && (
                          <form onSubmit={addProduct} className="grid md:grid-cols-2 gap-3">
                            <input className="premium-input md:col-span-2" placeholder="Product name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                            <input className="premium-input" type="number" min="0" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                            <input className="premium-input" type="number" min="0" placeholder="Stock qty" value={productForm.qty} onChange={(e) => setProductForm({ ...productForm, qty: e.target.value })} />
                            <input className="premium-input md:col-span-2" placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} />
                            <textarea className="premium-input md:col-span-2 min-h-20" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                            <button className="premium-button-primary float-on-hover md:col-span-2" type="submit"><Plus className="h-4 w-4 mr-2" />Add Product</button>
                          </form>
                        )}

                        {productsSlide === 'manage' && (
                          <div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 overflow-hidden">
                            <div className="hidden md:grid md:grid-cols-[1.4fr_0.5fr_0.5fr_0.35fr] px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-gemini-blue-300 bg-gemini-blue-500/10 border-b border-gemini-blue-500/20">
                              <span>Product</span><span>Price</span><span>Stock</span><span className="text-right">Action</span>
                            </div>
                            <div className="max-h-[360px] overflow-auto divide-y divide-gemini-blue-500/20">
                              {items.map((item) => (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1.4fr_0.5fr_0.5fr_0.35fr] items-center gap-2 px-4 py-3 hover:bg-gemini-blue-500/8 transition-colors">
                                  <div>
                                    <p className="text-white font-medium">{item.name}</p>
                                    <p className="text-xs text-gemini-blue-300 md:hidden">₹{item.price} • Stock {item.qty}</p>
                                  </div>
                                  <p className="hidden md:block text-gemini-blue-100">₹{item.price}</p>
                                  <p className="hidden md:block text-gemini-blue-100">{item.qty}</p>
                                  <div className="flex md:justify-end">
                                    <button className="premium-button-ghost text-red-300" type="button" onClick={() => removeProduct(item.id)} aria-label={`Remove ${item.name}`}>
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}

                {activeSection === 'customers' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-gemini-blue-300" />Customer Profiles</h2>
                    <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-gemini-blue-500/30 bg-black/30 p-2">
                      {customersSlideMeta.map((slide) => (
                        <button
                          key={slide.key}
                          type="button"
                          onClick={() => setCustomersSlide(slide.key)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${customersSlide === slide.key ? 'border-gemini-blue-300/75 bg-gemini-blue-500/20 text-white' : 'border-gemini-blue-500/25 bg-black/35 text-gemini-blue-100 hover:bg-gemini-blue-500/10'}`}
                        >
                          {slide.label}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={customersSlide}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{ type: 'spring', stiffness: 190, damping: 24 }}
                        className="rounded-2xl border border-gemini-blue-500/30 bg-black/30 p-4"
                      >
                        {customersSlide === 'add' && (
                          <form onSubmit={addCustomer} className="grid md:grid-cols-2 gap-3"><input className="premium-input" placeholder="Customer name" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} /><input className="premium-input" placeholder="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} /><input className="premium-input" placeholder="Email" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} /><input className="premium-input" placeholder="Address" value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} /><button className="premium-button-primary float-on-hover md:col-span-2" type="submit">Save Customer</button></form>
                        )}

                        {customersSlide === 'directory' && (
                          <div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 overflow-hidden">
                            <div className="hidden md:grid md:grid-cols-[1.2fr_0.8fr_0.5fr_0.5fr] px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-gemini-blue-300 bg-gemini-blue-500/10 border-b border-gemini-blue-500/20">
                              <span>Name</span><span>Phone</span><span>Visits</span><span>Balance</span>
                            </div>
                            <div className="max-h-[360px] overflow-auto divide-y divide-gemini-blue-500/20">
                              {customers.map((customer) => (
                                <div key={customer.id} className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr_0.5fr_0.5fr] items-center gap-2 px-4 py-3 hover:bg-gemini-blue-500/8 transition-colors">
                                  <div>
                                    <p className="text-white font-medium">{customer.name}</p>
                                    <p className="text-xs text-gemini-blue-300 md:hidden">{customer.phone} • Visits {customer.purchaseCount || 0}</p>
                                  </div>
                                  <p className="hidden md:block text-gemini-blue-100">{customer.phone}</p>
                                  <p className="hidden md:block text-gemini-blue-100">{customer.purchaseCount || 0}</p>
                                  <p className={`text-sm font-mono ${customer.balance && customer.balance > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                                    ₹{customer.balance || 0}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}

                {activeSection === 'stock' && <StockManagement items={items} onAddToBill={addToCart} onRefresh={loadItems} />}

                {activeSection === 'invoices' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4">Invoices</h2>
                    <div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 overflow-hidden">
                      <div className="hidden md:grid md:grid-cols-[1fr_1fr_0.5fr_0.45fr] px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-gemini-blue-300 bg-gemini-blue-500/10 border-b border-gemini-blue-500/20">
                        <span>Invoice ID</span><span>Date</span><span>Total</span><span className="text-right">Actions</span>
                      </div>
                      <div className="max-h-[400px] overflow-auto divide-y divide-gemini-blue-500/20">
                        {invoices.map((invoice) => (
                          <div key={invoice.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_0.5fr_0.45fr] items-center gap-2 px-4 py-3 hover:bg-gemini-blue-500/8 transition-colors">
                            <div>
                              <p className="text-white font-medium">Invoice {invoice.id}</p>
                              <p className="text-xs text-gemini-blue-300 md:hidden">{new Date(invoice.createdAt).toLocaleString()} • ₹{invoice.total}</p>
                            </div>
                            <p className="hidden md:block text-gemini-blue-100">{new Date(invoice.createdAt).toLocaleString()}</p>
                            <p className="hidden md:block text-gemini-blue-100">₹{invoice.total}</p>
                            <div className="flex md:justify-end gap-2">
                              <button className="premium-button-ghost" onClick={() => printInvoice(invoice)} aria-label={`Print invoice ${invoice.id}`}><Printer className="h-4 w-4" /></button>
                              <button className="premium-button-ghost text-green-400 hover:text-green-300" onClick={() => sendWhatsAppBill(invoice)} aria-label={`Send invoice ${invoice.id} on WhatsApp`}><MessageCircle className="h-4 w-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'marketing' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-gemini-blue-300" />Marketing Studio</h2>

                    <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-gemini-blue-500/30 bg-black/30 p-2">
                      {marketingSlideMeta.map((slide) => (
                        <button
                          key={slide.key}
                          type="button"
                          onClick={() => setMarketingSlide(slide.key)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${marketingSlide === slide.key ? 'border-gemini-blue-300/75 bg-gemini-blue-500/20 text-white' : 'border-gemini-blue-500/25 bg-black/35 text-gemini-blue-100 hover:bg-gemini-blue-500/10'}`}
                        >
                          {slide.label}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={marketingSlide}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{ type: 'spring', stiffness: 190, damping: 24 }}
                        className="rounded-2xl border border-gemini-blue-500/30 bg-black/30 p-4"
                      >
                        {marketingSlide === 'poster' && (
                          <>
                            <div className="grid md:grid-cols-2 gap-3 mb-3"><input className="premium-input" placeholder="Shop name" value={marketingForm.shopName} onChange={(e) => setMarketingForm({ ...marketingForm, shopName: e.target.value })} /><input className="premium-input" placeholder="Area" value={marketingForm.area} onChange={(e) => setMarketingForm({ ...marketingForm, area: e.target.value })} /><select className="premium-input md:col-span-2" value={marketingForm.productId} onChange={(e) => setMarketingForm({ ...marketingForm, productId: e.target.value })}><option value="">Select product</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                            <button type="button" className="premium-button-primary float-on-hover" onClick={generatePromo}>{isGeneratingPromo ? 'Generating Promo...' : 'Generate Promo'}</button>
                            {promoResult && <div className="mt-4 space-y-3"><img src={promoResult.posterDataUrl} alt="poster" className="w-full max-w-md rounded-xl border border-gemini-blue-500/35" /><div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 p-3"><p className="text-xs uppercase text-gemini-blue-300 mb-1">Caption</p><p className="text-white">{promoResult.caption}</p></div><div className="flex flex-wrap gap-2"><button type="button" className="premium-button-ghost" onClick={() => { navigator.clipboard.writeText(promoResult.caption); toast.success('Caption copied'); }}><Copy className="h-4 w-4 mr-2" />Copy Caption</button><button type="button" onClick={() => { void downloadPosterFile(); }} className="premium-button-ghost inline-flex items-center"><Download className="h-4 w-4 mr-2" />Download Poster</button></div><div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 p-4"><p className="text-xs uppercase text-gemini-blue-300 mb-2">Quick Social Actions</p><div className="flex flex-wrap gap-2 mb-2"><button type="button" className="premium-button-primary" onClick={sharePromoOnWhatsApp}><MessageCircle className="h-4 w-4 mr-2" />Share on WhatsApp</button><button type="button" className="premium-button-ghost" onClick={downloadInstagramCaptionPack}><ExternalLink className="h-4 w-4 mr-2" />Export Instagram Pack</button><button type="button" className="premium-button-ghost" onClick={() => { navigator.clipboard.writeText(getPromoHashtags()); toast.success('Hashtags copied'); }}><Copy className="h-4 w-4 mr-2" />Copy Hashtags</button></div><p className="text-sm text-gemini-blue-100">{getPromoHashtags()}</p></div></div>}
                          </>
                        )}

                        {marketingSlide === 'sync' && (
                          <>
                            <h3 className="text-lg font-semibold text-white mb-3">Google My Business Sync</h3>
                            <div className="grid md:grid-cols-2 gap-3 mb-3"><input className="premium-input" placeholder="Opening hours" value={marketingForm.openingHours} onChange={(e) => setMarketingForm({ ...marketingForm, openingHours: e.target.value })} /><input className="premium-input" placeholder="Special offer" value={marketingForm.specialOffer} onChange={(e) => setMarketingForm({ ...marketingForm, specialOffer: e.target.value })} /></div>
                            <button type="button" className="premium-button-primary float-on-hover" onClick={syncGoogleBusiness}>{isSyncingGmb ? 'Syncing...' : 'Sync to Google Maps'}</button>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}

                {activeSection === 'expenses' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Receipt className="w-5 h-5 text-gemini-blue-300" />Expense Tracker</h2>
                    <form onSubmit={addExpense} className="grid md:grid-cols-2 gap-3 mb-4"><input className="premium-input" placeholder="Title" value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} /><input className="premium-input" type="number" min="0" placeholder="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} /><input className="premium-input" placeholder="Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} /><input className="premium-input" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} /><input className="premium-input md:col-span-2" placeholder="Note" value={expenseForm.note} onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })} /><button className="premium-button-primary md:col-span-2" type="submit">Add Expense</button></form>
                    <div className="space-y-3 max-h-[360px] overflow-auto">{expenses.map((expense) => <div key={expense.id} className="border border-gemini-blue-500/25 rounded-xl p-3 bg-black/40 flex items-center justify-between"><div><p className="text-white font-medium">{expense.title}</p><p className="text-xs text-gemini-blue-300">₹{expense.amount} • {expense.category}</p></div><button className="premium-button-ghost text-red-300" onClick={() => removeExpense(expense.id)}><Trash2 className="h-4 w-4" /></button></div>)}</div>
                  </div>
                )}

                {activeSection === 'suppliers' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-gemini-blue-300" />Suppliers</h2>
                    <form onSubmit={addSupplier} className="grid md:grid-cols-2 gap-3 mb-4"><input className="premium-input" placeholder="Supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} /><input className="premium-input" placeholder="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} /><input className="premium-input" placeholder="Products" value={supplierForm.products} onChange={(e) => setSupplierForm({ ...supplierForm, products: e.target.value })} /><input className="premium-input" type="number" min="0" placeholder="Lead time (days)" value={supplierForm.leadTimeDays} onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeDays: e.target.value })} /><input className="premium-input md:col-span-2" placeholder="Notes" value={supplierForm.notes} onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })} /><button className="premium-button-primary md:col-span-2" type="submit">Save Supplier</button></form>
                    <div className="mb-4 rounded-xl border border-gemini-blue-500/30 bg-black/35 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white">Auto Order Requests</p>
                          <p className="text-xs text-gemini-blue-300">Create task reminders when stock is low or out of stock.</p>
                        </div>
                        <button
                          type="button"
                          className="premium-button-primary text-xs"
                          onClick={() => void createOrderRequestsForShortage()}
                          disabled={lowStockItems.length === 0}
                        >
                          Create Requests for Shortage
                        </button>
                      </div>
                      <div className="mt-3 space-y-2 max-h-[220px] overflow-auto">
                        {lowStockItems.map((item) => {
                          const supplier = getMatchingSuppliers(item.name)[0];
                          const pending = hasPendingOrderRequest(item.name, supplier?.name);
                          return (
                            <div key={item.id} className="rounded-lg border border-gemini-blue-500/25 bg-black/40 p-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm text-white font-medium">{item.name}</p>
                                <p className="text-xs text-gemini-blue-300">
                                  {item.qty <= 0 ? 'Out of stock' : `Stock ${item.qty}`} • {supplier ? `Supplier: ${supplier.name}` : 'No supplier mapped'}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="premium-button-ghost text-xs"
                                onClick={() => void createOrderRequestForItem(item)}
                                disabled={pending}
                              >
                                {pending ? 'Pending' : 'Create Request'}
                              </button>
                            </div>
                          );
                        })}
                        {lowStockItems.length === 0 && (
                          <p className="text-xs text-gemini-blue-300">No low stock products currently.</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[360px] overflow-auto">{suppliers.map((supplier) => <div key={supplier.id} className="border border-gemini-blue-500/25 rounded-xl p-3 bg-black/40 flex items-center justify-between"><div><p className="text-white font-medium">{supplier.name}</p><p className="text-xs text-gemini-blue-300">{supplier.phone} • {supplier.products || 'General'}</p></div><button className="premium-button-ghost text-red-300" onClick={() => removeSupplier(supplier.id)}><Trash2 className="h-4 w-4" /></button></div>)}</div>
                  </div>
                )}

                {activeSection === 'tasks' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-gemini-blue-300" />Tasks & Reminders</h2>
                    <form onSubmit={addTask} className="grid md:grid-cols-3 gap-3 mb-4"><input className="premium-input md:col-span-2" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} /><select className="premium-input" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as 'low' | 'medium' | 'high' })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select><input className="premium-input md:col-span-2" type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /><button className="premium-button-primary" type="submit">Add Task</button></form>
                    <div className="space-y-3 max-h-[360px] overflow-auto">{tasks.map((task) => <div key={task.id} className="border border-gemini-blue-500/25 rounded-xl p-3 bg-black/40 flex items-center justify-between"><div><p className={`font-medium ${task.done ? 'text-gemini-blue-400 line-through' : 'text-white'}`}>{task.title}</p><p className="text-xs text-gemini-blue-300">{task.priority.toUpperCase()} • Due {task.dueDate || 'NA'}</p></div><div className="flex gap-2"><button className="premium-button-ghost text-xs" onClick={() => toggleTask(task)}>{task.done ? 'Reopen' : 'Done'}</button><button className="premium-button-ghost text-red-300" onClick={() => removeTask(task.id)}><Trash2 className="h-4 w-4" /></button></div></div>)}</div>
                  </div>
                )}

                {activeSection === 'insights' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4">Business Insights</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-gemini-blue-500/30 bg-black/40 p-4"><p className="text-gemini-blue-300 text-sm">Net Health</p><p className="text-2xl font-bold text-white">₹{(todaySales - totalExpenses).toFixed(0)}</p></div>
                      <div className="rounded-xl border border-gemini-blue-500/30 bg-black/40 p-4"><p className="text-gemini-blue-300 text-sm">Invoices</p><p className="text-2xl font-bold text-white">{invoices.length}</p></div>
                      <div className="rounded-xl border border-gemini-blue-500/30 bg-black/40 p-4"><p className="text-gemini-blue-300 text-sm">Suppliers</p><p className="text-2xl font-bold text-white">{suppliers.length}</p></div>
                      <div className="rounded-xl border border-gemini-blue-500/30 bg-black/40 p-4"><p className="text-gemini-blue-300 text-sm">Pending Tasks</p><p className="text-2xl font-bold text-white">{pendingTasks}</p></div>
                    </div>
                  </div>
                )}

                {activeSection === 'backup' && (
                  <div className="premium-card neon-panel p-5">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5 text-gemini-blue-300" />
                      Export & Backup Center
                    </h2>
                    <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-gemini-blue-500/30 bg-black/30 p-2">
                      {backupSlideMeta.map((slide) => (
                        <button
                          key={slide.key}
                          type="button"
                          onClick={() => setBackupSlide(slide.key)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${backupSlide === slide.key ? 'border-gemini-blue-300/75 bg-gemini-blue-500/20 text-white' : 'border-gemini-blue-500/25 bg-black/35 text-gemini-blue-100 hover:bg-gemini-blue-500/10'}`}
                        >
                          {slide.label}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={backupSlide}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -18 }}
                        transition={{ type: 'spring', stiffness: 190, damping: 24 }}
                        className="rounded-2xl border border-gemini-blue-500/30 bg-black/30 p-4"
                      >
                        {backupSlide === 'export' && (
                          <>
                            <p className="text-gemini-blue-200 mb-4">
                              Download complete business data anytime. This includes products, customers, invoices, expenses, suppliers, and tasks.
                            </p>
                            <div className="grid md:grid-cols-2 gap-3">
                              <button type="button" className="premium-button-primary float-on-hover" onClick={() => downloadBackup('json')}>
                                Download Full Backup (JSON)
                              </button>
                              <button type="button" className="premium-button-ghost float-on-hover" onClick={() => downloadBackup('csv')}>
                                Download Report (CSV)
                              </button>
                            </div>
                          </>
                        )}

                        {backupSlide === 'restore' && (
                          <div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 p-4 space-y-3">
                            <p className="text-sm text-gemini-blue-100 font-medium">Restore from JSON Backup (Safe Mode)</p>
                            <input
                              type="file"
                              accept="application/json,.json"
                              className="premium-input"
                              onChange={handleBackupFileChange}
                            />

                            {backupPreview && (
                              <div className="rounded-xl border border-gemini-blue-500/30 bg-black/40 p-3 text-sm text-gemini-blue-100">
                                <p className="text-gemini-blue-200 mb-2">Preview from {backupFileName}</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  <div>Items: <span className="text-white font-semibold">{backupPreview.items}</span></div>
                                  <div>Customers: <span className="text-white font-semibold">{backupPreview.customers}</span></div>
                                  <div>Invoices: <span className="text-white font-semibold">{backupPreview.invoices}</span></div>
                                  <div>Expenses: <span className="text-white font-semibold">{backupPreview.expenses}</span></div>
                                  <div>Suppliers: <span className="text-white font-semibold">{backupPreview.suppliers}</span></div>
                                  <div>Tasks: <span className="text-white font-semibold">{backupPreview.tasks}</span></div>
                                </div>
                              </div>
                            )}

                            <label className="flex items-start gap-2 text-sm text-gemini-blue-100">
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={restoreConfirmed}
                                onChange={(e) => setRestoreConfirmed(e.target.checked)}
                              />
                              <span>I understand restore will overwrite current data files.</span>
                            </label>

                            <button
                              type="button"
                              className="premium-button-ghost float-on-hover"
                              onClick={restoreBackupFromJson}
                              disabled={!backupPayload || !restoreConfirmed || isRestoringBackup}
                            >
                              {isRestoringBackup ? 'Restoring...' : 'Restore from JSON Backup'}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    <div className="mt-5 rounded-xl border border-gemini-blue-500/30 bg-black/35 p-4 text-sm text-gemini-blue-100">
                      Recommended: keep daily JSON backups and weekly CSV reports for accounting.
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            </div>

            {isRightRailOpen && (
            <aside className="hidden xl:block space-y-4 relative" style={{ width: rightRailWidth }}>
              <div
                className={`absolute -left-2 top-8 bottom-8 w-1.5 rounded-full cursor-col-resize ${isRailResizing ? 'bg-gemini-blue-300' : 'bg-gemini-blue-500/30 hover:bg-gemini-blue-400/60'}`}
                onMouseDown={startRailResize}
                aria-label="Resize right rail"
                role="separator"
              />
              <div className="premium-card neon-panel p-4 sticky top-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-gemini-blue-300 mb-3">Live Intelligence</p>
                <div className="space-y-2">
                  <div className="rounded-lg border border-gemini-blue-500/30 bg-black/35 p-3">
                    <p className="text-xs text-gemini-blue-300">Active Section</p>
                    <p className="text-sm font-semibold text-white">{sectionMeta[activeSection].title}</p>
                  </div>
                  <div className="rounded-lg border border-gemini-blue-500/30 bg-black/35 p-3">
                    <p className="text-xs text-gemini-blue-300">Outstanding Tasks</p>
                    <p className="text-xl font-bold text-white">{pendingTasks}</p>
                  </div>
                  <div className="rounded-lg border border-gemini-blue-500/30 bg-black/35 p-3">
                    <p className="text-xs text-gemini-blue-300">Low Stock Alerts</p>
                    <p className="text-xl font-bold text-white">{lowStockCount}</p>
                  </div>
                  <div className="rounded-lg border border-gemini-blue-500/30 bg-black/35 p-3">
                    <p className="text-xs text-gemini-blue-300">Open Customer Dues</p>
                    <p className="text-xl font-bold text-white">₹{customers.reduce((sum, customer) => sum + Number(customer.balance || 0), 0).toFixed(0)}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gemini-blue-500/25 space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-gemini-blue-300">Quick Launch</p>
                  <button type="button" onClick={() => switchSection('billing')} className="premium-button-primary w-full text-xs">Open Billing Desk</button>
                  <button type="button" onClick={() => switchSection('tasks')} className="premium-button-ghost w-full text-xs">Open Task Planner</button>
                  <button type="button" onClick={() => loadAll()} className="premium-button-ghost w-full text-xs">Refresh All Data</button>
                </div>

                <div className="mt-4 pt-4 border-t border-gemini-blue-500/25 space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-gemini-blue-300">Pinned Modules</p>
                  {favoriteSections.length === 0 && <p className="text-xs text-gemini-blue-200">No pinned modules yet.</p>}
                  {favoriteSections.map((section) => (
                    <button key={section} type="button" onClick={() => switchSection(section)} className={`w-full text-left px-3 py-2 rounded-lg border text-xs ${activeSection === section ? sectionAccent[section].activeTab : 'border-gemini-blue-500/30 bg-black/35 text-gemini-blue-100'}`}>
                      {sectionMeta[section].title}
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gemini-blue-500/25 space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-gemini-blue-300">Recent Modules</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSections.map((section) => (
                      <button key={section} type="button" onClick={() => switchSection(section)} className="px-2 py-1 rounded-md border border-gemini-blue-500/30 text-xs text-gemini-blue-100 bg-black/35 hover:bg-gemini-blue-500/15">
                        {sectionMeta[section].chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-gemini-blue-500/30 bg-black/35 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-gemini-blue-300 mb-1">System Pulse</p>
                  <p className="text-xs text-gemini-blue-100">{allNavItems.length} modules connected • {invoices.length} invoices tracked • {items.length} products indexed</p>
                </div>
              </div>
            </aside>
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isUtilityDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/55"
            onClick={() => setIsUtilityDrawerOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 185, damping: 24, mass: 0.9 }}
              drag="y"
              dragDirectionLock
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.24 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 650) {
                  setIsUtilityDrawerOpen(false);
                }
              }}
              className="absolute bottom-0 left-0 right-0 premium-card neon-panel rounded-t-2xl border-b-0 p-4 md:p-5 max-h-[78vh] overflow-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-gemini-blue-300/60" />
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-sm uppercase tracking-[0.18em] text-gemini-blue-300">Utility Slidebar</p>
                <button type="button" className="premium-button-ghost px-2 py-1" onClick={() => setIsUtilityDrawerOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto mb-4">
                <button type="button" onClick={() => setUtilityTab('automation')} className={`px-3 py-2 rounded-lg border text-xs ${utilityTab === 'automation' ? 'border-gemini-blue-300/70 bg-gemini-blue-500/25 text-white' : 'border-gemini-blue-500/30 bg-black/35 text-gemini-blue-100'}`}>Automation</button>
                <button type="button" onClick={() => setUtilityTab('layout')} className={`px-3 py-2 rounded-lg border text-xs ${utilityTab === 'layout' ? 'border-gemini-blue-300/70 bg-gemini-blue-500/25 text-white' : 'border-gemini-blue-500/30 bg-black/35 text-gemini-blue-100'}`}>Layout Controls</button>
                <button type="button" onClick={() => setUtilityTab('shortcuts')} className={`px-3 py-2 rounded-lg border text-xs ${utilityTab === 'shortcuts' ? 'border-gemini-blue-300/70 bg-gemini-blue-500/25 text-white' : 'border-gemini-blue-500/30 bg-black/35 text-gemini-blue-100'}`}>Shortcuts</button>
              </div>

              {utilityTab === 'automation' && (
                <div className="grid md:grid-cols-3 gap-3">
                  <button type="button" onClick={() => switchSection('billing')} className="premium-button-primary w-full">Start Billing Flow</button>
                  <button type="button" onClick={() => switchSection('stock')} className="premium-button-ghost w-full">Open Stock Monitor</button>
                  <button type="button" onClick={() => switchSection('backup')} className="premium-button-ghost w-full">Run Backup Review</button>
                  <button type="button" onClick={() => switchSection('tasks')} className="premium-button-ghost w-full">Open Task Queue</button>
                  <button type="button" onClick={() => switchSection('marketing')} className="premium-button-ghost w-full">Launch Marketing Studio</button>
                  <button type="button" onClick={() => loadAll()} className="premium-button-ghost w-full">Refresh Workspace</button>
                </div>
              )}

              {utilityTab === 'layout' && (
                <div className="grid md:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setIsSidebarCollapsed((previous) => !previous)} className="premium-button-ghost w-full">{isSidebarCollapsed ? 'Expand Left Sidebar' : 'Collapse Left Sidebar'}</button>
                  <button type="button" onClick={() => setIsRightRailOpen((previous) => !previous)} className="premium-button-ghost w-full">{isRightRailOpen ? 'Hide Right Intelligence Rail' : 'Show Right Intelligence Rail'}</button>
                  <button type="button" onClick={() => setLayoutMode('standard')} className="premium-button-ghost w-full">Apply Standard Mode</button>
                  <button type="button" onClick={() => setLayoutMode('focus')} className="premium-button-ghost w-full">Apply Focus Mode</button>
                  <button type="button" onClick={() => setLayoutMode('analytics')} className="premium-button-ghost w-full">Apply Analytics Mode</button>
                  <button type="button" onClick={() => setIsCommandPaletteOpen(true)} className="premium-button-ghost w-full">Open Command Palette</button>
                </div>
              )}

              {utilityTab === 'shortcuts' && (
                <div className="rounded-xl border border-gemini-blue-500/30 bg-black/35 p-4">
                  <p className="text-xs text-gemini-blue-300 mb-3 uppercase tracking-[0.16em]">Keyboard Map</p>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-gemini-blue-100">
                    <p><strong>Ctrl/Cmd + K</strong> → Command Palette</p>
                    <p><strong>Ctrl/Cmd + J</strong> → Utility Slidebar</p>
                    <p><strong>Ctrl/Cmd + .</strong> → Toggle Right Rail</p>
                    <p><strong>/</strong> → Focus command search</p>
                    <p><strong>B/M/P/T</strong> → Quick section jump</p>
                    <p><strong>Shift + F</strong> → Pin active section</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCommandPaletteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 md:p-10"
            onClick={() => setIsCommandPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="mx-auto max-w-2xl premium-card neon-panel p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm uppercase tracking-[0.18em] text-gemini-blue-300">Command Palette</p>
                <button type="button" className="premium-button-ghost px-2 py-1" onClick={() => setIsCommandPaletteOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative mb-3">
                <Search className="w-4 h-4 text-gemini-blue-300 absolute left-3 top-3.5" />
                <input
                  ref={paletteSearchRef}
                  className="premium-input pl-9"
                  placeholder="Type section name..."
                  value={paletteQuery}
                  onChange={(event) => setPaletteQuery(event.target.value)}
                />
              </div>

              <div className="max-h-[52vh] overflow-auto space-y-2 pr-1">
                {filteredPaletteItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      switchSection(item.key);
                      setIsCommandPaletteOpen(false);
                    }}
                    className={`w-full text-left rounded-xl border px-3 py-3 flex items-center gap-3 transition-all ${activeSection === item.key ? sectionAccent[item.key].activeButton : 'border-gemini-blue-500/25 bg-black/35 hover:bg-gemini-blue-500/10 text-gemini-blue-100'}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-gemini-blue-300">{sectionMeta[item.key].description}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-gemini-blue-500/35 text-gemini-blue-200">
                      {favoriteSections.includes(item.key) ? 'Pinned' : 'Not pinned'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-gemini-blue-500/35 text-gemini-blue-200">{getSectionBadge(item.key)}</span>
                  </button>
                ))}
                {filteredPaletteItems.length === 0 && (
                  <div className="rounded-xl border border-gemini-blue-500/25 bg-black/35 p-4 text-sm text-gemini-blue-200">No matching module found.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
