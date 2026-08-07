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
  desc: string;
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
    { key: 'billing', label: 'Billing', desc: 'POS Desk & Checkout', icon: HandCoins },
    { key: 'stock', label: 'Stock', desc: 'Inventory Management', icon: Boxes },
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
        initial={{ opacity: 0, y: -8, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`relative overflow-hidden rounded-2xl md:rounded-full border p-1 sm:p-1.5 transition-colors ${
          isLight
            ? 'border-zinc-200 bg-white text-black shadow-md'
            : 'border-zinc-800 bg-zinc-950 text-white shadow-xl'
        }`}
      >
        <div className="relative flex items-center gap-1.5 px-0.5">
          {/* Mobile Menu Dropdown Toggle Button */}
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 transition lg:hidden touch-manipulation min-h-[36px] ${
              isLight
                ? 'border-zinc-200 bg-zinc-100 text-black hover:bg-zinc-200'
                : 'border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
            aria-label="Toggle business suite section menu"
            aria-expanded={isOpen}
            title="All Business Suite Sections"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="text-[12px] font-bold lg:hidden flex items-center gap-1">
              <activeItem.icon className="h-3.5 w-3.5 text-blue-400 sm:hidden" />
              <span className="max-w-[70px] truncate sm:max-w-none">{activeItem.label}</span>
            </span>
          </button>

          {/* Horizontal Scrollable Nav Bar for Phone & Desktop */}
          <div className={`flex flex-1 items-center gap-1 overflow-x-auto rounded-full p-0.5 scrollbar-none scroll-smooth ${
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

      {/* Mobile Drawer Popup Grid Menu */}
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
              className={`absolute left-0 right-0 top-full z-40 grid gap-2 rounded-2xl border p-3 shadow-2xl sm:grid-cols-2 lg:hidden ${
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

function NavButton({ isActive, isLight, item, mobile, onClick }: { isActive: boolean; isLight?: boolean; item: NavItem; mobile?: boolean; onClick: () => void }) {
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative flex h-9 shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-3 text-left transition border-0 ${
        mobile ? 'justify-between w-full h-11 px-4' : 'flex-1 justify-center'
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
      <span className="relative flex items-center gap-1.5 shrink-0 z-10">
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
