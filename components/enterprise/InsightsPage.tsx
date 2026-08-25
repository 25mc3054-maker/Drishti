"use client";

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ReceiptText,
  Users,
  ShoppingBag,
  Clock,
  RefreshCw,
  BellRing,
  Send,
  BarChart3,
  Layers,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { ContactActionGroup, WebCallModal, type CallRecipient } from './WebCallModal';
import type { DashboardData } from './types';
import { formatDate, formatMoney } from './utils';

interface InsightsPageProps {
  data: DashboardData;
  onDataRefresh?: () => Promise<void>;
  theme?: 'dark' | 'light';
}

type TimePeriod = 'today' | 'last10days' | 'last30days' | 'last12months' | 'lastyears';
type ChartMetric = 'revenue' | 'invoices' | 'collected';

type ReminderDue = {
  invoiceId: string;
  customer: any | null;
  total: number;
  createdAt: string;
  lastCreditReminderAt: string | null;
  phone: string;
  message: string;
  whatsappUrl: string;
};

// Vibrant, distinct colors exclusively for the bar graph pillars
const VIBRANT_BAR_COLORS = [
  '#3B82F6', // Royal Blue
  '#10B981', // Emerald Green
  '#F59E0B', // Amber Gold
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#E11D48', // Rose
  '#0EA5E9', // Sky Blue
];

function paymentMethod(invoice: any) {
  return String(invoice.paymentMethod || 'cash').toLowerCase();
}

function customerKey(invoice: any, index: number) {
  const customer = invoice.customer || {};
  return String(customer.id || customer.phone || `walk-in-${index}`);
}

function uniqueCustomersForMethod(invoices: any[], method: string) {
  return new Set(
    invoices
      .filter((invoice) => paymentMethod(invoice) === method)
      .map((invoice, index) => customerKey(invoice, index))
  ).size;
}

function isOpenCreditInvoice(invoice: any) {
  return paymentMethod(invoice) === 'credit' && !invoice.creditClearedAt && invoice.status !== 'paid';
}

