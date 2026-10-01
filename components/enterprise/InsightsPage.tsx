"use client";

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  Search,
  Filter,
  Eye,
  ZoomIn,
  Table,
  LayoutGrid
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Brush,
  Legend
} from 'recharts';
import { ContactActionGroup, WebCallModal, type CallRecipient } from './WebCallModal';
import type { DashboardData } from './types';
import { formatDate, formatMoney } from './utils';

interface InsightsPageProps {
  data: DashboardData;
  onDataRefresh?: () => Promise<void>;
  theme?: 'dark' | 'light';
}

type TimePeriodPreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last10days'
  | 'last30days'
  | 'thismonth'
  | 'lastmonth'
  | 'thisyear'
  | 'last12months'
  | 'last5years'
  | 'last10years'
  | 'last20years'
  | 'alltime'
  | 'specific_year'
  | 'specific_month'
  | 'specific_day'
  | 'year_range'
  | 'custom_range';

type ChartMetric = 'revenue' | 'collected' | 'invoices' | 'credit' | 'items_sold';
type ChartVisualType = 'bar' | 'area' | 'dual';
type GranularityOption = 'auto' | 'hour' | 'day' | 'week' | 'month' | 'year';

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
  '#D946EF', // Fuchsia
  '#F43F5E', // Coral Rose
  '#10B981', // Mint
  '#FBBF24', // Yellow Gold
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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

