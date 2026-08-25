"use client"

import { motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  Building2,
  Database,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  ShoppingBag,
} from 'lucide-react';
import type { TabKey } from './types';

interface LeftMiniSidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  isOpen: boolean;
  theme?: 'dark' | 'light';
}

const menuItems: { id: TabKey; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'business-suite', label: 'Business Suite', icon: Building2 },
  { id: 'database-management', label: 'Databases', icon: Database },
  { id: 'ai-workspace', label: 'AI Workspace', icon: Bot },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'saas-admin', label: 'Admin', icon: ShieldAlert },
];

export function LeftMiniSidebar({
  activeTab,
  isOpen,
  onTabChange,
  theme = 'dark',
}: LeftMiniSidebarProps) {
  const isLight = theme === 'light';

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Semi-Transparent Backdrop (visible < md) */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        onClick={() => onTabChange(activeTab)}
        aria-hidden="true"
      />

      <motion.aside
        initial={{ x: -260, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -260, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col justify-between overflow-y-auto p-4 transition-colors duration-200 shadow-2xl md:sticky md:top-[65px] md:z-40 md:h-[calc(100vh-65px)] md:w-60 md:shadow-none ${
          isLight
            ? 'bg-white text-black border-r border-zinc-200/80 md:border-r'
            : 'bg-black text-white border-r border-zinc-800 md:border-r'
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="space-y-6 pt-2 md:pt-0">
          <div className="flex items-center justify-between px-2 md:block">
            <div className={`text-[11px] font-semibold uppercase tracking-wider ${
              isLight ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              Navigation Menu
            </div>
          </div>
          <div className="mt-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] md:text-[13.5px] font-semibold transition-all touch-manipulation min-h-[44px] ${
                    active
                      ? isLight
                        ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                        : 'border border-zinc-800 bg-zinc-900 text-white font-semibold'
                      : isLight
                        ? 'text-zinc-600 hover:bg-zinc-100/70 hover:text-black'
                        : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${
                      active
                        ? isLight ? 'text-black' : 'text-white'
                        : isLight ? 'text-zinc-400 group-hover:text-black' : 'text-zinc-500 group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="mini-sidebar-indicator"
                      className={`ml-auto h-2 w-2 rounded-full ${
                        isLight ? 'bg-black' : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pinned Settings Tab at the Bottom of Navbar/Sidebar Menu */}
        <div className={`mt-auto pt-3 border-t ${
          isLight ? 'border-zinc-200/80' : 'border-zinc-800'
        }`}>
          <button
            type="button"
            onClick={() => onTabChange('settings')}
            className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] md:text-[13.5px] font-semibold transition-all touch-manipulation min-h-[44px] ${
              activeTab === 'settings'
                ? isLight
                  ? 'bg-zinc-100 text-black font-semibold shadow-sm'
                  : 'border border-zinc-800 bg-zinc-900 text-white font-semibold'
                : isLight
                  ? 'text-zinc-600 hover:bg-zinc-100/70 hover:text-black'
                  : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
            }`}
          >
            <Settings
              className={`h-5 w-5 shrink-0 transition-transform group-hover:rotate-45 ${
                activeTab === 'settings'
                  ? isLight ? 'text-black' : 'text-white'
                  : isLight ? 'text-zinc-400 group-hover:text-black' : 'text-zinc-500 group-hover:text-white'
              }`}
            />
            <span className="truncate">Settings</span>
            {activeTab === 'settings' && (
              <motion.span
                layoutId="mini-sidebar-indicator"
                className={`ml-auto h-2 w-2 rounded-full ${
                  isLight ? 'bg-black' : 'bg-white'
                }`}
              />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

