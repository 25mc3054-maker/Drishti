"use client";

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Boxes,
  ChevronDown,
  CreditCard,
  HandCoins,
  Menu,
  ReceiptText,
  Sparkles,
  Truck,
  Users,
  X,
} from 'lucide-react';
import type { BusinessSectionKey } from './types';

type NavItem = {
  key: BusinessSectionKey;
  label: string;
  desc: string;
  icon: typeof ReceiptText;
};

interface CosmicNavbarProps {
  activeSection: BusinessSectionKey;
  onSectionChange: (section: BusinessSectionKey) => void;
  isLight?: boolean;
  theme?: 'dark' | 'light';
}

export function CosmicNavbar({ activeSection, isLight: propIsLight, onSectionChange, theme }: CosmicNavbarProps) {
  const isLight = propIsLight ?? theme === 'light';
  const [isOpen, setIsOpen] = useState(false);

  const navItems = useMemo<NavItem[]>(() => [
    { key: 'billing', label: 'Billing', desc: 'POS Checkout & Receipts', icon: HandCoins },
    { key: 'stock', label: 'Stock', desc: 'Inventory Control & Alerts', icon: Boxes },
    { key: 'invoices', label: 'Invoice', desc: 'Billing History & PDFs', icon: ReceiptText },
    { key: 'customers', label: 'Customer', desc: 'Ledger & Digital Khata', icon: Users },
    { key: 'suppliers', label: 'Supplier', desc: 'Vendors & Reorders', icon: Truck },
    { key: 'marketing', label: 'Marketing', desc: 'AI Promo Posters', icon: Sparkles },
    { key: 'expenses', label: 'Expenses', desc: 'Outflow Tracker', icon: CreditCard },
  ], []);

  const activeItem = navItems.find((item) => item.key === activeSection) || navItems[0];

  const selectSection = (section: BusinessSectionKey) => {
    onSectionChange(section);
    setIsOpen(false);
  };

  return (
    <div className="relative z-20 w-full">
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`relative rounded-2xl md:rounded-full border p-1 sm:p-1.5 transition-colors shadow-lg ${
          isLight
            ? 'border-zinc-200 bg-white text-black shadow-zinc-200/50'
            : 'border-zinc-800 bg-zinc-950 text-white shadow-black/80'
        }`}
      >
        <div className="flex items-center gap-1.5 w-full">
          {/* Mobile Module Quick Select Dropdown Pill (lg:hidden) */}
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold border transition-all lg:hidden touch-manipulation min-h-[36px] ${
              isLight
                ? 'border-zinc-300 bg-zinc-100 text-black hover:bg-zinc-200'
                : 'border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
            aria-label="Select Business Suite Module"
            aria-expanded={isOpen}
          >
            <Menu className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <span className="truncate max-w-[85px] font-bold">{activeItem.label}</span>
            <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Vertical Divider line on Mobile */}
          <div className="h-5 w-px shrink-0 bg-zinc-800/80 lg:hidden" />

          {/* Horizontally Scrollable Segment Chips Track (Phone & Desktop) */}
          <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none scroll-smooth py-0.5 px-0.5">
            {navItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                isActive={item.key === activeSection}
                onClick={() => selectSection(item.key)}
                isLight={isLight}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Mobile Drawer Popup Grid Overlay */}
      <AnimatePresence>
        {isOpen ? (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 8, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`absolute left-0 right-0 top-full z-40 grid gap-2 rounded-2xl border p-3.5 shadow-2xl sm:grid-cols-2 lg:hidden ${
                isLight
                  ? 'border-zinc-200 bg-white text-black shadow-zinc-300/90'
                  : 'border-zinc-800 bg-zinc-950 text-white shadow-2xl shadow-black'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2 px-1 border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Business Suite Modules</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[65vh] overflow-y-auto pr-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.key === activeSection;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => selectSection(item.key)}
                      className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all touch-manipulation border ${
                        isActive
                          ? isLight
                            ? 'border-black bg-black text-white font-bold shadow-md'
                            : 'border-zinc-700 bg-zinc-900 text-white font-bold shadow-lg shadow-black'
                          : isLight
                            ? 'border-zinc-100 bg-zinc-50 text-zinc-800 hover:bg-zinc-100'
                            : 'border-zinc-900 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isLight ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold truncate">{item.label}</div>
                        <div className={`text-[11px] truncate ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ isActive, isLight, item, onClick }: { isActive: boolean; isLight?: boolean; item: NavItem; onClick: () => void }) {
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative flex h-8.5 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-left transition border-0 ${
        isActive
          ? 'text-white font-bold'
          : isLight
            ? 'text-zinc-600 hover:text-black'
            : 'text-zinc-400 hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive ? (
        <motion.span
          layoutId="business-suite-active-nav"
          className={`absolute inset-0 rounded-full border ${
            isLight
              ? 'bg-black text-white border-black shadow-md'
              : 'bg-zinc-800 text-white border-zinc-700/80 shadow-md shadow-white/5'
          }`}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
      ) : (
        <span className={`absolute inset-0 rounded-full opacity-0 transition group-hover:opacity-100 ${
          isLight ? 'bg-zinc-100' : 'bg-zinc-900/60'
        }`} />
      )}
      <span className="relative flex items-center gap-1.5 shrink-0 z-10 whitespace-nowrap">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${
          isActive
            ? 'text-white'
            : isLight
              ? 'text-zinc-500 group-hover:text-black'
              : 'text-zinc-400 group-hover:text-white'
        }`} />
        <span className="whitespace-nowrap text-[12px] font-bold">{item.label}</span>
      </span>
    </motion.button>
  );
}