export function InsightsPage({ data, onDataRefresh, theme = 'dark' }: InsightsPageProps) {
  const isLight = theme === 'light';
  const [mounted, setMounted] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last10days');
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('revenue');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [showFormulaGuide, setShowFormulaGuide] = useState(false);

  // Credit reminders state
  const [dueReminders, setDueReminders] = useState<ReminderDue[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);
  const [activeCallRecipient, setActiveCallRecipient] = useState<CallRecipient | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const invoices = useMemo(() => data.invoices || [], [data.invoices]);
  const items = useMemo(() => data.items || [], [data.items]);
  const customers = useMemo(() => data.customers || [], [data.customers]);

  // 100% Real Summary Metrics Computed Directly from Database
  const summary = useMemo(() => {
    const grossRevenue = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
    const collectedRevenue = invoices
      .filter((inv: any) => paymentMethod(inv) !== 'credit' || inv.status === 'paid' || inv.creditClearedAt)
      .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
    const creditOutstanding = invoices
      .filter(isOpenCreditInvoice)
      .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
    const stockValueSold = invoices.reduce((sum: number, inv: any) => (
      sum + (inv.items || []).reduce((itemSum: number, it: any) => itemSum + Number(it.lineTotal || Number(it.price || 0) * Number(it.qty || 0)), 0)
    ), 0);
    const stockValueRemaining = items.reduce((sum: number, it: any) => sum + Number(it.price || 0) * Number(it.qty || 0), 0);
    const totalInvoices = invoices.length;
    const avgBillValue = totalInvoices > 0 ? Math.round(grossRevenue / totalInvoices) : 0;
    const collectionRate = grossRevenue > 0 ? Math.round((collectedRevenue / grossRevenue) * 100) : 100;

    // Real Month-over-Month calculation
    const now = new Date();
    const thisMonthInvoices = invoices.filter((inv: any) => {
      const d = new Date(inv.createdAt || inv.date || now);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonthInvoices = invoices.filter((inv: any) => {
      const d = new Date(inv.createdAt || inv.date || now);
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const thisMonthRev = thisMonthInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const lastMonthRev = lastMonthInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
    let momGrowthText = '0% growth';
    if (lastMonthRev > 0) {
      const mom = Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);
      momGrowthText = `${mom >= 0 ? '+' : ''}${mom}% vs last month`;
    } else if (thisMonthRev > 0) {
      momGrowthText = `₹${formatMoney(thisMonthRev)} this month`;
    }

    const paymentTotals = ['cash', 'upi', 'card', 'credit'].reduce<Record<string, number>>((acc, method) => {
      acc[method] = invoices
        .filter((inv: any) => paymentMethod(inv) === method)
        .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
      return acc;
    }, {});

    return {
      grossRevenue,
      collectedRevenue,
      creditOutstanding,
      stockValueSold,
      stockValueRemaining,
      totalInvoices,
      totalCustomers: customers.length,
      avgBillValue,
      collectionRate,
      momGrowthText,
      paymentTotals,
      cashCustomers: uniqueCustomersForMethod(invoices, 'cash'),
      upiCustomers: uniqueCustomersForMethod(invoices, 'upi'),
      cardCustomers: uniqueCustomersForMethod(invoices, 'card'),
      creditCustomers: uniqueCustomersForMethod(invoices.filter(isOpenCreditInvoice), 'credit'),
    };
  }, [invoices, items, customers]);

  // Aggregate Real chart data strictly matching actual invoices
  const chartData = useMemo(() => {
    const now = new Date();

    if (timePeriod === 'today') {
      const hours = [
        '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM'
      ];
      return hours.map((hourLabel, index) => {
        const hourNum = 8 + index;
        const matchingInvoices = invoices.filter((inv: any) => {
          if (!inv.createdAt && !inv.date) return false;
          const invDate = new Date(inv.createdAt || inv.date);
          const isSameDay = invDate.getDate() === now.getDate() &&
                            invDate.getMonth() === now.getMonth() &&
                            invDate.getFullYear() === now.getFullYear();
          return isSameDay && invDate.getHours() === hourNum;
        });

        const rev = matchingInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0);
        const collected = matchingInvoices
          .filter((inv: any) => paymentMethod(inv) !== 'credit' || inv.status === 'paid' || inv.creditClearedAt)
          .reduce((s, inv) => s + Number(inv.total || 0), 0);

        return {
          label: hourLabel,
          shortLabel: hourLabel,
          revenue: rev,
          collected: collected,
          invoices: matchingInvoices.length,
          color: VIBRANT_BAR_COLORS[index % VIBRANT_BAR_COLORS.length],
        };
      });
    }

    if (timePeriod === 'last10days') {
      const days = [];
      for (let i = 9; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });

        const matchingInvoices = invoices.filter((inv: any) => {
          if (!inv.createdAt && !inv.date) return false;
          const invDate = new Date(inv.createdAt || inv.date);
          return invDate.getDate() === d.getDate() &&
                 invDate.getMonth() === d.getMonth() &&
                 invDate.getFullYear() === d.getFullYear();
        });

        const rev = matchingInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0);
        const collected = matchingInvoices
          .filter((inv: any) => paymentMethod(inv) !== 'credit' || inv.status === 'paid' || inv.creditClearedAt)
          .reduce((s, inv) => s + Number(inv.total || 0), 0);

        days.push({
          label: `${dateStr} (${dayName})`,
          shortLabel: dateStr,
          revenue: rev,
          collected: collected,
          invoices: matchingInvoices.length,
          color: VIBRANT_BAR_COLORS[(9 - i) % VIBRANT_BAR_COLORS.length],
        });
      }
      return days;
    }

    if (timePeriod === 'last30days') {
      const intervals = [
        'Days 1-5', 'Days 6-10', 'Days 11-15', 'Days 16-20', 'Days 21-25', 'Days 26-30'
      ];
      return intervals.map((intLabel, idx) => {
        const matchingInvoices = invoices.filter((inv: any) => {
          if (!inv.createdAt && !inv.date) return false;
          const invDate = new Date(inv.createdAt || inv.date);
          const diffDays = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= (5 - idx) * 5 && diffDays < (6 - idx) * 5;
        });

        const rev = matchingInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0);
        const collected = matchingInvoices
          .filter((inv: any) => paymentMethod(inv) !== 'credit' || inv.status === 'paid' || inv.creditClearedAt)
          .reduce((s, inv) => s + Number(inv.total || 0), 0);

        return {
          label: intLabel,
          shortLabel: intLabel,
          revenue: rev,
          collected: collected,
          invoices: matchingInvoices.length,
          color: VIBRANT_BAR_COLORS[idx % VIBRANT_BAR_COLORS.length],
        };
      });
    }

    if (timePeriod === 'last12months') {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const currentMonth = now.getMonth();
      const orderedMonths = [];

      for (let i = 11; i >= 0; i--) {
        const monthIdx = (currentMonth - i + 12) % 12;
        const monthName = months[monthIdx];
        const targetYear = now.getFullYear() - (currentMonth - i < 0 ? 1 : 0);

        const matchingInvoices = invoices.filter((inv: any) => {
          if (!inv.createdAt && !inv.date) return false;
          const invDate = new Date(inv.createdAt || inv.date);
          return invDate.getMonth() === monthIdx && invDate.getFullYear() === targetYear;
        });

        const rev = matchingInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0);
        const collected = matchingInvoices
          .filter((inv: any) => paymentMethod(inv) !== 'credit' || inv.status === 'paid' || inv.creditClearedAt)
          .reduce((s, inv) => s + Number(inv.total || 0), 0);

        orderedMonths.push({
          label: `${monthName} ${targetYear}`,
          shortLabel: monthName,
          revenue: rev,
          collected: collected,
          invoices: matchingInvoices.length,
          color: VIBRANT_BAR_COLORS[(11 - i) % VIBRANT_BAR_COLORS.length],
        });
      }
      return orderedMonths;
    }

    if (timePeriod === 'lastyears') {
      const currentYear = now.getFullYear();
      const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

      return years.map((yr, index) => {
        const matchingInvoices = invoices.filter((inv: any) => {
          if (!inv.createdAt && !inv.date) return false;
          const invDate = new Date(inv.createdAt || inv.date);
          return invDate.getFullYear() === yr;
        });

        const rev = matchingInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0);
        const collected = matchingInvoices
          .filter((inv: any) => paymentMethod(inv) !== 'credit' || inv.status === 'paid' || inv.creditClearedAt)
          .reduce((s, inv) => s + Number(inv.total || 0), 0);

        return {
          label: `Year ${yr}`,
          shortLabel: `${yr}`,
          revenue: rev,
          collected: collected,
          invoices: matchingInvoices.length,
          color: VIBRANT_BAR_COLORS[index % VIBRANT_BAR_COLORS.length],
        };
      });
    }

    return [];
  }, [timePeriod, invoices]);

  // Calculate Real Growth & Downfall statistics
  const periodStats = useMemo(() => {
    const totalPeriodRevenue = chartData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const totalPeriodBills = chartData.reduce((acc, curr) => acc + (curr.invoices || 0), 0);
    const totalPeriodCollected = chartData.reduce((acc, curr) => acc + (curr.collected || 0), 0);
    const maxBar = chartData.find((item) => item.revenue > 0)
      ? chartData.reduce((max, item) => (item.revenue > (max?.revenue || 0) ? item : max), chartData[0])
      : null;

    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
    const firstRev = firstHalf.reduce((s, i) => s + i.revenue, 0);
    const secondRev = secondHalf.reduce((s, i) => s + i.revenue, 0);

    let growthPct = 0;
    let hasComparison = false;

    if (firstRev > 0 && secondRev > 0) {
      growthPct = Math.round(((secondRev - firstRev) / firstRev) * 100);
      hasComparison = true;
    } else if (firstRev === 0 && secondRev > 0) {
      growthPct = 100;
      hasComparison = true;
    } else if (firstRev > 0 && secondRev === 0) {
      growthPct = -100;
      hasComparison = true;
    }

    const isGrowing = growthPct >= 0;

    return {
      totalPeriodRevenue,
      totalPeriodBills,
      totalPeriodCollected,
      maxBar,
      growthPct,
      hasComparison,
      isGrowing,
    };
  }, [chartData]);

  // Real Category breakdown from actual invoices
  const categorySales = useMemo(() => {
    const map = new Map<string, { revenue: number; itemsSold: number }>();
    invoices.forEach((inv: any) => {
      (inv.items || []).forEach((it: any) => {
        const cat = it.category || 'General';
        const curr = map.get(cat) || { revenue: 0, itemsSold: 0 };
        curr.revenue += Number(it.lineTotal || (Number(it.price || 0) * Number(it.qty || 0)));
        curr.itemsSold += Number(it.qty || 1);
        map.set(cat, curr);
      });
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        itemsSold: data.itemsSold,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [invoices]);

  const loadDueReminders = async () => {
    setIsLoadingReminders(true);
    try {
      const response = await fetch('/api/saas/credit-reminders');
      const payload = await response.json();
      if (payload.dueReminders) setDueReminders(payload.dueReminders || []);
    } catch {
      // fallback
    } finally {
      setIsLoadingReminders(false);
    }
  };

  const sendReminder = async (invoiceId: string, recordManualSend = false) => {
    try {
      await fetch('/api/saas/credit-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'touch', invoiceId, recordManualSend }),
      });
      await loadDueReminders();
    } catch {}
  };

  // Custom Chart Tooltip in sharp, clear monochrome
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className={`rounded-sm border p-4 shadow-xl backdrop-blur-md text-xs font-semibold ${
          isLight ? 'border-zinc-300 bg-white/95 text-black shadow-zinc-400/20' : 'border-zinc-700 bg-zinc-950/95 text-white shadow-black/80'
        }`}>
          <p className={`font-bold text-[14px] mb-2 flex items-center gap-2 border-b pb-1.5 ${
            isLight ? 'text-black border-zinc-200' : 'text-white border-zinc-800'
          }`}>
            <Calendar className="h-4 w-4" />
            {dataPoint.label || label}
          </p>
          <div className="space-y-1.5 min-w-[170px]">
            <div className="flex items-center justify-between gap-4">
              <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Gross Revenue:</span>
              <span className={`font-black text-[14px] ${isLight ? 'text-black' : 'text-white'}`}>₹{formatMoney(dataPoint.revenue)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Collected Cash:</span>
              <span className={`font-bold text-[13px] ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>₹{formatMoney(dataPoint.collected)}</span>
            </div>
            <div className={`flex items-center justify-between gap-4 border-t pt-1.5 mt-1 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
              <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Bills Created:</span>
              <span className="font-extrabold text-[13px]">{dataPoint.invoices} bills</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className={`space-y-6 rounded-sm p-4 sm:p-6 transition-colors border-0 ${
      isLight ? 'bg-white text-black' : 'bg-black text-white'
    }`}>
      {/* Header with Title and Explanation Button */}
      <div className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b pb-5 ${
        isLight ? 'border-zinc-200' : 'border-zinc-800'
      }`}>
        <div className="space-y-1">
          <div className={`text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <BarChart3 className="h-4 w-4" />
            Store Insights & Growth Analytics
          </div>
          <h1 className={`text-[28px] font-black tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
            Business Revenue & Growth Reports
          </h1>
          <p className={`max-w-3xl text-[14px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Clear, honest metrics and colorful bar graphs computed strictly from your store's live bills and receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowFormulaGuide((prev) => !prev)}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-sm border px-4 text-[13px] font-bold transition shadow-2xs ${
              showFormulaGuide
                ? (isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white')
                : (isLight ? 'bg-zinc-100 text-black border-zinc-300 hover:bg-zinc-200' : 'bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800')
            }`}
          >
            <Calculator className="h-4 w-4" />
            {showFormulaGuide ? 'Hide Calculation Rules' : 'Show How Numbers Are Calculated'}
          </button>
          <button
            type="button"
            onClick={() => { void loadDueReminders(); }}
            disabled={isLoadingReminders}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-sm border px-4 text-[13px] font-bold transition disabled:opacity-50 shadow-2xs ${
              isLight
                ? 'bg-zinc-100 text-black border-zinc-300 hover:bg-zinc-200'
                : 'bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingReminders ? 'animate-spin' : ''}`} />
            Check Credit Dues
          </button>
        </div>
      </div>

      {/* Simple Calculation Formula Guide */}
      {showFormulaGuide && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`p-5 rounded-sm border space-y-3 ${
            isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-800 text-white'
          }`}
        >
          <div className="flex items-center gap-2 font-black text-sm">
            <Calculator className="h-4 w-4" />
            <span>Plain & Simple Calculation Guide for Shopkeepers</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs font-medium">
            <div className={`p-3 rounded-sm border ${isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-800'}`}>
              <div className="font-bold mb-1">💰 Total Gross Revenue</div>
              <div className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Sum of all invoices generated on your billing counter.</div>
            </div>
            <div className={`p-3 rounded-sm border ${isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-800'}`}>
              <div className="font-bold mb-1">💵 Collected Cash / UPI</div>
              <div className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Actual paid money received in Cash, UPI QR scans, or Card swipes.</div>
            </div>
            <div className={`p-3 rounded-sm border ${isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-800'}`}>
              <div className="font-bold mb-1">⏳ Khata (Credit Due)</div>
              <div className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Gross Revenue minus Collected Cash = Unpaid customer balances.</div>
            </div>
            <div className={`p-3 rounded-sm border ${isLight ? 'bg-white border-zinc-200' : 'bg-black border-zinc-800'}`}>
              <div className="font-bold mb-1">🧾 Average Bill Value</div>
              <div className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>Total Gross Revenue ÷ Total Number of Bills Created.</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4 Primary Executive Metric Cards - Large & Comfortable */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SharpMetricCard
          isLight={isLight}
          icon={DollarSign}
          index={0}
          label="Total Gross Revenue"
          value={`₹${formatMoney(summary.grossRevenue)}`}
          helper="Total invoice billing volume"
          growthBadge={summary.momGrowthText}
        />
        <SharpMetricCard
          isLight={isLight}
          icon={Coins}
          index={1}
          label="Collected Liquid Cash"
          value={`₹${formatMoney(summary.collectedRevenue)}`}
          helper="Received in Cash, UPI & Card"
          growthBadge={`${summary.collectionRate}% Collection Rate`}
        />
        <SharpMetricCard
          isLight={isLight}
          icon={ReceiptText}
          index={2}
          label="Credit Outstanding (Khata)"
          value={`₹${formatMoney(summary.creditOutstanding)}`}
          helper="Open unpaid customer balances"
          growthBadge={summary.creditCustomers > 0 ? `${summary.creditCustomers} open khata accounts` : "0 credit due"}
        />
        <SharpMetricCard
          isLight={isLight}
          icon={ShoppingBag}
          index={3}
          label="Total Invoices Created"
          value={String(summary.totalInvoices)}
          helper={summary.totalInvoices > 0 ? `Avg ticket: ₹${formatMoney(summary.avgBillValue)}` : '0 bills registered'}
          growthBadge={`${summary.totalCustomers} customer profiles`}
        />
      </div>

      {/* Main Bar Chart & Sales Momentum Command Center */}
      <div className={`rounded-sm border p-5 sm:p-6 relative transition-all shadow-xs ${
        isLight ? 'border-zinc-200 bg-zinc-50/90 text-black' : 'border-zinc-800 bg-[#090b0e] text-white'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b pb-5 border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-extrabold border ${
                isLight
                  ? 'bg-zinc-200 text-black border-zinc-300'
                  : 'bg-zinc-900 text-white border-zinc-700'
              }`}>
                {periodStats.hasComparison ? (
                  <>
                    {periodStats.isGrowing ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {periodStats.isGrowing ? `Growth: +${periodStats.growthPct}% Upward Momentum` : `Downfall: ${periodStats.growthPct}% Shift`}
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Real-Time Store Data</span>
                  </>
                )}
              </span>
              <span className={`text-xs font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {periodStats.totalPeriodBills} bills created in selected period
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black">
              ₹{formatMoney(periodStats.totalPeriodRevenue)}{' '}
              <span className={`text-sm font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Revenue across {periodStats.totalPeriodBills} customer bills
              </span>
            </h2>
            <p className={`text-xs sm:text-[13px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {periodStats.maxBar ? (
                <>
                  🔥 <strong>Peak Selling Period:</strong> {periodStats.maxBar.label} (₹{formatMoney(periodStats.maxBar.revenue)} recorded across {periodStats.maxBar.invoices} bills).
                </>
              ) : (
                'No sales transactions found in this period. Create new bills in the Billing tab to see live analytics.'
              )}
            </p>
          </div>

          {/* Time Period Selector - Sharp Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <div className={`p-1 rounded-sm border flex items-center gap-1 flex-wrap ${
              isLight ? 'bg-white border-zinc-300' : 'bg-black border-zinc-800'
            }`}>
              {[
                { id: 'today', label: 'Day-Wise (Today)' },
                { id: 'last10days', label: 'Last 10 Days' },
                { id: 'last30days', label: 'Last 30 Days' },
                { id: 'last12months', label: 'Last 12 Months' },
                { id: 'lastyears', label: 'Last Years' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimePeriod(tab.id as TimePeriod)}
                  className={`px-3.5 py-2 rounded-sm text-xs font-extrabold transition ${
                    timePeriod === tab.id
                      ? (isLight ? 'bg-black text-white shadow-xs' : 'bg-white text-black shadow-xs')
                      : (isLight ? 'text-zinc-600 hover:text-black hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-zinc-900')
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metric Toggle Buttons */}
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Graph Metric:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'revenue', label: '💰 Total Revenue (₹)' },
                { id: 'collected', label: '💵 Collected Cash / UPI (₹)' },
                { id: 'invoices', label: '🧾 Bills Count' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMetric(m.id as ChartMetric)}
                  className={`px-3.5 py-1.5 rounded-sm text-xs font-bold border transition ${
                    activeMetric === m.id
                      ? (isLight ? 'bg-black text-white border-black shadow-xs' : 'bg-white text-black border-white shadow-xs')
                      : (isLight ? 'border-zinc-300 text-zinc-600 hover:bg-zinc-100' : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900')
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sharp Tall Colourful Bar Graph */}
        <div className="mt-6 h-[360px] sm:h-[420px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke={isLight ? '#E4E4E7' : '#22242A'}
                  vertical={false}
                />
                <XAxis
                  dataKey="shortLabel"
                  stroke={isLight ? '#71717A' : '#71717A'}
                  fontSize={12}
                  fontWeight={700}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke={isLight ? '#71717A' : '#71717A'}
                  fontSize={12}
                  fontWeight={700}
                  tickLine={false}
                  tickFormatter={(val) => (activeMetric === 'invoices' ? val : `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)' }} />
                <Bar
                  dataKey={activeMetric}
                  radius={[0, 0, 0, 0]}
                  animationDuration={600}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || VIBRANT_BAR_COLORS[index % VIBRANT_BAR_COLORS.length]}
                      opacity={hoveredBarIndex === null || hoveredBarIndex === index ? 1 : 0.45}
                      onMouseEnter={() => setHoveredBarIndex(index)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold opacity-50">
              Loading interactive charts...
            </div>
          )}
        </div>

        {/* Spacious, Normal-Sized Data Summary Grid */}
        <div className={`mt-6 pt-5 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
          <div className="flex items-center justify-between mb-3.5">
            <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              📊 Detailed Breakdown per Slot ({timePeriod.toUpperCase()})
            </div>
            <div className={`text-xs font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Total Revenue: <strong>₹{formatMoney(periodStats.totalPeriodRevenue)}</strong> | Total Bills: <strong>{periodStats.totalPeriodBills}</strong>
            </div>
          </div>

          {/* Normal, Big, Spacious Grid (5-columns for 10 days = 2 neat rows) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {chartData.map((item, i) => (
              <div
                key={i}
                className={`p-4 rounded-sm border transition-all ${
                  isLight
                    ? 'border-zinc-300 bg-white text-black shadow-xs hover:border-black'
                    : 'border-zinc-800 bg-black text-white hover:border-zinc-600'
                }`}
              >
                {/* Header with Color Dot and Date */}
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-900">
                  <div className="w-2.5 h-2.5 rounded-none shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[13px] font-black truncate">{item.label || item.shortLabel}</span>
                </div>

                {/* Revenue Value */}
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold opacity-70">Total Revenue</div>
                  <div className={`text-xl font-black ${isLight ? 'text-black' : 'text-white'}`}>
                    ₹{formatMoney(item.revenue)}
                  </div>
                </div>

                {/* Collected & Bills Stats */}
                <div className={`mt-2.5 pt-2 border-t text-xs flex items-center justify-between font-medium ${
                  isLight ? 'border-zinc-200 text-zinc-600' : 'border-zinc-800 text-zinc-400'
                }`}>
                  <span>{item.invoices} bills created</span>
                  <span className="font-bold">Collected: ₹{formatMoney(item.collected)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Row: Category Volume & Settlement Modes */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Category Revenue Contribution */}
        <div className={`rounded-sm border p-5 sm:p-6 transition-all shadow-xs ${
          isLight ? 'border-zinc-200 bg-zinc-50/80 text-black' : 'border-zinc-800 bg-[#090b0e] text-white'
        }`}>
          <div className={`flex items-center justify-between gap-3 border-b pb-3 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <div className={`flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <Layers className="h-4 w-4" />
              Category Revenue Contribution
            </div>
            <span className={`text-xs font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {categorySales.length} Categories
            </span>
          </div>

          <div className="mt-4 space-y-3.5">
            {categorySales.length > 0 ? (
              categorySales.map((cat, idx) => {
                const pct = summary.grossRevenue > 0 ? Math.round((cat.revenue / summary.grossRevenue) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[13px]">{cat.name}</span>
                      <span className="flex items-center gap-3">
                        <span className="opacity-70 text-xs">{cat.itemsSold} items sold</span>
                        <strong className="text-[14px]">₹{formatMoney(cat.revenue)} ({pct}%)</strong>
                      </span>
                    </div>
                    {/* Sharp rectangular contribution bar */}
                    <div className={`h-2 w-full rounded-none overflow-hidden ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 3)}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.08 }}
                        className={`h-full rounded-none ${isLight ? 'bg-black' : 'bg-white'}`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`p-6 text-center text-xs font-medium rounded-sm border ${
                isLight ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-black border-zinc-800 text-zinc-400'
              }`}>
                No category sales recorded yet. Items sold via Billing will appear here automatically.
              </div>
            )}
          </div>
        </div>

        {/* Settlement by Payment Mode */}
        <div className={`rounded-sm border p-5 sm:p-6 transition-all shadow-xs ${
          isLight ? 'border-zinc-200 bg-zinc-50/80 text-black' : 'border-zinc-800 bg-[#090b0e] text-white'
        }`}>
          <div className={`flex items-center justify-between gap-3 border-b pb-3 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
            <div className={`flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <Wallet className="h-4 w-4" />
              Settlement by Payment Mode
            </div>
            <span className={`text-xs font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {summary.totalInvoices} Total Bills
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className={`p-4 rounded-sm border ${isLight ? 'bg-white border-zinc-200 text-black' : 'bg-black border-zinc-800 text-white'}`}>
              <div className={`flex items-center justify-between text-xs font-bold mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                <span>Cash Payments</span>
                <span>{summary.cashCustomers} Customers</span>
              </div>
              <div className="text-xl font-black">₹{formatMoney(summary.paymentTotals.cash || 0)}</div>
              <p className={`text-[11px] mt-1 font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Direct cash billing</p>
            </div>

            <div className={`p-4 rounded-sm border ${isLight ? 'bg-white border-zinc-200 text-black' : 'bg-black border-zinc-800 text-white'}`}>
              <div className={`flex items-center justify-between text-xs font-bold mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                <span>UPI / QR Code</span>
                <span>{summary.upiCustomers} Customers</span>
              </div>
              <div className="text-xl font-black">₹{formatMoney(summary.paymentTotals.upi || 0)}</div>
              <p className={`text-[11px] mt-1 font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Instant digital transfer</p>
            </div>

            <div className={`p-4 rounded-sm border ${isLight ? 'bg-white border-zinc-200 text-black' : 'bg-black border-zinc-800 text-white'}`}>
              <div className={`flex items-center justify-between text-xs font-bold mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                <span>Card Swipes</span>
                <span>{summary.cardCustomers} Customers</span>
              </div>
              <div className="text-xl font-black">₹{formatMoney(summary.paymentTotals.card || 0)}</div>
              <p className={`text-[11px] mt-1 font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Debit & credit cards</p>
            </div>

            <div className={`p-4 rounded-sm border ${isLight ? 'bg-white border-zinc-200 text-black' : 'bg-black border-zinc-800 text-white'}`}>
              <div className={`flex items-center justify-between text-xs font-bold mb-1 ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                <span>Credit / Khata</span>
                <span>{summary.creditCustomers} Customers</span>
              </div>
              <div className="text-xl font-black">₹{formatMoney(summary.paymentTotals.credit || 0)}</div>
              <p className={`text-[11px] mt-1 font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Pending settlement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Due Credit Reminders - Sharp Action Center */}
      <div className={`rounded-sm border p-5 sm:p-6 transition-all shadow-xs ${
        isLight ? 'border-zinc-200 bg-zinc-50/80 text-black' : 'border-zinc-800 bg-[#090b0e] text-white'
      }`}>
        <div className={`flex items-center justify-between gap-3 border-b pb-3 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
          <div>
            <div className={`flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              <BellRing className="h-4 w-4" />
              Due Credit Reminders (Khata Follow-ups)
            </div>
            <div className={`text-[13px] font-medium mt-0.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Dispatch instant WhatsApp and call reminders to recover pending customer dues.
            </div>
          </div>
          <span className={`rounded-sm border px-3.5 py-1 text-xs font-extrabold ${
            isLight ? 'bg-zinc-200 text-zinc-800 border-zinc-300' : 'bg-zinc-900 text-zinc-200 border-zinc-700'
          }`}>
            {dueReminders.length} Dues Open
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {dueReminders.map((reminder) => (
            <div
              key={reminder.invoiceId}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-sm border p-4 transition-all ${
                isLight ? 'border-zinc-200 bg-white text-black' : 'border-zinc-800 bg-black text-white'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[14px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                    {reminder.customer?.name || reminder.phone || 'Walk-in Customer'}
                  </span>
                  <span className={`rounded-sm border px-1.5 py-0.5 text-[10.5px] font-bold ${
                    isLight ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-800 bg-zinc-900 text-white'
                  }`}>
                    INV-{String(reminder.invoiceId).slice(0, 6)}
                  </span>
                  {(reminder.customer?.phone || reminder.phone) && (
                    <ContactActionGroup
                      phone={reminder.customer?.phone || reminder.phone}
                      name={reminder.customer?.name || 'Customer'}
                      role="Customer"
                      onOpenCallModal={(rec) => {
                        setActiveCallRecipient(rec);
                        setIsCallModalOpen(true);
                      }}
                      isLight={isLight}
                    />
                  )}
                </div>
                <div className={`mt-1 text-[12px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Due Amount: <strong className="text-black dark:text-white font-black">₹{formatMoney(Number(reminder.total || 0))}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { void sendReminder(reminder.invoiceId, true); }}
                className={`inline-flex items-center gap-1.5 rounded-sm border px-4 py-2 text-[12px] font-extrabold transition shadow-2xs ${
                  isLight
                    ? 'border-black bg-black text-white hover:bg-zinc-800'
                    : 'border-white bg-white text-black hover:bg-zinc-200'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send WhatsApp Reminder</span>
              </button>
            </div>
          ))}

          {dueReminders.length === 0 ? (
            <div className={`rounded-sm border p-6 text-center text-[13px] font-medium ${
              isLight ? 'border-zinc-200 bg-white text-zinc-500' : 'border-zinc-800 bg-black text-zinc-400'
            }`}>
              All customer credit accounts are settled. No follow-up reminders pending.
            </div>
          ) : null}
        </div>
      </div>

      <WebCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        recipient={activeCallRecipient}
        theme={theme}
      />
    </section>
  );
}

function SharpMetricCard({
  helper,
  icon: Icon,
  index,
  isLight,
  label,
  value,
  growthBadge,
}: {
  helper: string;
  icon: any;
  index: number;
  isLight?: boolean;
  label: string;
  value: string;
  growthBadge?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: 'easeOut' }}
      className={`rounded-sm border p-5 transition-all shadow-2xs ${
        isLight ? 'border-zinc-200 bg-white text-black hover:border-zinc-400' : 'border-zinc-800 bg-[#090b0e] text-white hover:border-zinc-600'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</div>
        <div className={`p-2 rounded-sm border ${
          isLight ? 'border-zinc-200 bg-zinc-100 text-black' : 'border-zinc-800 bg-zinc-900 text-white'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className={`mt-2.5 text-[28px] font-black tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>{value}</div>
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <span className={`text-[12px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{helper}</span>
        {growthBadge && (
          <span className={`px-2 py-0.5 rounded-sm text-[11px] font-extrabold border ${
            isLight ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-700 bg-zinc-900 text-white'
          }`}>
            {growthBadge}
          </span>
        )}
      </div>
    </motion.div>
  );
}
