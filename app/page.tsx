"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import type { BusinessSectionKey, DashboardData, TabKey } from '@/components/enterprise/types';
import { toast } from 'sonner';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );
}

const AuthScreen = dynamic(() => import('@/components/enterprise/AuthScreen').then(mod => mod.AuthScreen), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingSpinner />
    </div>
  ),
});
const Navbar = dynamic(() => import('@/components/enterprise/Navbar').then(mod => mod.Navbar), { ssr: false });
const LeftMiniSidebar = dynamic(() => import('@/components/enterprise/LeftMiniSidebar').then(mod => mod.LeftMiniSidebar), { ssr: false });
const HeroSection = dynamic(() => import('@/components/enterprise/HeroSection').then(mod => mod.HeroSection), { loading: () => <div className="h-[400px] w-full flex justify-center items-center"><LoadingSpinner /></div> });
const MarqueeTicker = dynamic(() => import('@/components/enterprise/MarqueeTicker').then(mod => mod.MarqueeTicker), { ssr: false });
const AIWorkspace = dynamic(() => import('@/components/enterprise/AIWorkspace').then(mod => mod.AIWorkspace), { loading: () => <LoadingSpinner /> });
const BusinessSuite = dynamic(() => import('@/components/enterprise/BusinessSuite').then(mod => mod.BusinessSuite), { loading: () => <LoadingSpinner /> });
const StorefrontPage = dynamic(() => import('@/components/enterprise/StorefrontPage').then(mod => mod.StorefrontPage), { loading: () => <LoadingSpinner /> });
const InsightsPage = dynamic(() => import('@/components/enterprise/InsightsPage').then(mod => mod.InsightsPage), { loading: () => <LoadingSpinner /> });
const SaaSAdminPage = dynamic(() => import('@/components/enterprise/SaaSAdminPage').then(mod => mod.SaaSAdminPage), { loading: () => <LoadingSpinner /> });
const DatabaseManagementPage = dynamic(() => import('@/components/enterprise/DatabaseManagementPage').then(mod => mod.DatabaseManagementPage), { loading: () => <LoadingSpinner /> });
const FirstTimeThemeSetup = dynamic(() => import('@/components/enterprise/FirstTimeThemeSetup').then(mod => mod.FirstTimeThemeSetup), { ssr: false });
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
  const [activeTab, setActiveTab] = useState<TabKey>('business-suite');
  const [activeBusinessSection, setActiveBusinessSection] = useState<BusinessSectionKey>('billing');
  const [data, setData] = useState<DashboardData>(initialData);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [showThemeOnboarding, setShowThemeOnboarding] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showThemeSetup, setShowThemeSetup] = useState(false);

  // 1. Instant Mount Hydration for Landing Page, Theme, User & Data from LocalStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    // Fast hydrate user & data from local cache if present for instant rendering
    try {
      const cachedUserStr = localStorage.getItem('drishti_cached_user') || localStorage.getItem('easytrader_user');
      if (cachedUserStr) {
        const cachedUser = JSON.parse(cachedUserStr);
        if (cachedUser && (cachedUser.id || cachedUser.email)) {
          setAuthUser(cachedUser);
        }
      }
      const cachedDataStr = localStorage.getItem('drishti_cached_dashboard_data');
      if (cachedDataStr) {
        const cachedData = JSON.parse(cachedDataStr);
        if (cachedData && Array.isArray(cachedData.items)) {
          setData(cachedData);
        }
      }
    } catch {}

    // Check if user is opening for the very first time vs daily operations
    const hasSeenOverview = localStorage.getItem('drishti_has_seen_overview');
    const defaultLanding = localStorage.getItem('drishti_default_landing') || 'billing';

    if (!hasSeenOverview) {
      // First-time visitor: open Overview page for feature orientation
      setActiveTab('overview');
    } else {
      // Daily returning shopkeeper: open directly in Billing POS for zero-friction speed
      if (defaultLanding === 'overview') {
        setActiveTab('overview');
      } else {
        setActiveTab('business-suite');
        setActiveBusinessSection('billing');
      }
    }

    const activeAcc = localStorage.getItem('drishti_active_account_id');
    const themeChosen = localStorage.getItem('drishti_theme_chosen');
    if (!themeChosen) {
      setShowThemeSetup(true);
    }

    let loadedTheme: 'dark' | 'light' | null = null;

    if (activeAcc) {
      const accTheme = localStorage.getItem(`drishti_theme_${activeAcc}`);
      if (accTheme === 'dark' || accTheme === 'light') {
        loadedTheme = accTheme;
      }
    }

    if (!loadedTheme) {
      const globTheme = localStorage.getItem('drishti_global_theme');
      if (globTheme === 'dark' || globTheme === 'light') {
        loadedTheme = globTheme;
      }
    }

    if (loadedTheme) {
      setTheme(loadedTheme);
      if (loadedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
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
    try {
      const [itemsRes, customersRes, invoicesRes, suppliersRes, expensesRes] = await Promise.all([
        fetch('/api/saas/items').then((response) => response.json()).catch(() => ({ items: [] })),
        fetch('/api/saas/customers').then((response) => response.json()).catch(() => ({ customers: [] })),
        fetch('/api/saas/invoices').then((response) => response.json()).catch(() => ({ invoices: [] })),
        fetch('/api/saas/suppliers').then((response) => response.json()).catch(() => ({ suppliers: [] })),
        fetch('/api/saas/expenses').then((response) => response.json()).catch(() => ({ expenses: [] })),
      ]);

      const loaded = {
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
          setTheme(accountTheme);
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

  // Hydrate local cached user on mount & verify session silently in background
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
      }, 4000);

      try {
        const response = await fetch('/api/auth/session', { signal: controller.signal });
        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.user) {
            const user = result.user;
            setAuthUser(user);
            if (typeof window !== 'undefined') {
              localStorage.setItem('drishti_cached_user', JSON.stringify(user));
              localStorage.setItem('easytrader_user', JSON.stringify(user));
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

        // Unauthenticated or missing session
        setAuthUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('drishti_cached_user');
          localStorage.removeItem('easytrader_user');
          localStorage.removeItem('drishti_cached_dashboard_data');
        }
        setData(initialData);
      } catch (error: any) {
        if (!cancelled && error?.name !== 'AbortError') {
          // Preserve cached user on transient offline/network hiccups
        }
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
    if (typeof window !== 'undefined') {
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
    }

    if (typeof window !== 'undefined') {
      const accId = user.id || user.email;
      if (accId) {
        localStorage.setItem('drishti_active_account_id', accId);
        localStorage.setItem(`drishti_theme_${accId}`, accSavedTheme);
      }
    }

    const hasSeen = typeof window !== 'undefined' ? localStorage.getItem('drishti_has_seen_overview') : null;
    const defaultLanding = (typeof window !== 'undefined' ? localStorage.getItem('drishti_default_landing') : null) || 'billing';

    if (!hasSeen) {
      setActiveTab('overview');
    } else {
      if (defaultLanding === 'overview') {
        setActiveTab('overview');
      } else {
        setActiveTab('business-suite');
        setActiveBusinessSection('billing');
      }
    }

    void loadData().then((nextData) => setData(nextData));
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('drishti_cached_user');
      localStorage.removeItem('easytrader_user');
      localStorage.removeItem('drishti_cached_dashboard_data');
    }
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthUser(null);
    setData(initialData);
    setActiveTab('business-suite');
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const isLight = theme === 'light';

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!authUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const handleTabSelect = (tab: TabKey) => {
    if (tab !== 'overview' && typeof window !== 'undefined') {
      localStorage.setItem('drishti_has_seen_overview', 'true');
    }
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className={`relative h-screen max-h-screen overflow-hidden flex flex-col font-sans transition-colors duration-200 ${
      isLight ? 'bg-white text-black' : 'bg-black text-white'
    }`}>
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
        onProfileUpdate={(updatedUser) => {
          setAuthUser(updatedUser);
          localStorage.setItem('easytrader_user', JSON.stringify(updatedUser));
          localStorage.setItem('drishti_cached_user', JSON.stringify(updatedUser));
        }}
        profileUser={authUser}
        shopName={authUser.shopName || `Tenant ${String(authUser.tenantId || '').slice(0, 8)}`}
      />

      {/* Main Workspace Layout with Left Mini Sidebar (VISIBLE ON ALL PAGES EXCEPT OVERVIEW) */}
      <div className="flex w-full flex-1 min-h-0 overflow-hidden">
        {/* Left Mini Sidebar (Visible on all pages EXCEPT overview) */}
        <LeftMiniSidebar
          activeTab={activeTab}
          activeBusinessSection={activeBusinessSection}
          onBusinessSectionChange={(sec) => {
            setActiveBusinessSection(sec);
            setIsSidebarOpen(false);
          }}
          isOpen={activeTab !== 'overview' && isSidebarOpen}
          onTabChange={handleTabSelect}
          theme={theme}
        />

        {/* Main Content View */}
        <motion.main
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto px-1.5 pb-1 pt-1 md:px-3"
        >
          {(() => {
            switch (activeTab) {
              case 'overview':
                return (
                  <div className="space-y-7 mx-auto max-w-[1400px]">
                    <HeroSection theme={theme} data={data} onNavigate={handleTabSelect} />
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

