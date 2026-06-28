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
}

export function CosmicNavbar({ activeSection, onSectionChange }: CosmicNavbarProps) {
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
    <div className="relative z-20">
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[8px] border border-white/12 bg-[#05070A]/78 shadow-[0_24px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
      >
        <motion.div
          aria-hidden
          className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.11),transparent)]"
          animate={{ x: ['-120%', '240%'] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,156,42,0.22),transparent_34%),radial-gradient(circle_at_86%_15%,rgba(59,168,255,0.20),transparent_34%)]" />

        <div className="relative flex min-h-[74px] items-center gap-3 p-2.5">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-white/12 bg-white/[0.065] text-white transition hover:border-white/25 hover:bg-white/[0.11] lg:hidden"
            aria-label="Toggle business suite navigation"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden min-w-0 flex-1 items-center justify-between gap-1.5 overflow-x-auto rounded-[8px] border border-white/8 bg-black/28 p-1.5 lg:flex">
            {navItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                isActive={item.key === activeSection}
                onClick={() => selectSection(item.key)}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full z-30 grid gap-2 rounded-[8px] border border-white/12 bg-[#05070A]/96 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:grid-cols-2 lg:hidden"
          >
            {navItems.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                isActive={item.key === activeSection}
                onClick={() => selectSection(item.key)}
                mobile
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ isActive, item, mobile, onClick }: { isActive: boolean; item: NavItem; mobile?: boolean; onClick: () => void }) {
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex h-12 items-center gap-2 overflow-hidden rounded-[8px] px-3 text-left transition ${
        mobile ? 'justify-between' : 'min-w-[126px] flex-1 justify-center'
      } ${isActive ? 'text-white' : 'text-white/54 hover:text-white'}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive ? (
        <motion.span
          layoutId="business-suite-active-nav"
          className="absolute inset-0 rounded-[8px] border border-white/18 bg-white/[0.105] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        />
      ) : (
        <span className="absolute inset-0 rounded-[8px] bg-white/[0.04] opacity-0 transition group-hover:opacity-100" />
      )}
      <span className="relative flex min-w-0 items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#FFB866]' : 'text-white/42 group-hover:text-[#9DCEFF]'}`} />
        <span className="truncate text-[13px] font-semibold">{item.label}</span>
      </span>
    </motion.button>
  );
}
