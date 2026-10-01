"use client";

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import type { BusinessSectionKey, DashboardData, TabKey } from '@/components/enterprise/types';
import { toast } from 'sonner';

// Core direct imports for instantaneous 0ms first-paint and elimination of blank screen delays
import { Navbar } from '@/components/enterprise/Navbar';
import { LeftMiniSidebar } from '@/components/enterprise/LeftMiniSidebar';
import { HeroSection } from '@/components/enterprise/HeroSection';
import { BusinessSuite } from '@/components/enterprise/BusinessSuite';
import { MarqueeTicker } from '@/components/enterprise/MarqueeTicker';
import { FirstTimeThemeSetup } from '@/components/enterprise/FirstTimeThemeSetup';

function SectionLoadingSkeleton() {
  return (
    <div className="w-full h-96 flex flex-col items-center justify-center gap-3 p-8">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
      <span className="text-xs text-zinc-400 font-medium animate-pulse">Loading workspace module...</span>
    </div>
  );
}

// On-demand lazy secondary tabs
const AIWorkspace = dynamic(() => import('@/components/enterprise/AIWorkspace').then(mod => mod.AIWorkspace), { loading: () => <SectionLoadingSkeleton /> });
const StorefrontPage = dynamic(() => import('@/components/enterprise/StorefrontPage').then(mod => mod.StorefrontPage), { loading: () => <SectionLoadingSkeleton /> });
const InsightsPage = dynamic(() => import('@/components/enterprise/InsightsPage').then(mod => mod.InsightsPage), { loading: () => <SectionLoadingSkeleton /> });
const SaaSAdminPage = dynamic(() => import('@/components/enterprise/SaaSAdminPage').then(mod => mod.SaaSAdminPage), { loading: () => <SectionLoadingSkeleton /> });
const DatabaseManagementPage = dynamic(() => import('@/components/enterprise/DatabaseManagementPage').then(mod => mod.DatabaseManagementPage), { loading: () => <SectionLoadingSkeleton /> });
const ThemeOnboardingModal = dynamic(() => import('@/components/enterprise/ThemeOnboardingModal').then(mod => mod.ThemeOnboardingModal), { ssr: false });

const initialData: DashboardData = {
  items: [],
  customers: [],
  orders: [],
  invoices: [],
  expenses: [],
  suppliers: [],
  tasks: [],
  storefront: null,
};

const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const cachedUserStr = localStorage.getItem('easytrader_user');
    if (cachedUserStr) {
      const cachedUser = JSON.parse(cachedUserStr);
      const userKey = cachedUser.email || cachedUser.tenantId || cachedUser.id;
      if (userKey) {
        const accountTheme = localStorage.getItem(`easytrader_theme_${userKey}`);
        if (accountTheme === 'dark' || accountTheme === 'light') return accountTheme;
      }
    }
    const storedTheme = localStorage.getItem('easytrader_theme') || localStorage.getItem('vite-ui-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
  } catch {}
  return 'dark';
};

