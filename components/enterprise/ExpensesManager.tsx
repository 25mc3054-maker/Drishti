"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Zap,
  Repeat,
  CheckCircle2,
  ArrowUpRight,
  TrendingDown,
  FileText,
  Filter,
  X,
  Clock,
  Sparkles,
  Wallet,
  Receipt
} from 'lucide-react';
import { formatMoney, formatDate } from './utils';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMode?: 'cash' | 'upi' | 'bank_transfer' | 'card';
  payeeName?: string;
  isRecurringMonthly?: boolean;
  recurringDay?: number; // 1 to 31
  notes?: string;
  createdAt?: string;
}

interface ExpensesManagerProps {
  expenses: Expense[];
  onDataRefresh?: () => Promise<void>;
  theme?: 'dark' | 'light';
}

const EXPENSE_CATEGORIES = [
  'Shop Rent',
  'Worker Salaries',
  'Electricity & Utilities',
  'Stock & Inventory Transport',
  'Packaging & Materials',
  'Store Maintenance & Repairs',
  'Tea & Refreshments',
  'Internet & Phone',
  'Marketing & Promo',
  'Miscellaneous'
];

export function ExpensesManager({
  expenses = [],
  onDataRefresh,
  theme = 'dark'
}: ExpensesManagerProps) {
  const isLight = theme === 'light';

  // Active View Tab: 'all' | 'monthly_fixed' | 'one_time'
  const [activeTab, setActiveTab] = useState<'all' | 'monthly_fixed' | 'one_time'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isPostingRecurring, setIsPostingRecurring] = useState(false);
  const [postSuccessMsg, setPostSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Shop Rent',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'cash' as 'cash' | 'upi' | 'bank_transfer' | 'card',
    payeeName: '',
    isRecurringMonthly: false,
    recurringDay: '1',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Tab filter
      if (activeTab === 'monthly_fixed' && !exp.isRecurringMonthly) return false;
      if (activeTab === 'one_time' && exp.isRecurringMonthly) return false;

      // Category filter
      if (selectedCategory !== 'All' && exp.category !== selectedCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = exp.title?.toLowerCase().includes(q);
        const matchesCategory = exp.category?.toLowerCase().includes(q);
        const matchesPayee = exp.payeeName?.toLowerCase().includes(q);
        const matchesNotes = exp.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesPayee && !matchesNotes) return false;
      }

      // Month filter
      if (selectedMonth !== 'all') {
        const expDate = new Date(exp.date || exp.createdAt || '');
        const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthKey !== selectedMonth) return false;
      }

      return true;
    });
  }, [expenses, activeTab, selectedCategory, searchQuery, selectedMonth]);

  // Statistics
  const stats = useMemo(() => {
    const totalAll = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    
    // Recurring monthly commitments
    const monthlyCommitment = expenses
      .filter((e) => e.isRecurringMonthly)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Salaries total
    const salariesTotal = expenses
      .filter((e) => e.category === 'Worker Salaries')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Shop rent total
    const rentTotal = expenses
      .filter((e) => e.category === 'Shop Rent')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // This month expenses
    const now = new Date();
    const currentMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date || e.createdAt || now);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      totalAll,
      monthlyCommitment,
      salariesTotal,
      rentTotal,
      currentMonthTotal,
      totalEntries: expenses.length
    };
  }, [expenses]);

  // Available Months for dropdown
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.date || e.createdAt) {
        const d = new Date(e.date || e.createdAt || '');
        if (!isNaN(d.getTime())) {
          set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
      }
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const openAddModal = (presetCategory?: string, isRecurring = false) => {
    setEditingExpense(null);
    setFormData({
      title: presetCategory ? `${presetCategory} - ${new Date().toLocaleString('en-IN', { month: 'short' })}` : '',
      amount: '',
      category: presetCategory || 'Shop Rent',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'cash',
      payeeName: '',
      isRecurringMonthly: isRecurring,
      recurringDay: '1',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title || '',
      amount: String(expense.amount || ''),
      category: expense.category || 'Shop Rent',
      date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMode: expense.paymentMode || 'cash',
      payeeName: expense.payeeName || '',
      isRecurringMonthly: !!expense.isRecurringMonthly,
      recurringDay: String(expense.recurringDay || 1),
      notes: expense.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        paymentMode: formData.paymentMode,
        payeeName: formData.payeeName,
        isRecurringMonthly: Boolean(formData.isRecurringMonthly),
        recurringDay: Number(formData.recurringDay || 1),
        notes: formData.notes
      };

      if (editingExpense) {
        await fetch(`/api/saas/expenses?id=${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/saas/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      setIsModalOpen(false);
      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (err) {
      console.error('Failed to save expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      await fetch(`/api/saas/expenses?id=${id}`, { method: 'DELETE' });
      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  // 1-Click: Post all recurring monthly commitments to current month
  const handlePostMonthlyExpenses = async () => {
    const recurringList = expenses.filter((e) => e.isRecurringMonthly);
    if (recurringList.length === 0) {
      alert('No monthly recurring expenses configured yet. Add Shop Rent, Salaries, or Bills with "Monthly Recurring" turned on first!');
      return;
    }

    setIsPostingRecurring(true);
    try {
      const currentMonthStr = new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' });
      const today = new Date().toISOString().split('T')[0];

      for (const rec of recurringList) {
        await fetch('/api/saas/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `${rec.title} (${currentMonthStr})`,
            amount: Number(rec.amount),
            category: rec.category,
            date: today,
            paymentMode: rec.paymentMode || 'cash',
            payeeName: rec.payeeName,
            isRecurringMonthly: false, // Logged instance is marked as ledger entry
            notes: `Auto-posted from Monthly Recurring schedule for ${currentMonthStr}`
          })
        });
      }

      setPostSuccessMsg(`Successfully posted ${recurringList.length} monthly expenses into this month's ledger!`);
      setTimeout(() => setPostSuccessMsg(''), 4000);
      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (err) {
      console.error('Failed to post monthly expenses:', err);
    } finally {
      setIsPostingRecurring(false);
    }
  };

  return (
    <div className={`space-y-6 rounded-sm p-4 sm:p-6 transition-colors ${
      isLight ? 'bg-white text-black' : 'bg-black text-white'
    }`}>
      {/* Top Header */}
      <div className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b pb-5 ${
        isLight ? 'border-zinc-200' : 'border-zinc-800'
      }`}>
        <div className="space-y-1">
          <div className={`text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <CreditCard className="h-4 w-4" />
            Store Cost Control & Ledger
          </div>
          <h1 className={`text-[28px] font-black tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
            Expenses & Monthly Commitments
          </h1>
          <p className={`max-w-3xl text-[14px] font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Manage daily store purchases, monthly shop rent, worker salaries, and utilities with full editing and monthly automation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handlePostMonthlyExpenses}
            disabled={isPostingRecurring}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-sm border px-4 text-[13px] font-bold transition disabled:opacity-50 shadow-2xs ${
              isLight
                ? 'bg-zinc-100 text-black border-zinc-300 hover:bg-zinc-200'
                : 'bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <Repeat className={`h-4 w-4 ${isPostingRecurring ? 'animate-spin' : ''}`} />
            Post Monthly Rent & Salaries
          </button>

          <button
            type="button"
            onClick={() => openAddModal()}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-sm border px-5 text-[13px] font-extrabold transition shadow-2xs ${
              isLight
                ? 'bg-black text-white border-black hover:bg-zinc-800'
                : 'bg-white text-black border-white hover:bg-zinc-200'
            }`}
          >
            <Plus className="h-4 w-4" />
            Add New Expense
          </button>
        </div>
      </div>

      {postSuccessMsg && (
        <div className={`p-3.5 rounded-sm border flex items-center gap-2 text-xs font-bold ${
          isLight ? 'bg-zinc-100 border-black text-black' : 'bg-zinc-900 border-white text-white'
        }`}>
          <CheckCircle2 className="h-4 w-4" />
          <span>{postSuccessMsg}</span>
        </div>
      )}

      {/* 4 Primary Summary Metric Panels */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`p-5 rounded-sm border ${
          isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-[#090b0e] border-zinc-800 text-white'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase opacity-70">
            <span>This Month Total</span>
            <Calendar className="h-4 w-4" />
          </div>
          <div className="mt-2.5 text-2xl font-black">₹{formatMoney(stats.currentMonthTotal)}</div>
          <div className="mt-1 text-[11.5px] opacity-70 font-medium">Recorded spending this active month</div>
        </div>

        <div className={`p-5 rounded-sm border ${
          isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-[#090b0e] border-zinc-800 text-white'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase opacity-70">
            <span>Monthly Recurring Due</span>
            <Repeat className="h-4 w-4" />
          </div>
          <div className="mt-2.5 text-2xl font-black">₹{formatMoney(stats.monthlyCommitment)}</div>
          <div className="mt-1 text-[11.5px] opacity-70 font-medium">Fixed Rent, Salaries & Utilities</div>
        </div>

        <div className={`p-5 rounded-sm border ${
          isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-[#090b0e] border-zinc-800 text-white'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase opacity-70">
            <span>Worker Salaries Total</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="mt-2.5 text-2xl font-black">₹{formatMoney(stats.salariesTotal)}</div>
          <div className="mt-1 text-[11.5px] opacity-70 font-medium">Staff compensation & payouts</div>
        </div>

        <div className={`p-5 rounded-sm border ${
          isLight ? 'bg-zinc-50 border-zinc-200 text-black' : 'bg-[#090b0e] border-zinc-800 text-white'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase opacity-70">
            <span>Shop Rent Total</span>
            <Building2 className="h-4 w-4" />
          </div>
          <div className="mt-2.5 text-2xl font-black">₹{formatMoney(stats.rentTotal)}</div>
          <div className="mt-1 text-[11.5px] opacity-70 font-medium">Premises lease & maintenance</div>
        </div>
      </div>

      {/* Quick Setup Shortcuts for Shopkeeper */}
      <div className={`p-4 rounded-sm border flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold">
          <Sparkles className="h-4 w-4" />
          <span>Quick Add Recurring Monthly Expenses:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => openAddModal('Shop Rent', true)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition ${
              isLight ? 'border-zinc-300 bg-white hover:bg-zinc-100 text-black' : 'border-zinc-700 bg-black hover:bg-zinc-900 text-white'
            }`}
          >
            + Set Shop Rent
          </button>
          <button
            type="button"
            onClick={() => openAddModal('Worker Salaries', true)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition ${
              isLight ? 'border-zinc-300 bg-white hover:bg-zinc-100 text-black' : 'border-zinc-700 bg-black hover:bg-zinc-900 text-white'
            }`}
          >
            + Set Worker Salary
          </button>
          <button
            type="button"
            onClick={() => openAddModal('Electricity & Utilities', true)}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition ${
              isLight ? 'border-zinc-300 bg-white hover:bg-zinc-100 text-black' : 'border-zinc-700 bg-black hover:bg-zinc-900 text-white'
            }`}
          >
            + Set Electricity / WiFi
          </button>
        </div>
      </div>

      {/* Main Expense Table & Filtering Control Center */}
      <div className={`p-5 rounded-sm border space-y-4 ${
        isLight ? 'bg-white border-zinc-200' : 'bg-[#090b0e] border-zinc-800'
      }`}>
        {/* Search, Tab Filters & Category Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 border-zinc-200 dark:border-zinc-800">
          {/* Main Tabs */}
          <div className={`p-1 rounded-sm border flex items-center gap-1 flex-wrap ${
            isLight ? 'bg-zinc-100 border-zinc-300' : 'bg-black border-zinc-800'
          }`}>
            {[
              { id: 'all', label: `All Expenses (${expenses.length})` },
              { id: 'monthly_fixed', label: `Monthly Recurring (${expenses.filter((e) => e.isRecurringMonthly).length})` },
              { id: 'one_time', label: `Daily / Operational (${expenses.filter((e) => !e.isRecurringMonthly).length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-extrabold transition ${
                  activeTab === t.id
                    ? (isLight ? 'bg-black text-white shadow-xs' : 'bg-white text-black shadow-xs')
                    : (isLight ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white')
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Bar & Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input - Sharp Edges */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expense, worker, category..."
                className={`h-10 w-full rounded-sm border pl-9 pr-3 text-xs font-bold outline-none transition ${
                  isLight
                    ? 'border-zinc-300 bg-white text-black focus:border-black'
                    : 'border-zinc-800 bg-black text-white focus:border-white'
                }`}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`h-10 rounded-sm border px-3 text-xs font-bold outline-none ${
                isLight ? 'border-zinc-300 bg-white text-black' : 'border-zinc-800 bg-black text-white'
              }`}
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Month Filter */}
            {availableMonths.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`h-10 rounded-sm border px-3 text-xs font-bold outline-none ${
                  isLight ? 'border-zinc-300 bg-white text-black' : 'border-zinc-800 bg-black text-white'
                }`}
              >
                <option value="all">All Months</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Expenses List / Table */}
        <div className="space-y-2.5">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense, idx) => (
              <div
                key={expense.id || idx}
                className={`p-4 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isLight
                    ? 'border-zinc-200 bg-white text-black hover:border-zinc-400'
                    : 'border-zinc-800/90 bg-black text-white hover:border-zinc-700'
                }`}
              >
                {/* Left Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black">{expense.title}</span>
                    <span className={`px-2 py-0.5 rounded-sm text-[10.5px] font-bold border ${
                      isLight ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-800 bg-zinc-900 text-white'
                    }`}>
                      {expense.category}
                    </span>
                    {expense.isRecurringMonthly && (
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-extrabold border ${
                        isLight ? 'border-black bg-black text-white' : 'border-white bg-white text-black'
                      }`}>
                        Monthly Due (Day {expense.recurringDay || 1})
                      </span>
                    )}
                    {expense.paymentMode && (
                      <span className="text-[11px] font-semibold opacity-60 uppercase">
                        via {expense.paymentMode.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-medium opacity-75 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(expense.date || expense.createdAt || new Date().toISOString())}
                    </span>
                    {expense.payeeName && (
                      <span>• Payee/Worker: <strong>{expense.payeeName}</strong></span>
                    )}
                    {expense.notes && (
                      <span>• Note: <em>{expense.notes}</em></span>
                    )}
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-900">
                  <div className="text-right">
                    <div className="text-xl font-black">₹{formatMoney(Number(expense.amount || 0))}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(expense)}
                      title="Edit expense"
                      className={`p-2 rounded-sm border text-xs font-bold transition ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-50 hover:bg-zinc-200 text-black'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white'
                      }`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(expense.id)}
                      title="Delete expense"
                      className={`p-2 rounded-sm border text-xs font-bold transition ${
                        isLight
                          ? 'border-zinc-300 bg-zinc-50 hover:bg-red-50 text-red-600 hover:border-red-300'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-red-950/30 text-red-400 hover:border-red-900'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`p-8 text-center rounded-sm border space-y-2 ${
              isLight ? 'border-zinc-200 bg-zinc-50 text-zinc-500' : 'border-zinc-800 bg-black text-zinc-400'
            }`}>
              <Receipt className="h-8 w-8 mx-auto opacity-40" />
              <div className="font-bold text-sm">No expenses found matching your criteria.</div>
              <p className="text-xs max-w-sm mx-auto">
                Click <strong>"Add New Expense"</strong> or <strong>"Quick Add Recurring"</strong> to record shop rent, salaries, or daily spending.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT EXPENSE MODAL - Sharp Edges */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`w-full max-w-lg rounded-sm border p-6 space-y-5 shadow-2xl ${
                isLight ? 'bg-white border-zinc-300 text-black' : 'bg-zinc-950 border-zinc-700 text-white'
              }`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <h3 className="text-lg font-black">
                    {editingExpense ? 'Edit Expense Entry' : 'Record New Expense'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-sm hover:opacity-70 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Expense Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-70">Expense Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shop Rent for August, Ramesh (Cashier Salary), Packaging boxes"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`h-11 w-full rounded-sm border px-3 text-sm font-bold outline-none ${
                      isLight ? 'border-zinc-300 bg-zinc-50 focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                    }`}
                  />
                </div>

                {/* Amount & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="e.g. 15000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`h-11 w-full rounded-sm border px-3 text-sm font-black outline-none ${
                        isLight ? 'border-zinc-300 bg-zinc-50 focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`h-11 w-full rounded-sm border px-3 text-xs font-bold outline-none ${
                        isLight ? 'border-zinc-300 bg-zinc-50 focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                      }`}
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Payment Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`h-11 w-full rounded-sm border px-3 text-xs font-bold outline-none ${
                        isLight ? 'border-zinc-300 bg-zinc-50 focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">Payment Mode</label>
                    <select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                      className={`h-11 w-full rounded-sm border px-3 text-xs font-bold outline-none ${
                        isLight ? 'border-zinc-300 bg-zinc-50 focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                      }`}
                    >
                      <option value="cash">Cash Tender</option>
                      <option value="upi">UPI / QR Scan</option>
                      <option value="bank_transfer">Bank Transfer / NEFT</option>
                      <option value="card">Card Payment</option>
                    </select>
                  </div>
                </div>

                {/* Worker / Payee Name & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">Payee / Worker Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Landlord name, Worker name, Vendor"
                      value={formData.payeeName}
                      onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                      className={`h-11 w-full rounded-sm border px-3 text-xs font-bold outline-none ${
                        isLight ? 'border-zinc-300 bg-zinc-50 focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">Notes / Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. Receipt #, Cheque #, Month note"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className={`h-11 w-full rounded-sm border px-3 text-xs font-bold outline-none ${
                        isLight ? 'border-zinc-300 bg-zinc-50 focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Monthly Recurring Toggle */}
                <div className={`p-3.5 rounded-sm border flex items-center justify-between gap-3 ${
                  isLight ? 'bg-zinc-50 border-zinc-300' : 'bg-black border-zinc-800'
                }`}>
                  <div>
                    <div className="text-xs font-extrabold">Monthly Recurring Expense</div>
                    <div className="text-[11px] opacity-70">Auto-include in fixed monthly commitments (Shop Rent, Salaries, Bills)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isRecurringMonthly}
                    onChange={(e) => setFormData({ ...formData, isRecurringMonthly: e.target.checked })}
                    className="h-5 w-5 rounded-none cursor-pointer"
                  />
                </div>

                {formData.isRecurringMonthly && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70">Recurring Due Day of Month (1 - 31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.recurringDay}
                      onChange={(e) => setFormData({ ...formData, recurringDay: e.target.value })}
                      className={`h-11 w-full rounded-sm border px-3 text-xs font-bold outline-none ${
                        isLight ? 'border-zinc-300 bg-zinc-50 focus:border-black' : 'border-zinc-700 bg-black focus:border-white'
                      }`}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={`px-4 py-2.5 rounded-sm text-xs font-bold border transition ${
                      isLight ? 'border-zinc-300 hover:bg-zinc-100 text-black' : 'border-zinc-700 hover:bg-zinc-900 text-white'
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-sm text-xs font-extrabold border transition shadow-sm ${
                      isLight
                        ? 'border-black bg-black text-white hover:bg-zinc-800'
                        : 'border-white bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    {isSubmitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Record Expense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
