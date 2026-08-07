"use client"

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, ChevronDown, Fingerprint, LogOut, Mail, Phone, ShieldCheck, UserCircle } from 'lucide-react';
import type { TabKey } from './types';

const tabs: { id: TabKey; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'business-suite', label: 'Business Suite' },
  { id: 'database-management', label: 'Databases' },
  { id: 'ai-workspace', label: 'AI Workspace' },
  { id: 'storefront', label: 'Storefront' },
  { id: 'insights', label: 'Insights' },
  { id: 'saas-admin', label: 'Admin' },
];

interface NavbarProps {
  activeTab: TabKey;
  profileUser?: {
    id?: string;
    tenantId?: string;
    name?: string;
    shopName?: string;
    mobile?: string;
    email?: string;
    role?: string;
  };
  shopName?: string;
  onTabChange: (tab: TabKey) => void;
  onLogout?: () => void;
}

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function Navbar({ activeTab, onLogout, onTabChange, profileUser, shopName }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const displayName = profileUser?.name || 'Profile owner';
  const displayShop = profileUser?.shopName || shopName || 'Shop workspace';

  return (
    <header
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm"
    >
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-4 md:px-8">
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className="flex items-center gap-3 text-foreground"
          aria-label="EasyTrader home"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm">
            <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#FF9C2A] via-white to-[#3BA8FF] shadow-[0_0_24px_rgba(59,168,255,0.55)]" />
          </span>
          <span className="text-[15px] font-semibold uppercase tracking-[0.24em]">EasyTrader</span>
        </button>

        <nav
          className="flex max-w-[calc(100vw-130px)] sm:max-w-none items-center gap-1 overflow-x-auto rounded-full border border-border bg-card/50 p-1 shadow-sm backdrop-blur-2xl scrollbar-none md:flex"
          aria-label="Primary navigation"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-[12px] md:px-3.5 md:py-2.5 md:text-[13px] font-medium transition-colors ${active ? 'text-active-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                aria-pressed={active}
              >
                {active ? (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full border border-active-foreground/10 bg-active-background"
                  />
                ) : null}
                <span className="relative z-10">{tab.label}</span>
                {active ? (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-x-5 bottom-1 h-px bg-gradient-to-r from-transparent via-active-foreground to-transparent"
                  />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsProfileOpen((current) => !current)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card/50 px-2.5 pr-3 text-foreground shadow-sm transition hover:border-border/80 hover:bg-card/80"
            aria-expanded={isProfileOpen}
            aria-label="Open profile details"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/45">
              <UserCircle className="h-4 w-4 text-primary" />
            </span>
            <span className="hidden max-w-[130px] truncate text-[12px] font-semibold text-muted-foreground md:inline">{displayName}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/50 text-muted-foreground transition hover:text-foreground"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : null}

          <AnimatePresence>
            {isProfileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute right-0 top-12 w-[min(92vw,360px)] overflow-hidden rounded-[8px] border border-border bg-card p-4 shadow-lg"
              >
                <div className="flex items-start gap-3 border-b border-border pb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                    <UserCircle className="h-6 w-6 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-semibold text-foreground">{displayName}</div>
                    <div className="mt-1 truncate text-[12px] text-muted-foreground">{displayShop}</div>
                    <div className="mt-2 inline-flex rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-emerald-100">
                      {profileUser?.role || 'admin'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="w-full flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-[11px] uppercase tracking-normal text-muted-foreground">Theme</span>
                    </div>
                    <span className="truncate text-right text-[12px] font-semibold text-foreground capitalize">{theme}</span>
                  </button>
                  <ProfileLine icon={Building2} label="Shop" value={displayShop} />
                  <ProfileLine icon={Mail} label="Email" value={profileUser?.email || 'Not added'} />
                  <ProfileLine icon={Phone} label="Mobile" value={profileUser?.mobile || 'Not added'} />
                  <ProfileLine icon={ShieldCheck} label="Role" value={profileUser?.role || 'admin'} />
                  <ProfileLine icon={Fingerprint} label="Tenant ID" value={profileUser?.tenantId || 'Not available'} />
                  <ProfileLine icon={Fingerprint} label="User ID" value={profileUser?.id || 'Not available'} />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function ProfileLine({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[28px_82px_minmax(0,1fr)] items-center gap-2 rounded-[8px] border border-border bg-card/50 px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-[11px] uppercase tracking-normal text-muted-foreground">{label}</span>
      <span className="truncate text-right text-[12px] font-semibold text-foreground" title={value}>{value}</span>
    </div>
  );
}