export default function EasyTraderPlatform() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [activeBusinessSection, setActiveBusinessSection] = useState<BusinessSectionKey>('billing');
  const [data, setData] = useState<DashboardData>(initialData);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [showThemeOnboarding, setShowThemeOnboarding] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showThemeSetup, setShowThemeSetup] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [pendingTarget, setPendingTarget] = useState<{ tab: TabKey; section?: BusinessSectionKey } | null>(null);
  const isLoadingDataRef = useRef(false);

  // 1. Instant Mount Hydration for Landing Page, Theme, User & Data from LocalStorage/SessionStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    // Check cached user from sessionStorage or localStorage for 0ms instantaneous login state
    try {
      const cachedUserStr =
        sessionStorage.getItem('drishti_session_user') ||
        localStorage.getItem('drishti_cached_user') ||
        localStorage.getItem('easytrader_user');
      if (cachedUserStr) {
        const sessionUser = JSON.parse(cachedUserStr);
        if (sessionUser && (sessionUser.id || sessionUser.email || sessionUser.tenantId || sessionUser.mobile)) {
          setAuthUser(sessionUser);
        }
      }
    } catch {}

    try {
      const cachedDataStr = localStorage.getItem('drishti_cached_dashboard_data');
      if (cachedDataStr) {
        const cachedData = JSON.parse(cachedDataStr);
        if (cachedData && Array.isArray(cachedData.items)) {
          setData(cachedData);
        }
      }
    } catch {}

    // Check if user is a new user (first visit) vs an old/returning user
    const hasSeenOverview = localStorage.getItem('drishti_has_seen_overview');
    if (hasSeenOverview) {
      // Old user: Open directly to Billing Page
      setActiveTab('business-suite');
      setActiveBusinessSection('billing');
    } else {
      // New user: Open Overview Page first
      setActiveTab('overview');
    }

    const activeAcc = localStorage.getItem('drishti_active_account_id');
    const themeChosen = localStorage.getItem('drishti_theme_chosen');
    if (!themeChosen) {
      setShowThemeSetup(false);
    }

    let loadedTheme: 'dark' | 'light' | null = null;

    if (activeAcc) {
      const accTheme = localStorage.getItem(`drishti_theme_${activeAcc}`);
      if (accTheme === 'dark' || accTheme === 'light') {
        loadedTheme = accTheme as 'dark' | 'light';
      }
    }

    if (!loadedTheme) {
      const globTheme = localStorage.getItem('drishti_global_theme');
      if (globTheme === 'dark' || globTheme === 'light') {
        loadedTheme = globTheme as 'dark' | 'light';
      }
    }

    if (loadedTheme) {
      setTheme(loadedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(loadedTheme);
      document.documentElement.setAttribute('data-theme', loadedTheme);
    } else {
      setTheme('dark');
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('easytrader_theme', newTheme);
        localStorage.setItem('vite-ui-theme', newTheme);
        localStorage.setItem('drishti_global_theme', newTheme);
        if (authUser) {
          const userKey = authUser.email || authUser.tenantId || authUser.id;
          if (userKey) {
            localStorage.setItem(`easytrader_theme_${userKey}`, newTheme);
            localStorage.setItem(`drishti_theme_${userKey}`, newTheme);
          }
        }
      } catch {}
    }

    if (authUser) {
      fetch('/api/saas/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      }).catch(() => {});

      fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePreference: newTheme }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result?.success && result?.user) {
            setAuthUser(result.user);
            if (typeof window !== 'undefined') {
              localStorage.setItem('drishti_cached_user', JSON.stringify(result.user));
              localStorage.setItem('easytrader_user', JSON.stringify(result.user));
            }
          }
        })
        .catch(() => {});
    }
  };

  const loadData = async () => {
    if (isLoadingDataRef.current) return data;
    isLoadingDataRef.current = true;
    try {
      const [itemsRes, customersRes, invoicesRes, suppliersRes, expensesRes] = await Promise.all([
        fetch('/api/saas/items').then((response) => response.json()).catch(() => ({ items: [] })),
        fetch('/api/saas/customers').then((response) => response.json()).catch(() => ({ customers: [] })),
        fetch('/api/saas/invoices').then((response) => response.json()).catch(() => ({ invoices: [] })),
        fetch('/api/saas/suppliers').then((response) => response.json()).catch(() => ({ suppliers: [] })),
        fetch('/api/saas/expenses').then((response) => response.json()).catch(() => ({ expenses: [] })),
      ]);

      const loaded: DashboardData = {
        items: itemsRes?.items || [],
        customers: customersRes?.customers || [],
        invoices: invoicesRes?.invoices || [],
        orders: [],
        expenses: expensesRes?.expenses || [],
        suppliers: suppliersRes?.suppliers || [],
        tasks: [],
        storefront: null,
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('drishti_cached_dashboard_data', JSON.stringify(loaded));
        } catch {}
      }

      return loaded;
    } catch {
      return initialData;
    } finally {
      isLoadingDataRef.current = false;
    }
  };

  // 2. Hydrate theme per logged-in account
  useEffect(() => {
    if (!authUser) return;

    if (typeof window !== 'undefined') {
      const accKey = authUser.id || authUser.email;
      if (accKey) {
        localStorage.setItem('drishti_active_account_id', accKey);

        const accountTheme =
          localStorage.getItem(`drishti_theme_${authUser.id}`) ||
          (authUser.email ? localStorage.getItem(`drishti_theme_${authUser.email}`) : null) ||
          authUser.themePreference;

        if (accountTheme === 'light' || accountTheme === 'dark') {
          setTheme(accountTheme as 'dark' | 'light');
          localStorage.setItem('drishti_global_theme', accountTheme);
          if (authUser.id) localStorage.setItem(`drishti_theme_${authUser.id}`, accountTheme);
          if (authUser.email) localStorage.setItem(`drishti_theme_${authUser.email}`, accountTheme);
        }
      }
    }
  }, [authUser?.id, authUser?.email, authUser?.themePreference]);
  const handleThemeOnboardingComplete = () => {
    setShowThemeOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme_onboarding_complete', 'true');
    }
  };

  const handleConfirmTheme = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drishti_theme_chosen', 'true');
      localStorage.setItem('drishti_global_theme', theme);
      if (authUser?.id) localStorage.setItem(`drishti_theme_${authUser.id}`, theme);
      if (authUser?.email) localStorage.setItem(`drishti_theme_${authUser.email}`, theme);
      if (authUser?.id || authUser?.email) {
        localStorage.setItem('drishti_active_account_id', authUser.id || authUser.email);
      }
    }

    if (authUser) {
      fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePreference: theme }),
      }).catch(() => {});
    }

    setShowThemeSetup(false);
    toast.success(`${theme === 'light' ? 'Light' : 'Dark'} theme selected!`, {
      description: 'Applied permanently. This choice will automatically open every time.',
      icon: theme === 'light' ? '☀️' : '🌙',
    });
  };

  // Hydrate local cached user on mount & verify session against backend API
  useEffect(() => {
    let cancelled = false;

    // 1. Instant local hydration (prevents SSR mismatch & ensures 0ms response)
    try {
      const cached = localStorage.getItem('easytrader_user') || localStorage.getItem('drishti_cached_user');
      if (cached) {
        const user = JSON.parse(cached);
        setAuthUser(user);
        const userKey = user.email || user.tenantId || user.id;
        if (userKey) {
          const accountTheme = localStorage.getItem(`easytrader_theme_${userKey}`);
          if (accountTheme === 'dark' || accountTheme === 'light') {
            setTheme(accountTheme);
          }
        }
      }
    } catch {}

    // 2. Background session check & cloud theme restoration
    const checkSession = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 6000);

      try {
        const response = await fetch('/api/auth/session', { signal: controller.signal });
        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.user) {
            const user = result.user;
            setAuthUser(user);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('drishti_session_user', JSON.stringify(user));
              sessionStorage.setItem('drishti_session_active', 'true');
              localStorage.setItem('drishti_cached_user', JSON.stringify(user));
              localStorage.setItem('easytrader_user', JSON.stringify(user));
              localStorage.setItem('drishti_has_seen_overview', 'true');
            }

            const userKey = user.email || user.tenantId || user.id;
            if (userKey) {
              const accountTheme = localStorage.getItem(`easytrader_theme_${userKey}`);
              if (accountTheme === 'dark' || accountTheme === 'light') {
                setTheme(accountTheme);
              }
            }

            const nextData = await loadData();
            if (!cancelled) setData(nextData);
            return;
          }
        }
      } catch (error: any) {
        // Keep cached state on transient network or dev timeouts
      } finally {
        clearTimeout(timeoutId);
      }
    };

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    const load = async () => {
      const nextData = await loadData();
      if (cancelled) return;
      setData(nextData);
    };

    load().catch(() => {
      if (!cancelled) setData(initialData);
    });

    return () => {
      cancelled = true;
    };
  }, [authUser?.tenantId]);

  const requireAuth = (
    targetTab: TabKey = 'business-suite',
    targetSection: BusinessSectionKey = 'billing',
    mode: 'login' | 'register' = 'login'
  ) => {
    if (authUser) {
      setActiveTab(targetTab);
      if (targetTab === 'business-suite' && targetSection) {
        setActiveBusinessSection(targetSection);
      }
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = mode === 'register' ? '/register' : '/login';
    }
  };

  const handleAuthenticated = async (user: any) => {
    const userKey = user.email || user.tenantId || user.id;
    if (userKey) {
      const accountTheme = localStorage.getItem(`easytrader_theme_${userKey}`);
      if (accountTheme === 'dark' || accountTheme === 'light') {
        setTheme(accountTheme);
      }
    }
    const themeOnboardingComplete = localStorage.getItem('theme_onboarding_complete');
    if (!themeOnboardingComplete) {
      setShowThemeOnboarding(true);
    }
    setAuthUser(user);
    setShowAuthModal(false);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('drishti_session_active', 'true');
      sessionStorage.setItem('drishti_session_user', JSON.stringify(user));
      localStorage.setItem('drishti_has_seen_overview', 'true');
      localStorage.setItem('drishti_cached_user', JSON.stringify(user));
      localStorage.setItem('easytrader_user', JSON.stringify(user));
    }

    const accSavedTheme =
      (user.id ? localStorage.getItem(`drishti_theme_${user.id}`) : null) ||
      (user.email ? localStorage.getItem(`drishti_theme_${user.email}`) : null) ||
      user.themePreference ||
      localStorage.getItem('drishti_global_theme') ||
      'dark';

    if (accSavedTheme === 'light' || accSavedTheme === 'dark') {
      setTheme(accSavedTheme as 'dark' | 'light');
    } else {
      setTheme('dark');
    }

    if (typeof window !== 'undefined') {
      const accId = user.id || user.email;
      if (accId) {
        localStorage.setItem('drishti_active_account_id', accId);
        localStorage.setItem(`drishti_theme_${accId}`, accSavedTheme);
      }
    }

    // Direct transition to target (defaults straight to Billing POS)
    const target = pendingTarget || { tab: 'business-suite', section: 'billing' };
    setActiveTab(target.tab);
    if (target.tab === 'business-suite' && target.section) {
      setActiveBusinessSection(target.section);
    }
    setPendingTarget(null);

    void loadData().then((nextData) => setData(nextData));
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('drishti_session_active');
      sessionStorage.removeItem('drishti_session_user');
      localStorage.removeItem('drishti_cached_user');
      localStorage.removeItem('easytrader_user');
      localStorage.removeItem('drishti_cached_dashboard_data');
    }
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthUser(null);
    setData(initialData);
    setActiveTab('overview');
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const isLight = theme === 'light';
  const shellThemeClasses = {
    dark: 'bg-black text-white',
    light: 'bg-white text-black',
  } as const;

  const handleTabSelect = (tab: TabKey) => {
    if (tab !== 'overview' && typeof window !== 'undefined') {
      localStorage.setItem('drishti_has_seen_overview', 'true');
    }
    setActiveTab(tab);
    if (tab === 'business-suite') {
      setActiveBusinessSection('billing');
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className={`relative h-screen max-h-screen overflow-hidden flex flex-col font-sans transition-all duration-300 ${shellThemeClasses[theme]}`}>
      {showThemeOnboarding && (
        <ThemeOnboardingModal
          onComplete={handleThemeOnboardingComplete}
          onThemeSelect={handleThemeChange}
        />
      )}
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        activeBusinessSection={activeBusinessSection}
        onBusinessSectionChange={setActiveBusinessSection}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        theme={theme}
        onThemeChange={handleThemeChange}
        onTabChange={handleTabSelect}
        onLogout={() => { void logout(); }}
        onOpenAuthModal={(mode) => requireAuth('business-suite', 'billing', mode || 'login')}
        onProfileUpdate={(updatedUser) => {
          setAuthUser(updatedUser);
          sessionStorage.setItem('drishti_session_user', JSON.stringify(updatedUser));
          localStorage.setItem('easytrader_user', JSON.stringify(updatedUser));
          localStorage.setItem('drishti_cached_user', JSON.stringify(updatedUser));
        }}
        profileUser={authUser}
        shopName={authUser?.shopName || (authUser?.tenantId ? `Tenant ${String(authUser.tenantId).slice(0, 8)}` : undefined)}
      />

      {/* Main Workspace Layout with Left Mini Sidebar (VISIBLE ON ALL PAGES EXCEPT OVERVIEW) */}
      <div className="flex w-full flex-1 min-h-0 overflow-hidden">
        <LeftMiniSidebar
          activeTab={activeTab}
          activeBusinessSection={activeBusinessSection}
          onBusinessSectionChange={(sec) => {
            setActiveBusinessSection(sec);
            setIsSidebarOpen(false);
          }}
          isOpen={activeTab !== 'overview' && isSidebarOpen}
          isAuthenticated={Boolean(authUser)}
          onRequireAuth={() => requireAuth('business-suite', 'billing')}
          onTabChange={handleTabSelect}
          theme={theme}
        />

        {/* Main Content View */}
        <motion.main
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto px-1.5 pb-1 pt-1 md:px-3 relative"
        >
          {/* Transparent full-workspace click interceptor for unauthenticated visitors on billing/workspace */}
          {!authUser && activeTab !== 'overview' && (
            <div
              className="absolute inset-0 z-40 cursor-pointer bg-transparent"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                requireAuth(activeTab, activeBusinessSection);
              }}
            />
          )}

          {/* Guest Preview Notice Badge on Workspace Pages */}
          {!authUser && activeTab !== 'overview' && (
            <div className="sticky top-0 z-30 mb-2 flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-300 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span><strong>Guest Preview Mode</strong> — Click anywhere on the billing desk to login or register your free shop workspace.</span>
              </div>
              <button
                type="button"
                onClick={() => requireAuth(activeTab, activeBusinessSection, 'login')}
                className="rounded-lg bg-white px-3 py-1 text-black font-extrabold hover:bg-zinc-200 transition relative z-50"
              >
                Sign In / Register
              </button>
            </div>
          )}
          {(() => {
            switch (activeTab) {
              case 'overview':
                return (
                  <div className="space-y-7 mx-auto max-w-[1400px]">
                    <HeroSection
                      theme={theme}
                      data={data}
                      isAuthenticated={Boolean(authUser)}
                      onRequireAuth={() => requireAuth('business-suite', 'billing')}
                      onNavigate={handleTabSelect}
                    />
                    <MarqueeTicker />
                  </div>
                );
              case 'ai-workspace':
                return <div className="mx-auto max-w-[1400px]"><AIWorkspace theme={theme} /></div>;
              case 'business-suite':
                return (
                  <BusinessSuite
                    theme={theme}
                    data={data}
                    activeSection={activeBusinessSection}
                    onSectionChange={setActiveBusinessSection}
                    onDataRefresh={async () => setData(await loadData())}
                  />
                );
              case 'database-management':
                return <div className="mx-auto max-w-[1400px]"><DatabaseManagementPage theme={theme} data={data} /></div>;
              case 'storefront':
                return <div className="mx-auto max-w-[1400px]"><StorefrontPage data={data} onNavigate={setActiveTab} /></div>;
              case 'insights':
                return <div className="mx-auto max-w-[1400px]"><InsightsPage theme={theme} data={data} onDataRefresh={async () => setData(await loadData())} /></div>;
              case 'saas-admin':
                return <div className="mx-auto max-w-[1400px]"><SaaSAdminPage theme={theme} onThemeChange={handleThemeChange} onDataRefresh={async () => setData(await loadData())} /></div>;
              case 'settings':
                return <div className="mx-auto max-w-[1400px]"><SaaSAdminPage theme={theme} onThemeChange={handleThemeChange} onDataRefresh={async () => setData(await loadData())} /></div>;
              default:
                return null;
            }
          })()}
        </motion.main>
      </div>


      {/* First-Time Theme Setup Modal (Only shown once on first visit) */}
      <FirstTimeThemeSetup
        isOpen={showThemeSetup}
        currentTheme={theme}
        onSelectTheme={handleThemeChange}
        onConfirm={handleConfirmTheme}
      />
    </div>
  );
}
