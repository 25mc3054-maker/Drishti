"use client";

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Boxes,
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
  icon: typeof ReceiptText;
};

interface CosmicNavbarProps {
  activeSection: BusinessSectionKey;
  onSectionChange: (section: BusinessSectionKey) => void;
  isLight?: boolean;
  theme?: 'light' | 'dark';
}

export function CosmicNavbar({ activeSection, isLight: propIsLight, onSectionChange, theme }: CosmicNavbarProps) {
  const isLight = propIsLight ?? theme === 'light';
  const [isOpen, setIsOpen] = useState(false);

  const navItems = useMemo<NavItem[]>(() => [
    { key: 'billing', label: 'Billing', icon: HandCoins },
    { key: 'stock', label: 'Stock', icon: Boxes },
    { key: 'invoices', label: 'Invoice', icon: ReceiptText },
    { key: 'customers', label: 'Customer', icon: Users },
    { key: 'suppliers', label: 'Supplier', icon: Truck },
    { key: 'marketing', label: 'Marketing', icon: Sparkles },
    { key: 'expenses', label: 'Expenses', icon: CreditCard },
  ], []);

  const selectSection = (section: BusinessSectionKey) => {
    onSectionChange(section);
    setIsOpen(false);
  };

  return (
    <div className="relative z-20 w-full">
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`relative overflow-hidden rounded-2xl md:rounded-full border p-1.5 ${
          isLight
            ? 'border-zinc-200 bg-white text-black shadow-md'
            : 'border-zinc-800 bg-black text-white shadow-xl'
        }`}
      >
        <div className="relative flex items-center justify-between gap-2 px-1">
          {/* Mobile Menu Dropdown Toggle Button */}
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition lg:hidden touch-manipulation min-h-[36px] ${
              isLight
                ? 'border-zinc-200 bg-white text-black hover:bg-zinc-100'
                : 'border-zinc-800 bg-black text-white hover:bg-zinc-900'
            }`}
            aria-label="Toggle business suite section menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          {/* Horizontal Scroll-Free Nav Bar for all 7 items */}
          <div className={`flex w-full flex-1 items-center justify-between gap-0.5 rounded-full p-0.5 ${
            isLight ? 'bg-white' : 'bg-black'
          }`}>
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

      {/* Mobile Dropdown Popup Menu */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 6, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`absolute left-0 right-0 top-full z-30 grid gap-1.5 rounded-2xl border p-2.5 shadow-2xl sm:grid-cols-2 lg:hidden ${
              isLight
                ? 'border-zinc-200 bg-white text-black shadow-zinc-200/80'
                : 'border-zinc-800 bg-black text-white shadow-2xl'
            }`}
          >
            {navItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                isActive={item.key === activeSection}
                onClick={() => selectSection(item.key)}
                isLight={isLight}
                mobile
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ isActive, isLight, item, mobile, onClick }: { isActive: boolean; isLight?: boolean; item: NavItem; mobile?: boolean; onClick: () => void }) {
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex h-9 items-center gap-1.5 overflow-hidden rounded-full px-2.5 sm:px-3 text-left transition border-0 ${
        mobile ? 'justify-between w-full' : 'flex-1 justify-center'
      } ${
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
              ? 'bg-black text-white border-black'
              : 'bg-zinc-800 text-white border-zinc-700/60'
          }`}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
      ) : (
        <span className={`absolute inset-0 rounded-full opacity-0 transition group-hover:opacity-100 ${
          isLight ? 'bg-zinc-100' : 'bg-zinc-900/40'
        }`} />
      )}
      <span className="relative flex items-center gap-1.5 shrink-0">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${
          isActive
            ? 'text-white'
            : isLight
              ? 'text-zinc-500 group-hover:text-black'
              : 'text-zinc-400 group-hover:text-white'
        }`} />
        <span className="whitespace-nowrap text-[12px] xl:text-[12.5px] font-bold">{item.label}</span>
      </span>
    </motion.button>
  );
}
