"use client"

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Fingerprint,
  HandCoins,
  LogOut,
  Mail,
  MoreVertical,
  Moon,
  Pencil,
  Phone,
  ReceiptText,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  Truck,
  UserCircle,
  Users,
} from 'lucide-react';
import type { BusinessSectionKey, TabKey } from './types';
import { CosmicNavbar } from './CosmicNavbar';

const businessSections: { id: BusinessSectionKey; label: string; icon: any }[] = [
  { id: 'billing', label: 'Billing', icon: HandCoins },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'invoices', label: 'Invoice', icon: ReceiptText },
  { id: 'customers', label: 'Customer', icon: Users },
  { id: 'suppliers', label: 'Supplier', icon: Truck },
  { id: 'marketing', label: 'Marketing', icon: Sparkles },
  { id: 'expenses', label: 'Expenses', icon: CreditCard },
];

interface NavbarProps {
  activeTab: TabKey;
  activeBusinessSection?: BusinessSectionKey;
  onBusinessSectionChange?: (section: BusinessSectionKey) => void;
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
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onTabChange: (tab: TabKey) => void;
  onLogout?: () => void;
  onProfileUpdate?: (updatedUser: any) => void;
}

export function Navbar({
  activeBusinessSection = 'billing',
  activeTab,
  isSidebarOpen = true,
  onBusinessSectionChange,
  onLogout,
  onProfileUpdate,
  onTabChange,
  onThemeChange,
  onToggleSidebar,
  profileUser,
  shopName,
  theme = 'dark',
}: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: 'idle' | 'success'; message: string }>({ type: 'idle', message: '' });

  const profileRef = useRef<HTMLDivElement>(null);

  const displayName = profileUser?.name || 'Profile owner';
  const displayShop = profileUser?.shopName || shopName || 'Shop workspace';
  const isLight = theme === 'light';
  const isBusinessSuite = activeTab === 'business-suite';

  const [editForm, setEditForm] = useState({
    name: profileUser?.name || '',
    shopName: profileUser?.shopName || shopName || '',
    email: profileUser?.email || '',
    mobile: profileUser?.mobile || '',
    role: profileUser?.role || 'admin',
  });

  useEffect(() => {
    setEditForm({
      name: profileUser?.name || '',
      shopName: profileUser?.shopName || shopName || '',
      email: profileUser?.email || '',
      mobile: profileUser?.mobile || '',
      role: profileUser?.role || 'admin',
    });
  }, [profileUser, shopName]);

  // Auto-close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsEditingProfile(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Auto-close profile dropdown on tab or business section change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsEditingProfile(false);
  }, [activeTab, activeBusinessSection]);

  const handleSaveProfile = () => {
    const updated = {
      ...profileUser,
      name: editForm.name,
      shopName: editForm.shopName,
      email: editForm.email,
      mobile: editForm.mobile,
      role: editForm.role,
    };
    onProfileUpdate?.(updated);
    setIsEditingProfile(false);
    setProfileStatus({ type: 'success', message: 'Profile updated!' });
    setTimeout(() => setProfileStatus({ type: 'idle', message: '' }), 3000);
  };

  const handleNavTabClick = (tab: TabKey) => {
    setIsProfileOpen(false);
    onTabChange(tab);
  };

  const handleBusinessSectionClick = (secId: BusinessSectionKey) => {
    setIsProfileOpen(false);
    if (!isBusinessSuite) onTabChange('business-suite');
    onBusinessSectionChange?.(secId);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        isLight
          ? 'bg-white text-black border-b border-zinc-100'
          : 'bg-black text-white border-b border-zinc-900'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-3 py-2.5 md:px-6 md:py-3">
        {/* Left Section: Three-Dots Menu Toggle (Visible on ALL pages EXCEPT Overview) + Logo */}
        <div className="flex items-center gap-2.5">
          {activeTab !== 'overview' && (
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                onToggleSidebar?.();
              }}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border-0 transition-all touch-manipulation ${
                isLight
                  ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-black'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              } ${isSidebarOpen ? (isLight ? 'ring-2 ring-black/10' : 'ring-2 ring-white/10') : ''}`}
              title="Toggle Left Navigation Menu"
              aria-label="Toggle Navigation Menu Sidebar"
            >
              <MoreVertical className="h-5 w-5 transition-transform group-hover:scale-105" />
              <span className="sr-only">Toggle Navigation Menu</span>
            </button>
          )}

          {/* EasyTrader Logo */}
          <button
            type="button"
            onClick={() => handleNavTabClick('business-suite')}
            className="flex items-center gap-2.5 text-left focus:outline-none touch-manipulation min-h-[40px] px-1"
            aria-label="EasyTrader home"
          >
            <span className={`relative flex h-9 w-9 items-center justify-center rounded-full ${
              isLight ? 'bg-black text-white' : 'bg-white text-black'
            }`}>
              <span className="text-[13px] font-black tracking-tight">ET</span>
            </span>
            <span className={`text-[15px] font-bold tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
              EASYTRADER
            </span>
          </button>
        </div>

        {/* Middle Section: CosmicNavbar (Billing, Stock, Invoice, Customer, Supplier, Marketing, Expenses) */}
        {isBusinessSuite && (
          <div className="hidden lg:flex flex-1 items-center justify-center max-w-4xl mx-2">
            <CosmicNavbar
              activeSection={activeBusinessSection || 'billing'}
              onSectionChange={(sec) => handleBusinessSectionClick(sec)}
              isLight={isLight}
            />
          </div>
        )}

        {/* Right Section: Profile Trigger Container (Fixed in Top Right on Mobile, Laptop & Desktop) */}
        <div ref={profileRef} className="relative flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsProfileOpen((current) => !current)}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-bold transition-all border-0 touch-manipulation ${
                isLight
                  ? 'bg-zinc-900 text-white hover:bg-black'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
              aria-expanded={isProfileOpen}
              aria-label={`Open profile for ${displayName}`}
              title={`Profile (${displayName})`}
            >
              <span className="tracking-tight">{(displayName ? displayName.trim().charAt(0) : 'P').toUpperCase()}</span>
            </button>

            <AnimatePresence>
              {isProfileOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className={`absolute right-0 top-12 z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl p-5 shadow-2xl border ${
                    isLight
                      ? 'border-transparent bg-white text-black shadow-zinc-300/80 ring-1 ring-black/5'
                      : 'border-zinc-900 bg-black text-white shadow-black'
                  }`}
                >
                {/* Profile Modal Header with User Info + Theme Logo Button + Edit Button */}
                <div className={`flex items-start justify-between gap-3 border-b pb-4 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                      isLight ? 'border-transparent bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
                    }`}>
                      <UserCircle className="h-6 w-6 text-current" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold">{displayName}</div>
                      <div className={`mt-0.5 truncate text-[12px] font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{displayShop}</div>
                      <div className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                        isLight ? 'border-transparent bg-zinc-100 text-black' : 'border-zinc-800 bg-black text-white'
                      }`}>
                        {profileUser?.role || 'admin'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* THEME TOGGLE BUTTON */}
                    <button
                      type="button"
                      onClick={() => onThemeChange?.(isLight ? 'dark' : 'light')}
                      className={`group relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-0 transition-all ${
                        isLight
                          ? 'bg-zinc-100 text-black hover:bg-zinc-200'
                          : 'bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                      title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
                      aria-label="Toggle Theme"
                    >
                      {isLight ? (
                        <Sun className="h-4 w-4 transition-transform group-hover:rotate-45" />
                      ) : (
                        <Moon className="h-4 w-4 transition-transform group-hover:-rotate-12" />
                      )}
                    </button>

                    {/* EDIT PROFILE BUTTON */}
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold transition border-0 ${
                        isEditingProfile
                          ? isLight ? 'bg-black text-white' : 'bg-white text-black'
                          : isLight
                            ? 'bg-zinc-100 text-black hover:bg-zinc-200'
                            : 'bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>{isEditingProfile ? 'Cancel' : 'Edit'}</span>
                    </button>
                  </div>
                </div>

                {profileStatus.message ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[12.5px] font-bold text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{profileStatus.message}</span>
                  </div>
                ) : null}

                {/* Profile Details (Read-only vs Editable mode) */}
                {!isEditingProfile ? (
                  <div className="mt-4 space-y-2">
                    <ProfileLine isLight={isLight} icon={UserCircle} label="Name" value={displayName} />
                    <ProfileLine isLight={isLight} icon={Building2} label="Shop" value={displayShop} />
                    <ProfileLine isLight={isLight} icon={Mail} label="Email" value={profileUser?.email || 'Not added'} />
                    <ProfileLine isLight={isLight} icon={Phone} label="Mobile" value={profileUser?.mobile || 'Not added'} />
                    <ProfileLine isLight={isLight} icon={ShieldCheck} label="Role" value={profileUser?.role || 'admin'} />
                    <ProfileLine isLight={isLight} icon={Fingerprint} label="Tenant ID" value={profileUser?.tenantId || 'Not available'} />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <EditProfileInput isLight={isLight} label="Full Name" value={editForm.name} onChange={(val) => setEditForm({ ...editForm, name: val })} />
                    <EditProfileInput isLight={isLight} label="Shop Name" value={editForm.shopName} onChange={(val) => setEditForm({ ...editForm, shopName: val })} />
                    <EditProfileInput isLight={isLight} label="Email" value={editForm.email} onChange={(val) => setEditForm({ ...editForm, email: val })} />
                    <EditProfileInput isLight={isLight} label="Mobile" value={editForm.mobile} onChange={(val) => setEditForm({ ...editForm, mobile: val })} />
                    <div>
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>Role</label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className={`h-9 w-full rounded-xl border px-3 text-[13px] font-bold outline-none ${
                          isLight ? 'border-slate-300 bg-white text-slate-900' : 'border-white/15 bg-black/60 text-white'
                        }`}
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="cashier">Cashier</option>
                      </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-xl border-0 px-4 text-[12.5px] font-bold transition ${
                          isLight ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'
                        }`}
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save Profile
                      </button>
                    </div>
                  </div>
                )}

                {/* LOGOUT OPTION (Inside Profile at Bottom) */}
                {onLogout ? (
                  <div className="mt-4 border-t pt-3 dark:border-white/10 border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-bold transition ${
                        isLight ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' : 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                      }`}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Secondary Confirmation Logout Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`w-full max-w-md overflow-hidden rounded-2xl border p-6 shadow-2xl ${
                isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/15 bg-[#0b0e14] text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className={`text-[18px] font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>Confirm Sign Out</h3>
                  <p className={`mt-0.5 text-[13px] font-medium ${isLight ? 'text-slate-500' : 'text-white/60'}`}>
                    Are you sure you want to log out of EasyTrader?
                  </p>
                </div>
              </div>

              <p className={`mt-4 rounded-xl border p-3.5 text-[12.5px] font-medium leading-5 ${
                isLight ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-white/10 bg-white/[0.035] text-white/70'
              }`}>
                Your active session will be ended. Your inventory, bills, and profile changes remain saved securely.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className={`h-10 rounded-xl border px-4 text-[13px] font-bold transition ${
                    isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100' : 'border-white/15 bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogoutModalOpen(false);
                    onLogout?.();
                  }}
                  className="h-10 rounded-xl bg-red-600 px-5 text-[13px] font-bold text-white shadow-md transition hover:bg-red-700"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}

function ProfileLine({ icon: Icon, isLight, label, value }: { icon: any; isLight?: boolean; label: string; value: string }) {
  return (
    <div className={`grid grid-cols-[24px_75px_minmax(0,1fr)] items-center gap-2 rounded-xl border px-3 py-2 ${
      isLight
        ? 'border-slate-200/80 bg-slate-50/80 text-slate-800'
        : 'border-white/10 bg-white/[0.035] text-white'
    }`}>
      <Icon className={`h-4 w-4 ${isLight ? 'text-slate-400' : 'text-white/40'}`} />
      <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{label}</span>
      <span className="truncate text-right text-[12.5px] font-bold" title={value}>{value}</span>
    </div>
  );
}

function EditProfileInput({ isLight, label, onChange, value }: { isLight?: boolean; label: string; onChange: (val: string) => void; value: string }) {
  return (
    <div>
      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 w-full rounded-xl border-0 px-3 text-[13px] font-bold outline-none transition focus:ring-1 focus:ring-black dark:focus:ring-white ${
          isLight ? 'bg-zinc-100 text-black' : 'bg-zinc-900 text-white'
        }`}
      />
    </div>
  );
}
