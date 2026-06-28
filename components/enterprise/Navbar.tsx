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

export function Navbar({ activeTab, onLogout, onTabChange, profileUser, shopName }: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const displayName = profileUser?.name || 'Profile owner';
  const displayShop = profileUser?.shopName || shopName || 'Shop workspace';

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.82), rgba(0,0,0,0.18))', backdropFilter: 'blur(18px)' }}
    >
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-4 md:px-8">
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className="flex items-center gap-3 text-white"
          aria-label="EasyTrader home"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#FF9C2A] via-white to-[#3BA8FF] shadow-[0_0_24px_rgba(59,168,255,0.55)]" />
          </span>
          <span className="text-[15px] font-semibold uppercase tracking-[0.24em]">EasyTrader</span>
        </button>

        <nav
          className="hidden items-center gap-1 rounded-full border border-white/14 bg-white/[0.055] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_50px_rgba(0,0,0,0.26)] backdrop-blur-2xl md:flex"
          aria-label="Primary navigation"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative rounded-full px-3.5 py-2.5 text-[13px] font-medium transition-colors ${active ? 'text-white' : 'text-white/55 hover:text-white'}`}
                aria-pressed={active}
              >
                {active ? (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full border border-white/12 bg-white/[0.09] shadow-[0_0_28px_rgba(59,130,246,0.18)]"
                  />
                ) : null}
                <span className="relative z-10">{tab.label}</span>
                {active ? (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-x-5 bottom-1 h-px bg-gradient-to-r from-transparent via-[#78B7FF] to-transparent"
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
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/14 bg-white/[0.055] px-2.5 pr-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_30px_rgba(59,168,255,0.12)] transition hover:border-white/28 hover:bg-white/10"
            aria-expanded={isProfileOpen}
            aria-label="Open profile details"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/14 bg-black/45">
              <UserCircle className="h-4 w-4 text-[#78B7FF]" />
            </span>
            <span className="hidden max-w-[130px] truncate text-[12px] font-semibold text-white/72 md:inline">{displayName}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-white/52 transition ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-white/[0.055] text-white/62 transition hover:text-white"
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
                className="absolute right-0 top-12 w-[min(92vw,360px)] overflow-hidden rounded-[8px] border border-white/12 bg-[#05070A] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.58)]"
              >
                <div className="flex items-start gap-3 border-b border-white/10 pb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.07]">
                    <UserCircle className="h-6 w-6 text-[#78B7FF]" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-semibold text-white">{displayName}</div>
                    <div className="mt-1 truncate text-[12px] text-white/48">{displayShop}</div>
                    <div className="mt-2 inline-flex rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold capitalize text-emerald-100">
                      {profileUser?.role || 'admin'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
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
    <div className="grid grid-cols-[28px_82px_minmax(0,1fr)] items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.035] px-3 py-2">
      <Icon className="h-4 w-4 text-white/42" />
      <span className="text-[11px] uppercase tracking-normal text-white/34">{label}</span>
      <span className="truncate text-right text-[12px] font-semibold text-white/72" title={value}>{value}</span>
    </div>
  );
}