function parseDate(inv: any): Date {
  if (inv.createdAt) {
    const d = new Date(inv.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (inv.date) {
    const d = new Date(inv.date);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function InsightsPage({ data, onDataRefresh, theme = 'dark' }: InsightsPageProps) {
  const isLight = theme === 'light';
  const [mounted, setMounted] = useState(false);
  const now = new Date();
  const currentYear = now.getFullYear();

  // Primary filter controls
  const [timePeriod, setTimePeriod] = useState<TimePeriodPreset>('last10days');
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('revenue');
  const [chartVisual, setChartVisual] = useState<ChartVisualType>('bar');
  const [granularity, setGranularity] = useState<GranularityOption>('auto');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [showFormulaGuide, setShowFormulaGuide] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [enableBrushZoom, setEnableBrushZoom] = useState(false);

  // Custom picker states
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startYear, setStartYear] = useState<number>(currentYear - 5);
  const [endYear, setEndYear] = useState<number>(currentYear);
  const [specificYear, setSpecificYear] = useState<number>(currentYear);
  const [specificMonth, setSpecificMonth] = useState<number>(now.getMonth());
  const [specificDay, setSpecificDay] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [slotSearchQuery, setSlotSearchQuery] = useState('');
  const [breakdownView, setBreakdownView] = useState<'compact' | 'table'>('compact');
  const [onlyActiveSlots, setOnlyActiveSlots] = useState(false);

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

  // Compute available history range
  const { minYear, maxYear, earliestDate } = useMemo(() => {
    if (invoices.length === 0) {
      return { minYear: currentYear - 20, maxYear: currentYear, earliestDate: new Date(currentYear - 1, 0, 1) };
    }
    const timestamps = invoices.map((inv: any) => parseDate(inv).getTime());
    const minT = Math.min(...timestamps);
    const maxT = Math.max(...timestamps, Date.now());
    const minDateObj = new Date(minT);
    const minCalculatedYear = Math.min(minDateObj.getFullYear(), currentYear - 20);
    return {
      minYear: Math.max(2000, minCalculatedYear),
      maxYear: Math.max(currentYear, new Date(maxT).getFullYear()),
      earliestDate: minDateObj,
    };
  }, [invoices, currentYear]);

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
    const thisMonthInvoices = invoices.filter((inv: any) => {
      const d = parseDate(inv);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonthInvoices = invoices.filter((inv: any) => {
      const d = parseDate(inv);
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
  }, [invoices, items, customers, now]);

  // Helper to aggregate list of invoices into a standardized chart item
  const buildSlot = (
    label: string,
    shortLabel: string,
    matchingInvoices: any[],
    index: number
  ) => {
    const rev = matchingInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0);
    const collected = matchingInvoices
      .filter((inv: any) => paymentMethod(inv) !== 'credit' || inv.status === 'paid' || inv.creditClearedAt)
      .reduce((s, inv) => s + Number(inv.total || 0), 0);
    const credit = matchingInvoices
      .filter(isOpenCreditInvoice)
      .reduce((s, inv) => s + Number(inv.total || 0), 0);
    const itemsCount = matchingInvoices.reduce((s, inv) => (
      s + (inv.items || []).reduce((isum: number, it: any) => isum + Number(it.qty || 1), 0)
    ), 0);
    const upiInvoices = matchingInvoices.filter((inv: any) => {
      const m = paymentMethod(inv);
      return m === 'upi' || m === 'qr' || m === 'online' || m === 'card' || m.includes('upi') || m.includes('qr') || m.includes('online');
    });
    const upiPaymentsCount = upiInvoices.length;

    return {
      label,
      shortLabel,
      revenue: rev,
      collected,
      credit,
      invoices: matchingInvoices.length,
      upiPayments: upiPaymentsCount,
      items_sold: itemsCount,
      color: VIBRANT_BAR_COLORS[index % VIBRANT_BAR_COLORS.length],
    };
  };

  // AGGREGATE CHART DATA ACROSS ANY TIMELINE OR USER-SELECTED RANGE
  const chartData = useMemo(() => {
    // 1. Single Day Hourly Breakdown (Today, Yesterday, or Specific Day)
    if (timePeriod === 'today' || timePeriod === 'yesterday' || timePeriod === 'specific_day') {
      let targetDate = new Date();
      if (timePeriod === 'yesterday') {
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 1);
      } else if (timePeriod === 'specific_day') {
        targetDate = new Date(specificDay || Date.now());
      }

      const hours = [
        '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM',
        '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM',
        '8 PM', '9 PM', '10 PM', '11 PM'
      ];

      return hours.map((hourLabel, index) => {
        const hourNum = 6 + index;
        const matching = invoices.filter((inv: any) => {
          const invDate = parseDate(inv);
          return (
            invDate.getDate() === targetDate.getDate() &&
            invDate.getMonth() === targetDate.getMonth() &&
            invDate.getFullYear() === targetDate.getFullYear() &&
            invDate.getHours() === hourNum
          );
        });
        return buildSlot(
          `${targetDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${hourLabel}`,
          hourLabel,
          matching,
          index
        );
      });
    }

    // 2. Day-by-Day ranges (Last 7 Days, Last 10 Days, Last 30 Days)
    if (timePeriod === 'last7days' || timePeriod === 'last10days' || timePeriod === 'last30days') {
      const numDays = timePeriod === 'last7days' ? 7 : timePeriod === 'last10days' ? 10 : 30;
      const days = [];
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });

        const matching = invoices.filter((inv: any) => {
          const invDate = parseDate(inv);
          return (
            invDate.getDate() === d.getDate() &&
            invDate.getMonth() === d.getMonth() &&
            invDate.getFullYear() === d.getFullYear()
          );
        });

        days.push(buildSlot(`${dateStr} (${dayName})`, numDays > 14 && i % 2 !== 0 ? '' : dateStr, matching, numDays - 1 - i));
      }
      return days;
    }

    // 3. Current Month or Previous Month (All Days 1 to Month-End)
    if (timePeriod === 'thismonth' || timePeriod === 'lastmonth') {
      const targetMonth = timePeriod === 'thismonth' ? now.getMonth() : now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const targetYear = timePeriod === 'thismonth' ? now.getFullYear() : now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const totalDays = new Date(targetYear, targetMonth + 1, 0).getDate();
      const days = [];

      for (let day = 1; day <= totalDays; day++) {
        const matching = invoices.filter((inv: any) => {
          const invDate = parseDate(inv);
          return (
            invDate.getDate() === day &&
            invDate.getMonth() === targetMonth &&
            invDate.getFullYear() === targetYear
          );
        });

        const shortLabel = day === 1 || day % 5 === 0 || day === totalDays ? `${day} ${SHORT_MONTH_NAMES[targetMonth]}` : `${day}`;
        days.push(buildSlot(`Day ${day} ${MONTH_NAMES[targetMonth]} ${targetYear}`, shortLabel, matching, day - 1));
      }
      return days;
    }

    // 4. Specific Month Deep-Dive (Day 1 to 31 for picked month & year)
    if (timePeriod === 'specific_month') {
      const totalDays = new Date(specificYear, specificMonth + 1, 0).getDate();
      const days = [];

      for (let day = 1; day <= totalDays; day++) {
        const matching = invoices.filter((inv: any) => {
          const invDate = parseDate(inv);
          return (
            invDate.getDate() === day &&
            invDate.getMonth() === specificMonth &&
            invDate.getFullYear() === specificYear
          );
        });

        const shortLabel = day === 1 || day % 5 === 0 || day === totalDays ? `${day} ${SHORT_MONTH_NAMES[specificMonth]}` : `${day}`;
        days.push(buildSlot(`Day ${day} ${MONTH_NAMES[specificMonth]} ${specificYear}`, shortLabel, matching, day - 1));
      }
      return days;
    }

    // 5. Single Year Deep-Dive (This Year or Specific Year: 12 Months Jan - Dec)
    if (timePeriod === 'thisyear' || timePeriod === 'specific_year') {
      const yearToGraph = timePeriod === 'thisyear' ? currentYear : specificYear;
      return SHORT_MONTH_NAMES.map((mName, mIdx) => {
        const matching = invoices.filter((inv: any) => {
          const invDate = parseDate(inv);
          return invDate.getMonth() === mIdx && invDate.getFullYear() === yearToGraph;
        });
        return buildSlot(`${MONTH_NAMES[mIdx]} ${yearToGraph}`, mName, matching, mIdx);
      });
    }

    // 6. Rolling 12 Months
    if (timePeriod === 'last12months') {
      const currentMonth = now.getMonth();
      const slots = [];

      for (let i = 11; i >= 0; i--) {
        const monthIdx = (currentMonth - i + 12) % 12;
        const monthName = SHORT_MONTH_NAMES[monthIdx];
        const targetYear = now.getFullYear() - (currentMonth - i < 0 ? 1 : 0);

        const matching = invoices.filter((inv: any) => {
          const invDate = parseDate(inv);
          return invDate.getMonth() === monthIdx && invDate.getFullYear() === targetYear;
        });

        slots.push(buildSlot(`${MONTH_NAMES[monthIdx]} ${targetYear}`, monthName, matching, 11 - i));
      }
      return slots;
    }

    // 7. Multi-Year Insights: Last 5 Years, Last 10 Years, Last 20 Years, or Custom Year Range!
    if (
      timePeriod === 'last5years' ||
      timePeriod === 'last10years' ||
      timePeriod === 'last20years' ||
      timePeriod === 'year_range'
    ) {
      let fromY = currentYear - 4;
      let toY = currentYear;

      if (timePeriod === 'last10years') fromY = currentYear - 9;
      if (timePeriod === 'last20years') fromY = currentYear - 19;
      if (timePeriod === 'year_range') {
        fromY = Math.min(startYear, endYear);
        toY = Math.max(startYear, endYear);
      }

      const yearsList: number[] = [];
      for (let y = fromY; y <= toY; y++) {
        yearsList.push(y);
      }

      return yearsList.map((yr, idx) => {
        const matching = invoices.filter((inv: any) => {
          const invDate = parseDate(inv);
          return invDate.getFullYear() === yr;
        });
        return buildSlot(`Year ${yr}`, `${yr}`, matching, idx);
      });
    }

    // 8. All Time (Since Day 1)
    if (timePeriod === 'alltime') {
      if (invoices.length === 0) {
        return [buildSlot('Day 1 - Present', 'All Time', [], 0)];
      }

      const startY = earliestDate.getFullYear();
      const endY = currentYear;
      const spanYears = endY - startY + 1;

      if (spanYears > 3 && granularity !== 'month' && granularity !== 'day') {
        // Multi-year breakdown
        const yearsList: number[] = [];
        for (let y = startY; y <= endY; y++) yearsList.push(y);
        return yearsList.map((yr, idx) => {
          const matching = invoices.filter((inv: any) => parseDate(inv).getFullYear() === yr);
          return buildSlot(`Year ${yr}`, `${yr}`, matching, idx);
        });
      }

      // Monthly breakdown across all-time history
      const totalMonths = (endY - startY) * 12 + (now.getMonth() - earliestDate.getMonth()) + 1;
      const slots = [];
      const safeTotalMonths = Math.min(totalMonths, 48); // limit to 48 recent slots for clean render if huge

      for (let m = 0; m < safeTotalMonths; m++) {
        const d = new Date(earliestDate.getFullYear(), earliestDate.getMonth() + m, 1);
        if (d > now) break;
        const matching = invoices.filter((inv: any) => {
          const invDate = parseDate(inv);
          return invDate.getFullYear() === d.getFullYear() && invDate.getMonth() === d.getMonth();
        });
        slots.push(buildSlot(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, `${SHORT_MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`, matching, m));
      }
      return slots;
    }

    // 9. Custom Date Range Explorer (Between any two exact dates)
    if (timePeriod === 'custom_range') {
      const start = new Date(customStartDate || Date.now());
      const end = new Date(customEndDate || Date.now());
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Grouping decision
      const chosenGranularity =
        granularity === 'auto'
          ? diffDays <= 31
            ? 'day'
            : diffDays <= 365
            ? 'month'
            : 'year'
          : granularity;

      if (chosenGranularity === 'day') {
        const safeDays = Math.min(diffDays, 90);
        const days = [];
        for (let i = 0; i < safeDays; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          if (d > end) break;
          const matching = invoices.filter((inv: any) => {
            const invDate = parseDate(inv);
            return (
              invDate.getFullYear() === d.getFullYear() &&
              invDate.getMonth() === d.getMonth() &&
              invDate.getDate() === d.getDate()
            );
          });
          const dStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          days.push(buildSlot(`${dStr} (${d.toLocaleDateString('en-IN', { weekday: 'short' })})`, dStr, matching, i));
        }
        return days;
      }

      if (chosenGranularity === 'month') {
        const slots = [];
        let curr = new Date(start.getFullYear(), start.getMonth(), 1);
        let idx = 0;
        while (curr <= end && idx < 60) {
          const mIdx = curr.getMonth();
          const y = curr.getFullYear();
          const matching = invoices.filter((inv: any) => {
            const invDate = parseDate(inv);
            return invDate.getFullYear() === y && invDate.getMonth() === mIdx;
          });
          slots.push(buildSlot(`${MONTH_NAMES[mIdx]} ${y}`, `${SHORT_MONTH_NAMES[mIdx]} '${String(y).slice(2)}`, matching, idx));
          curr.setMonth(curr.getMonth() + 1);
          idx++;
        }
        return slots;
      }

      if (chosenGranularity === 'year') {
        const slots = [];
        let idx = 0;
        for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
          const matching = invoices.filter((inv: any) => parseDate(inv).getFullYear() === y);
          slots.push(buildSlot(`Year ${y}`, `${y}`, matching, idx));
          idx++;
        }
        return slots;
      }
    }

    return [];
  }, [
    timePeriod,
    invoices,
    specificDay,
    specificMonth,
    specificYear,
    startYear,
    endYear,
    customStartDate,
    customEndDate,
    granularity,
    earliestDate,
    currentYear,
    now
  ]);

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

      {/* Main Bar/Area Chart & Sales Momentum Command Center */}
      <div className={`rounded-sm border p-5 sm:p-6 relative transition-all shadow-xs ${
        isLight ? 'border-zinc-200 bg-zinc-50/90 text-black' : 'border-zinc-800 bg-[#090b0e] text-white'
      }`}>
        {/* Top Header with Dynamic Stats & Growth Indicator */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b pb-5 border-zinc-200 dark:border-zinc-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
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
              {periodStats.maxBar && periodStats.maxBar.revenue > 0 ? (
                <>
                  🔥 <strong>Peak Selling Window:</strong> {periodStats.maxBar.label} (₹{formatMoney(periodStats.maxBar.revenue)} recorded across {periodStats.maxBar.invoices} bills).
                </>
              ) : (
                'No sales transactions found in this period. Adjust your date range or create bills to view analytics.'
              )}
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <div className={`p-1 rounded-sm border flex items-center gap-1 flex-wrap ${
              isLight ? 'bg-white border-zinc-300' : 'bg-black border-zinc-800'
            }`}>
              {[
                { id: 'today', label: 'Today (Hourly)' },
                { id: 'last7days', label: 'Last 7 Days' },
                { id: 'last10days', label: 'Last 10 Days' },
                { id: 'last30days', label: 'Last 30 Days' },
                { id: 'thismonth', label: 'This Month' },
                { id: 'thisyear', label: 'This Year (12 Mo)' },
                { id: 'last5years', label: 'Last 5 Yrs' },
                { id: 'last20years', label: 'Last 20 Yrs' },
                { id: 'alltime', label: '🚀 All Time (Day 1)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setTimePeriod(tab.id as TimePeriodPreset);
                  }}
                  className={`px-3 py-1.5 rounded-sm text-xs font-extrabold transition ${
                    timePeriod === tab.id
                      ? (isLight ? 'bg-black text-white shadow-xs' : 'bg-white text-black shadow-xs')
                      : (isLight ? 'text-zinc-600 hover:text-black hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-zinc-900')
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {/* Advanced Custom Filter Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilter((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-black border transition ${
                  showAdvancedFilter || ['custom_range', 'year_range', 'specific_year', 'specific_month', 'specific_day'].includes(timePeriod)
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-extrabold'
                    : isLight
                    ? 'border-zinc-300 bg-zinc-100 text-black hover:bg-zinc-200'
                    : 'border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Custom Explorer</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showAdvancedFilter ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Timeline & Deep-Dive Controls */}
        <AnimatePresence>
          {(showAdvancedFilter || ['custom_range', 'year_range', 'specific_year', 'specific_month', 'specific_day'].includes(timePeriod)) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-4 p-4 rounded-sm border space-y-4 ${
                isLight ? 'bg-white border-zinc-300 shadow-sm' : 'bg-zinc-950 border-zinc-800 shadow-sm'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-3 border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-black uppercase tracking-wider">Advanced Timeline & Multi-Year Explorer</span>
                </div>

                {/* Sub-mode selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'custom_range', label: '📅 Custom Date Range' },
                    { id: 'year_range', label: '🏛️ Between Two Years' },
                    { id: 'specific_year', label: '📆 Specific Year (12 Mo)' },
                    { id: 'specific_month', label: '🗓️ Specific Month (Day 1..31)' },
                    { id: 'specific_day', label: '⏰ Specific Day (Hourly)' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTimePeriod(mode.id as TimePeriodPreset)}
                      className={`px-3 py-1 text-xs font-bold rounded-sm border transition ${
                        timePeriod === mode.id
                          ? (isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white')
                          : (isLight ? 'border-zinc-200 text-zinc-600 hover:bg-zinc-100' : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900')
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Inputs Based on Active Deep-Dive Mode */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-1">
                {/* 1. Custom Date Range Pickers */}
                {timePeriod === 'custom_range' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase opacity-70">From Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className={`w-full h-10 px-3 text-xs font-bold rounded-sm border ${
                          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase opacity-70">To Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className={`w-full h-10 px-3 text-xs font-bold rounded-sm border ${
                          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase opacity-70">Grouping</label>
                      <select
                        value={granularity}
                        onChange={(e) => setGranularity(e.target.value as GranularityOption)}
                        className={`w-full h-10 px-3 text-xs font-bold rounded-sm border ${
                          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      >
                        <option value="auto">Auto (Best Fit)</option>
                        <option value="day">By Day</option>
                        <option value="month">By Month</option>
                        <option value="year">By Year</option>
                      </select>
                    </div>
                  </>
                )}

                {/* 2. Between Two Years */}
                {timePeriod === 'year_range' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase opacity-70">Start Year</label>
                      <select
                        value={startYear}
                        onChange={(e) => setStartYear(Number(e.target.value))}
                        className={`w-full h-10 px-3 text-xs font-bold rounded-sm border ${
                          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      >
                        {Array.from({ length: 30 }, (_, i) => currentYear - 25 + i).map((y) => (
                          <option key={y} value={y}>Year {y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase opacity-70">End Year</label>
                      <select
                        value={endYear}
                        onChange={(e) => setEndYear(Number(e.target.value))}
                        className={`w-full h-10 px-3 text-xs font-bold rounded-sm border ${
                          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      >
                        {Array.from({ length: 30 }, (_, i) => currentYear - 25 + i).map((y) => (
                          <option key={y} value={y}>Year {y}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* 3. Specific Year Breakdown */}
                {timePeriod === 'specific_year' && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase opacity-70">Select Target Year (12 Months Jan - Dec)</label>
                    <select
                      value={specificYear}
                      onChange={(e) => setSpecificYear(Number(e.target.value))}
                      className={`w-full h-10 px-3 text-xs font-bold rounded-sm border ${
                        isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                      }`}
                    >
                      {Array.from({ length: 30 }, (_, i) => currentYear - 25 + i).map((y) => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 4. Specific Month Breakdown */}
                {timePeriod === 'specific_month' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase opacity-70">Select Month</label>
                      <select
                        value={specificMonth}
                        onChange={(e) => setSpecificMonth(Number(e.target.value))}
                        className={`w-full h-10 px-3 text-xs font-bold rounded-sm border ${
                          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      >
                        {MONTH_NAMES.map((m, idx) => (
                          <option key={m} value={idx}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase opacity-70">Select Year</label>
                      <select
                        value={specificYear}
                        onChange={(e) => setSpecificYear(Number(e.target.value))}
                        className={`w-full h-10 px-3 text-xs font-bold rounded-sm border ${
                          isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}
                      >
                        {Array.from({ length: 30 }, (_, i) => currentYear - 25 + i).map((y) => (
                          <option key={y} value={y}>Year {y}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* 5. Specific Day Breakdown */}
                {timePeriod === 'specific_day' && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase opacity-70">Pick Any Exact Date in History (Hourly)</label>
                    <input
                      type="date"
                      value={specificDay}
                      onChange={(e) => setSpecificDay(e.target.value)}
                      className={`w-full h-10 px-3 text-xs font-bold rounded-sm border ${
                        isLight ? 'bg-zinc-50 border-zinc-300 text-black' : 'bg-zinc-900 border-zinc-700 text-white'
                      }`}
                    />
                  </div>
                )}

                {/* Visual Type & Zoom Slider Toggles */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase opacity-70">Graph Style</label>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'bar', label: '📊 Bar' },
                      { id: 'area', label: '📈 Area' },
                      { id: 'dual', label: '⚖️ Dual' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setChartVisual(st.id as ChartVisualType)}
                        className={`flex-1 h-10 text-xs font-bold rounded-sm border transition ${
                          chartVisual === st.id
                            ? (isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white')
                            : (isLight ? 'border-zinc-300 text-zinc-600 hover:bg-zinc-100' : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900')
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase opacity-70">Zoom Slider</label>
                  <button
                    type="button"
                    onClick={() => setEnableBrushZoom((prev) => !prev)}
                    className={`w-full h-10 flex items-center justify-center gap-2 text-xs font-bold rounded-sm border transition ${
                      enableBrushZoom
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-extrabold'
                        : isLight
                        ? 'border-zinc-300 bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                    <span>{enableBrushZoom ? 'Zoom Slider Active' : 'Enable Zoom Drag'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metric Selection Chips */}
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Graph Metric:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'revenue', label: '💰 Gross Revenue (₹)' },
                { id: 'collected', label: '💵 Collected Cash / UPI (₹)' },
                { id: 'credit', label: '⏳ Credit / Khata (₹)' },
                { id: 'invoices', label: '🧾 Bills Count' },
                { id: 'items_sold', label: '📦 Items Sold Qty' },
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

          <div className={`text-xs font-bold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Showing {chartData.length} data slots
          </div>
        </div>

        {/* Responsive Recharts Visual Display */}
        <div className="mt-6 h-[380px] sm:h-[430px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartVisual === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 25 }}>
                  <defs>
                    <linearGradient id="areaColorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke={isLight ? '#E4E4E7' : '#22242A'} vertical={false} />
                  <XAxis dataKey="shortLabel" stroke="#71717A" fontSize={11} fontWeight={700} tickLine={false} dy={10} />
                  <YAxis stroke="#71717A" fontSize={11} fontWeight={700} tickLine={false} tickFormatter={(val) => (['invoices', 'items_sold'].includes(activeMetric) ? val : `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey={activeMetric} stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#areaColorMetric)" />
                  {enableBrushZoom && <Brush dataKey="shortLabel" height={28} stroke="#3B82F6" fill={isLight ? '#F4F4F5' : '#18181B'} />}
                </AreaChart>
              ) : chartVisual === 'dual' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke={isLight ? '#E4E4E7' : '#22242A'} vertical={false} />
                  <XAxis dataKey="shortLabel" stroke="#71717A" fontSize={11} fontWeight={700} tickLine={false} dy={10} />
                  <YAxis stroke="#71717A" fontSize={11} fontWeight={700} tickLine={false} tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="💰 Gross Revenue" fill="#3B82F6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="collected" name="💵 Collected Cash" fill="#10B981" radius={[0, 0, 0, 0]} />
                  {enableBrushZoom && <Brush dataKey="shortLabel" height={28} stroke="#3B82F6" fill={isLight ? '#F4F4F5' : '#18181B'} />}
                </BarChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke={isLight ? '#E4E4E7' : '#22242A'} vertical={false} />
                  <XAxis dataKey="shortLabel" stroke="#71717A" fontSize={11} fontWeight={700} tickLine={false} dy={10} />
                  <YAxis stroke="#71717A" fontSize={11} fontWeight={700} tickLine={false} tickFormatter={(val) => (['invoices', 'items_sold'].includes(activeMetric) ? val : `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`)} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey={activeMetric} radius={[0, 0, 0, 0]} animationDuration={600}>
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
                  {enableBrushZoom && <Brush dataKey="shortLabel" height={28} stroke="#3B82F6" fill={isLight ? '#F4F4F5' : '#18181B'} />}
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold opacity-50">
              Loading interactive charts...
            </div>
          )}
        </div>

        {/* Compact, High-Density Breakdown per Slot with Instant Filtering & View Toggles */}
        <div className={`mt-6 pt-5 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                📊 Detailed Breakdown per Slot
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-xs ${
                isLight ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-800 text-zinc-300'
              }`}>
                {chartData.length} slots
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Only Active Slots Filter Toggle */}
              <button
                type="button"
                onClick={() => setOnlyActiveSlots((prev) => !prev)}
                className={`h-7 px-2.5 text-[11px] font-bold rounded-sm border transition flex items-center gap-1 ${
                  onlyActiveSlots
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-extrabold'
                    : isLight
                    ? 'border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <span>Sales &gt; 0 Only</span>
              </button>

              {/* View Switcher: Compact Grid vs Table */}
              <div className={`p-0.5 rounded-sm border flex items-center gap-0.5 ${
                isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-900 border-zinc-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setBreakdownView('compact')}
                  className={`h-6 px-2 text-[11px] font-bold rounded-xs flex items-center gap-1 transition ${
                    breakdownView === 'compact'
                      ? (isLight ? 'bg-white text-black shadow-2xs font-extrabold' : 'bg-black text-white shadow-2xs font-extrabold')
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <LayoutGrid className="h-3 w-3" />
                  <span>Compact</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownView('table')}
                  className={`h-6 px-2 text-[11px] font-bold rounded-xs flex items-center gap-1 transition ${
                    breakdownView === 'table'
                      ? (isLight ? 'bg-white text-black shadow-2xs font-extrabold' : 'bg-black text-white shadow-2xs font-extrabold')
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Table className="h-3 w-3" />
                  <span>Table</span>
                </button>
              </div>

              {/* Fast Search Input */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter slots..."
                  value={slotSearchQuery}
                  onChange={(e) => setSlotSearchQuery(e.target.value)}
                  className={`h-7 pl-7 pr-2.5 text-[11px] font-semibold rounded-sm border w-32 sm:w-40 ${
                    isLight ? 'bg-white border-zinc-300 text-black' : 'bg-black border-zinc-800 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Compact View Mode: High-Density 6 to 8 Columns Micro-Cards */}
          {breakdownView === 'compact' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {chartData
                .filter((item) => (!onlyActiveSlots || item.revenue > 0) && (!slotSearchQuery || item.label.toLowerCase().includes(slotSearchQuery.toLowerCase()) || item.shortLabel.toLowerCase().includes(slotSearchQuery.toLowerCase())))
                .map((item, i) => {
                  const hasSales = item.revenue > 0;
                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-sm border transition-all ${
                        hasSales
                          ? isLight
                            ? 'border-zinc-300 bg-white text-black shadow-xs hover:border-black'
                            : 'border-zinc-700 bg-zinc-950 text-white hover:border-zinc-500'
                          : isLight
                          ? 'border-zinc-200/80 bg-zinc-100/50 text-zinc-500 hover:border-zinc-300'
                          : 'border-zinc-900 bg-black/60 text-zinc-500 hover:border-zinc-800'
                      }`}
                    >
                      {/* Top row: Color indicator + Label + Bills count */}
                      <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-zinc-100 dark:border-zinc-900">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[11px] font-black truncate" title={item.label}>
                            {item.shortLabel || item.label}
                          </span>
                        </div>
                        {item.invoices > 0 ? (
                          <span className="text-[10px] font-extrabold px-1 py-0.2 rounded-xs bg-blue-500/15 text-blue-400 shrink-0">
                            {item.invoices} bills
                          </span>
                        ) : (
                          <span className="text-[10px] opacity-40 font-bold shrink-0">0</span>
                        )}
                      </div>

                      {/* Bottom row: Revenue & Collected */}
                      <div className="flex items-baseline justify-between gap-1 pt-0.5">
                        <div className={`text-[13px] font-black tracking-tight ${hasSales ? (isLight ? 'text-black' : 'text-white') : 'opacity-40'}`}>
                          ₹{formatMoney(item.revenue)}
                        </div>
                        {item.collected > 0 && (
                          <div className="text-[10px] font-bold text-emerald-500 truncate" title={`Collected: ₹${formatMoney(item.collected)}`}>
                            ✓₹{formatMoney(item.collected)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            /* Table View Mode: Ultra-Dense Striped List */
            <div className={`border rounded-sm overflow-hidden max-h-[380px] overflow-y-auto ${
              isLight ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-black'
            }`}>
              <table className="w-full text-left text-xs">
                <thead className={`sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider border-b ${
                  isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}>
                  <tr>
                    <th className="py-2 px-3">Slot / Date</th>
                    <th className="py-2 px-3">Gross Revenue</th>
                    <th className="py-2 px-3">Collected Cash</th>
                    <th className="py-2 px-3">Credit (Khata)</th>
                    <th className="py-2 px-3">UPI / QR / Online</th>
                    <th className="py-2 px-3 text-right">Bills Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {chartData
                    .filter((item) => (!onlyActiveSlots || item.revenue > 0) && (!slotSearchQuery || item.label.toLowerCase().includes(slotSearchQuery.toLowerCase()) || item.shortLabel.toLowerCase().includes(slotSearchQuery.toLowerCase())))
                    .map((item, i) => (
                      <tr
                        key={i}
                        className={`transition-colors ${
                          isLight ? 'hover:bg-zinc-50' : 'hover:bg-zinc-900/50'
                        }`}
                      >
                        <td className="py-2 px-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="font-bold">{item.label}</span>
                        </td>
                        <td className="py-2 px-3 font-black">₹{formatMoney(item.revenue)}</td>
                        <td className="py-2 px-3 font-semibold text-emerald-500">₹{formatMoney(item.collected)}</td>
                        <td className="py-2 px-3 font-semibold text-amber-500">₹{formatMoney(item.credit)}</td>
                        <td className="py-2 px-3 font-semibold text-purple-400">
                          {item.upiPayments} {item.upiPayments === 1 ? 'online / QR' : 'online / QR'}
                        </td>
                        <td className="py-2 px-3 font-bold text-right">{item.invoices} bills</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
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
