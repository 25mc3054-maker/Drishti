"use client"

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageCircle, ReceiptText, RefreshCw, TrendingUp, Users } from 'lucide-react';
import type { DashboardData } from './types';
import { formatDate, formatMoney } from './utils';

interface InsightsPageProps {
  data: DashboardData;
  onDataRefresh?: () => Promise<void>;
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

export function InsightsPage({ data, onDataRefresh }: InsightsPageProps) {
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
    setInsightStatus({ type: 'idle', message: '' });
    try {
      const response = await fetch('/api/credit-reminders');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load credit reminders.');
      setDueReminders(result.due || []);
      setInsightStatus({ type: 'success', message: `${(result.due || []).length} weekly credit reminder${(result.due || []).length === 1 ? '' : 's'} due.` });
    } catch (error: any) {
      setInsightStatus({ type: 'error', message: error.message || 'Unable to load credit reminders.' });
    } finally {
      setIsLoadingReminders(false);
    }
  };

  const sendReminder = async (invoiceId: string, recordManualSend = false) => {
    setInsightStatus({ type: 'idle', message: '' });
    try {
      const response = await fetch('/api/credit-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, recordManualSend }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to send reminder.');
      setInsightStatus({ type: 'success', message: 'Credit reminder processed.' });
      await loadDueReminders();
      await onDataRefresh?.();
    } catch (error: any) {
      setInsightStatus({ type: 'error', message: error.message || 'Unable to send reminder.' });
    }
  };

  const clearCredit = async (invoiceId: string) => {
    setInsightStatus({ type: 'idle', message: '' });
    try {
      const response = await fetch('/api/credit-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', invoiceId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to clear credit invoice.');
      setInsightStatus({ type: 'success', message: 'Credit invoice marked as paid.' });
      await loadDueReminders();
      await onDataRefresh?.();
    } catch (error: any) {
      setInsightStatus({ type: 'error', message: error.message || 'Unable to clear credit invoice.' });
    }
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
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">Insights</div>
          <h2 className="text-[32px] font-semibold tracking-normal text-white">Correct business calculations from invoices, customers, and stock.</h2>
          <p className="max-w-3xl text-[15px] leading-6 text-[#9CA3AF]">All revenue and count cards live here so the rest of the product stays operational, not noisy.</p>
        </div>
        <button
          type="button"
          onClick={() => { void loadDueReminders(); }}
          disabled={isLoadingReminders}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-white/12 bg-white px-5 text-[14px] font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingReminders ? 'animate-spin' : ''}`} />
          Check Credit Reminders
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {primaryMetrics.map((metric, index) => (
          <MetricCard key={metric.label} index={index} label={metric.label} value={metric.value} helper={metric.helper} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[8px] border border-[#1A1A1A] bg-[#0A0A0A] p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">
            <Users className="h-4 w-4 text-white" />
            Customers by payment mode
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {paymentMetrics.map((metric) => (
              <div key={metric.label} className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
                <div className="text-[12px] text-[#9CA3AF]">{metric.label}</div>
                <div className="mt-2 text-[30px] font-semibold text-white">{metric.value}</div>
                <div className="mt-1 text-[13px] text-[#6B7280]">₹{formatMoney(metric.amount)} billed</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#1A1A1A] bg-[#0A0A0A] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">
              <MessageCircle className="h-4 w-4 text-white" />
              Weekly credit reminders
            </div>
            <div className="text-[12px] text-[#9CA3AF]">Cron: Monday 09:00 UTC</div>
          </div>

          {insightStatus.message ? (
            <div className={`mt-4 rounded-[8px] border px-3 py-2 text-[13px] ${insightStatus.type === 'error' ? 'border-red-400/35 bg-red-500/10 text-red-100' : 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100'}`}>
              {insightStatus.message}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {(dueReminders.length ? dueReminders : insights.openCreditInvoices.map((invoice: any) => ({
              invoiceId: invoice.id,
              customer: invoice.customer || null,
              total: Number(invoice.total || 0),
              createdAt: invoice.createdAt,
              lastCreditReminderAt: invoice.lastCreditReminderAt || null,
              phone: String(invoice.customer?.phone || ''),
              message: '',
              whatsappUrl: '',
            }))).map((entry: ReminderDue) => (
              <div key={entry.invoiceId} className="rounded-[8px] border border-white/10 bg-white/[0.035] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{entry.customer?.name || 'Credit customer'}</div>
                    <div className="mt-1 text-[12px] text-[#6B7280]">Bill {String(entry.invoiceId).slice(0, 10)} • {formatDate(entry.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-semibold text-white">₹{formatMoney(entry.total)}</div>
                    <div className="text-[12px] text-[#6B7280]">{entry.lastCreditReminderAt ? `Last: ${formatDate(entry.lastCreditReminderAt)}` : 'No reminder sent'}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.whatsappUrl ? (
                    <a
                      href={entry.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => { void sendReminder(entry.invoiceId, true); }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] font-semibold text-white transition hover:border-white/28 hover:bg-white/10"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Open WhatsApp
                    </a>
                  ) : (
                    <button type="button" onClick={() => { void sendReminder(entry.invoiceId); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/12 bg-black/45 px-4 text-[13px] font-semibold text-white transition hover:border-white/28 hover:bg-white/10">
                      <MessageCircle className="h-4 w-4" />
                      Send Reminder
                    </button>
                  )}
                  <button type="button" onClick={() => { void clearCredit(entry.invoiceId); }} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-emerald-300/24 bg-emerald-400/10 px-4 text-[13px] font-semibold text-emerald-100 transition hover:bg-emerald-400/16">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Paid
                  </button>
                </div>
              </div>
            ))}

            {insights.openCreditInvoices.length === 0 ? (
              <div className="rounded-[8px] border border-dashed border-white/12 p-6 text-center text-[14px] leading-6 text-[#9CA3AF]">
                No open credit invoices. Weekly reminders will start automatically when a credit bill is created.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-[#1A1A1A] bg-[#0A0A0A] p-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">
          <ReceiptText className="h-4 w-4 text-white" />
          Calculation rules
        </div>
        <div className="mt-4 grid gap-3 text-[13px] leading-6 text-[#D1D5DB] md:grid-cols-3">
          <p>Revenue is the sum of invoice totals. It does not use order placeholders.</p>
          <p>Stock sold is the sum of invoice item line totals. Remaining stock is current item price times quantity.</p>
          <p>Credit reminders repeat weekly only for unpaid credit invoices until they are marked paid.</p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ helper, index, label, value }: { helper: string; index: number; label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.22, delay: index * 0.025, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="rounded-[8px] border border-[#1A1A1A] bg-[#0A0A0A] p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#6B7280]">{label}</div>
        <TrendingUp className="h-4 w-4 text-[#10B981]" />
      </div>
      <div className="mt-3 text-[30px] font-bold tracking-normal text-white">{value}</div>
      <div className="mt-2 text-[12px] leading-5 text-[#6B7280]">{helper}</div>
    </motion.div>
  );
}
