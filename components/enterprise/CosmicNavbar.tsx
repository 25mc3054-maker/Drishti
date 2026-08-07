"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  CreditCard,
  HandCoins,
  ReceiptText,
  Sparkles,
  Truck,
  Users,
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

  const navItems = useMemo<NavItem[]>(() => [
    { key: 'billing', label: 'Billing', desc: 'POS Checkout & Receipts', icon: HandCoins },
    { key: 'stock', label: 'Stock', desc: 'Inventory Control & Alerts', icon: Boxes },
    { key: 'invoices', label: 'Invoice', desc: 'Billing History & PDFs', icon: ReceiptText },
    { key: 'customers', label: 'Customer', desc: 'Ledger & Digital Khata', icon: Users },
    { key: 'suppliers', label: 'Supplier', desc: 'Vendors & Reorders', icon: Truck },
    { key: 'marketing', label: 'Marketing', desc: 'AI Promo Posters', icon: Sparkles },
    { key: 'expenses', label: 'Expenses', desc: 'Outflow Tracker', icon: CreditCard },
  ], []);

  return (
    <div className="relative z-20 w-full flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`relative w-full lg:w-auto lg:max-w-fit rounded-full border p-1 sm:p-1.5 transition-colors shadow-lg ${
          isLight
            ? 'border-zinc-200 bg-white text-black shadow-zinc-200/50'
            : 'border-zinc-800 bg-zinc-950 text-white shadow-black/80'
        }`}
      >
        {/* Touch-Scrollable Chips Track on Phone, Centered Floating Dock Capsule on Laptop */}
        <div className="flex w-full items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none scroll-smooth py-0.5 px-0.5 lg:overflow-visible">
          {navItems.map((item) => (
            <NavButton
              key={item.key}
              item={item}
              isActive={item.key === activeSection}
              onClick={() => onSectionChange(item.key)}
              isLight={isLight}
            />
          ))}
        </div>
      </motion.div>
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
      className={`group relative flex h-9 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-center transition border-0 ${
        isActive
          ? 'text-white font-extrabold'
          : isLight
            ? 'text-zinc-600 hover:text-black font-bold'
            : 'text-zinc-400 hover:text-white font-bold'
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
      <span className="relative flex items-center justify-center gap-2 shrink-0 z-10 whitespace-nowrap">
        <Icon className={`h-4 w-4 shrink-0 ${
          isActive
            ? 'text-white'
            : isLight
              ? 'text-zinc-500 group-hover:text-black'
              : 'text-zinc-400 group-hover:text-white'
        }`} />
        <span className="whitespace-nowrap text-[12.5px] font-extrabold tracking-tight">{item.label}</span>
      </span>
    </motion.button>
  );
}
