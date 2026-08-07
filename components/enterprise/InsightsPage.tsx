"use client"

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, CheckCircle2, MessageCircle, ReceiptText, RefreshCw, Send, TrendingUp, Users } from 'lucide-react';
import type { DashboardData } from './types';
import { formatDate, formatMoney } from './utils';

interface InsightsPageProps {
  data: DashboardData;
  onDataRefresh?: () => Promise<void>;
  theme?: 'dark' | 'light';
}

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
  const [dueReminders, setDueReminders] = useState<ReminderDue[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);
  const [insightStatus, setInsightStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const insights = useMemo(() => {
    const invoices = data.invoices || [];
    const items = data.items || [];
    const customers = data.customers || [];
    const openCreditInvoices = invoices.filter(isOpenCreditInvoice);
    const grossRevenue = invoices.reduce((sum: number, invoice: any) => sum + Number(invoice.total || 0), 0);
    const collectedRevenue = invoices
      .filter((invoice: any) => paymentMethod(invoice) !== 'credit' || invoice.status === 'paid' || invoice.creditClearedAt)
      .reduce((sum: number, invoice: any) => sum + Number(invoice.total || 0), 0);
    const creditOutstanding = openCreditInvoices.reduce((sum: number, invoice: any) => sum + Number(invoice.total || 0), 0);
    const stockValueSold = invoices.reduce((sum: number, invoice: any) => (
      sum + (invoice.items || []).reduce((itemSum: number, item: any) => itemSum + Number(item.lineTotal || Number(item.price || 0) * Number(item.qty || 0)), 0)
    ), 0);
    const stockValueRemaining = items.reduce((sum: number, item: any) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
    const paymentTotals = ['cash', 'upi', 'card', 'credit'].reduce<Record<string, number>>((acc, method) => {
      acc[method] = invoices
        .filter((invoice: any) => paymentMethod(invoice) === method)
        .reduce((sum: number, invoice: any) => sum + Number(invoice.total || 0), 0);
      return acc;
    }, {});

    return {
      invoices,
      customers,
      openCreditInvoices,
      grossRevenue,
      collectedRevenue,
      creditOutstanding,
      stockValueSold,
      stockValueRemaining,
      totalInvoiceCount: invoices.length,
      totalCustomerCount: customers.length,
      cashCustomers: uniqueCustomersForMethod(invoices, 'cash'),
      upiCustomers: uniqueCustomersForMethod(invoices, 'upi'),
      cardCustomers: uniqueCustomersForMethod(invoices, 'card'),
      creditCustomers: uniqueCustomersForMethod(openCreditInvoices, 'credit'),
      paymentTotals,
    };
  }, [data]);

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

  const clearCredit = async (invoiceId: string) => {
    try {
      await fetch('/api/saas/credit-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', invoiceId }),
      });
      await loadDueReminders();
      await onDataRefresh?.();
    } catch {}
  };

  const primaryMetrics = [
    { label: 'Revenue', value: `₹${formatMoney(insights.grossRevenue)}`, helper: 'Total value of all invoices' },
    { label: 'Collected Revenue', value: `₹${formatMoney(insights.collectedRevenue)}`, helper: 'Paid invoices and cleared credit' },
    { label: 'Credit Outstanding', value: `₹${formatMoney(insights.creditOutstanding)}`, helper: 'Open credit bills only' },
    { label: 'Invoice Count', value: String(insights.totalInvoiceCount), helper: 'Total bills created' },
    { label: 'Total Customers', value: String(insights.totalCustomerCount), helper: 'Saved customer records' },
    { label: 'Stock Value Sold', value: `₹${formatMoney(insights.stockValueSold)}`, helper: 'Invoice item line totals' },
    { label: 'Stock Value Remaining', value: `₹${formatMoney(insights.stockValueRemaining)}`, helper: 'Current price times quantity' },
  ];

  const paymentMetrics = [
    { label: 'Cash Customers', value: String(insights.cashCustomers), amount: insights.paymentTotals.cash || 0 },
    { label: 'UPI Customers', value: String(insights.upiCustomers), amount: insights.paymentTotals.upi || 0 },
    { label: 'Card Customers', value: String(insights.cardCustomers), amount: insights.paymentTotals.card || 0 },
    { label: 'Credit Customers', value: String(insights.creditCustomers), amount: insights.paymentTotals.credit || 0 },
  ];

  return (
    <section className={`space-y-6 sm:space-y-8 rounded-2xl p-3.5 sm:p-6 transition-colors border-0 ${
      isLight ? 'bg-white text-black shadow-sm' : 'bg-black text-white'
    }`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Insights</div>
          <h1 className={`text-[28px] font-extrabold tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
            Business revenue, credit, and operational metrics
          </h1>
          <p className={`max-w-3xl text-[14.5px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Real-time analytics computed directly from store transactions and inventory.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void loadDueReminders(); }}
          disabled={isLoadingReminders}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border-0 px-5 text-[13px] font-bold transition disabled:opacity-50 ${
            isLight
              ? 'bg-black text-white hover:bg-zinc-800'
              : 'bg-white text-black hover:bg-zinc-200'
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingReminders ? 'animate-spin' : ''}`} />
          Check Credit Reminders
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {primaryMetrics.map((metric, index) => (
          <MetricCard isLight={isLight} icon={TrendingUp} key={metric.label} index={index} label={metric.label} value={metric.value} helper={metric.helper} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className={`rounded-xl border p-5 ${
          isLight ? 'border-transparent bg-zinc-50 text-black shadow-sm' : 'border-zinc-800 bg-black text-white'
        }`}>
          <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${
            isLight ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            <Users className="h-4 w-4 text-current" />
            Customers by payment mode
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {paymentMetrics.map((metric) => (
              <div key={metric.label} className={`rounded-xl border p-4 transition-all ${
                isLight ? 'border-transparent bg-white text-black' : 'border-zinc-800 bg-black text-white'
              }`}>
                <div className={`text-[12px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{metric.label}</div>
                <div className={`mt-1.5 text-[28px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{metric.value}</div>
                <div className={`mt-1 text-[12.5px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>₹{formatMoney(metric.amount)} billed</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl border p-5 ${
          isLight ? 'border-transparent bg-zinc-50 text-black shadow-sm' : 'border-zinc-800 bg-black text-white'
        }`}>
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                <BellRing className="h-4 w-4 text-amber-500" />
                Due Credit Reminders
              </div>
              <div className={`text-[12.5px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Active follow-ups ready for manual dispatch
              </div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[11.5px] font-bold ${
              isLight ? 'border-transparent bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
            }`}>
              {dueReminders.length} Due
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {dueReminders.map((reminder) => (
              <div
                key={reminder.invoiceId}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-all ${
                  isLight
                    ? 'border-transparent bg-white text-black'
                    : 'border-zinc-800 bg-black text-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[14px] font-bold ${isLight ? 'text-black' : 'text-white'}`}>
                      {reminder.customer?.name || reminder.phone || 'Walk-in Customer'}
                    </span>
                    <span className={`rounded-md border px-1.5 py-0.5 text-[10.5px] font-bold ${
                      isLight ? 'border-transparent bg-zinc-200 text-black' : 'border-zinc-800 bg-black text-white'
                    }`}>
                      INV-{String(reminder.invoiceId).slice(0, 6)}
                    </span>
                  </div>
                  <div className={`mt-1 text-[12px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Due Amount: <strong className={isLight ? 'text-black' : 'text-white'}>₹{formatMoney(Number(reminder.total || 0))}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { void sendReminder(reminder.invoiceId, true); }}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-[12px] font-bold transition ${
                    isLight
                      ? 'border-transparent bg-black text-white hover:bg-zinc-800'
                      : 'border-zinc-800 bg-black text-white hover:bg-zinc-900'
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Follow-up</span>
                </button>
              </div>
            ))}

            {dueReminders.length === 0 ? (
              <div className={`rounded-xl border p-6 text-center text-[12.5px] font-medium ${
                isLight ? 'border-transparent bg-white text-zinc-500' : 'border-zinc-800 bg-black text-zinc-400'
              }`}>
                No open credit invoices found.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`rounded-xl border p-5 ${
        isLight ? 'border-transparent bg-zinc-50 text-black' : 'border-zinc-800 bg-black text-white'
      }`}>
        <div className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Calculation rules
        </div>
        <div className={`mt-3 grid gap-3 text-[13px] font-medium leading-6 md:grid-cols-3 ${
          isLight ? 'text-zinc-600' : 'text-zinc-400'
        }`}>
          <p>Revenue is the sum of invoice totals. It does not use order placeholders.</p>
          <p>Stock sold is the sum of invoice item line totals. Remaining stock is current item price times quantity.</p>
          <p>Credit reminders repeat weekly only for unpaid credit invoices until they are marked paid.</p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ helper, icon: Icon, index, isLight, label, value }: { helper: string; icon: any; index: number; isLight?: boolean; label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.22, delay: index * 0.025, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={`rounded-xl border p-5 transition-all ${
        isLight ? 'border-zinc-200 bg-white text-black' : 'border-zinc-800 bg-black text-white'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</div>
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      </div>
      <div className={`mt-3 text-[28px] font-extrabold ${isLight ? 'text-black' : 'text-white'}`}>{value}</div>
      <div className={`mt-1.5 text-[12.5px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{helper}</div>
    </motion.div>
  );
}
