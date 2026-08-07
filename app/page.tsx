"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { BusinessSectionKey, DashboardData, TabKey } from '@/components/enterprise/types';
import { ThemeOnboardingModal } from '@/components/enterprise/ThemeOnboardingModal';
import { Navbar } from '@/components/enterprise/Navbar';
import { LeftMiniSidebar } from '@/components/enterprise/LeftMiniSidebar';
import { HeroSection } from '@/components/enterprise/HeroSection';
import { MarqueeTicker } from '@/components/enterprise/MarqueeTicker';
import { AIWorkspace } from '@/components/enterprise/AIWorkspace';
import { BusinessSuite } from '@/components/enterprise/BusinessSuite';
import { StorefrontPage } from '@/components/enterprise/StorefrontPage';
import { InsightsPage } from '@/components/enterprise/InsightsPage';
import { AuthScreen } from '@/components/enterprise/AuthScreen';
import { SaaSAdminPage } from '@/components/enterprise/SaaSAdminPage';
import { DatabaseManagementPage } from '@/components/enterprise/DatabaseManagementPage';

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

export default function EasyTraderPlatform() {
  const [activeTab, setActiveTab] = useState<TabKey>('business-suite');
  const [activeBusinessSection, setActiveBusinessSection] = useState<BusinessSectionKey>('billing');
  const [data, setData] = useState<DashboardData>(initialData);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [showThemeOnboarding, setShowThemeOnboarding] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, customersRes, invoicesRes, suppliersRes] = await Promise.all([
        fetch('/api/saas/items').then((response) => response.json()),
        fetch('/api/saas/customers').then((response) => response.json()),
        fetch('/api/saas/invoices').then((response) => response.json()),
        fetch('/api/saas/suppliers').then((response) => response.json()),
      ]);

      return {
        items: itemsRes.items || [],
        customers: customersRes.customers || [],
        invoices: invoicesRes.invoices || [],
        orders: [],
        expenses: [],
        suppliers: suppliersRes.suppliers || [],
        tasks: [],
        storefront: null,
      };
    } catch {
      return initialData;
    }
  };

  // Hydrate local cached user on mount & verify session silently in background
  useEffect(() => {
    let cancelled = false;

    // 1. Instant local hydration (prevents SSR mismatch & ensures 0ms response)
    try {
      const cached = localStorage.getItem('easytrader_user');
      if (cached) {
        setAuthUser(JSON.parse(cached));
      }
    } catch {}

    // 2. Background session check
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.user) {
            setAuthUser(result.user);
            localStorage.setItem('easytrader_user', JSON.stringify(result.user));
            const nextData = await loadData();
            if (!cancelled) setData(nextData);
            return;
          }
        }

        // Unauthenticated or invalid session
        if (!cancelled) {
          setAuthUser(null);
          localStorage.removeItem('easytrader_user');
          setData(initialData);
        }
      } catch {
        // Silently retain current state
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
    const themeOnboardingComplete = localStorage.getItem('theme_onboarding_complete');
    if (!themeOnboardingComplete) {
      setShowThemeOnboarding(true);
    }
    setAuthUser(user);
    localStorage.setItem('easytrader_user', JSON.stringify(user));
    setData(await loadData());
    setActiveTab('business-suite');
  };

  const handleThemeOnboardingComplete = () => {
    setShowThemeOnboarding(false);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
    localStorage.removeItem('easytrader_user');
    setData(initialData);
    setActiveTab('business-suite');
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const isLight = theme === 'light';

  if (!authUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const handleTabSelect = (tab: TabKey) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className={`relative min-h-screen overflow-x-hidden font-sans transition-colors duration-200 ${
      isLight ? 'bg-white text-black' : 'bg-black text-white'
    }`}>
      {showThemeOnboarding && <ThemeOnboardingModal onComplete={handleThemeOnboardingComplete} />}
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        activeBusinessSection={activeBusinessSection}
        onBusinessSectionChange={setActiveBusinessSection}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        theme={theme}
        onThemeChange={setTheme}
        onTabChange={handleTabSelect}
        onLogout={() => { void logout(); }}
        onProfileUpdate={(updatedUser) => {
          setAuthUser(updatedUser);
          localStorage.setItem('easytrader_user', JSON.stringify(updatedUser));
        }}
        profileUser={authUser}
        shopName={authUser.shopName || `Tenant ${String(authUser.tenantId || '').slice(0, 8)}`}
      />

      {/* Main Workspace Layout with Left Mini Sidebar */}
      <div className="flex w-full min-h-[calc(100vh-65px)]">
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
          className="flex-1 min-w-0 px-3 pb-3 pt-3 md:px-6"
        >
          {(() => {
            switch (activeTab) {
              case 'overview':
                return (
                  <div className="space-y-7 mx-auto max-w-[1400px]">
                    <HeroSection theme={theme} data={data} onNavigate={setActiveTab} />
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
                return <div className="mx-auto max-w-[1400px]"><SaaSAdminPage theme={theme} onDataRefresh={async () => setData(await loadData())} /></div>;
              default:
                return null;
            }
          })()}
        </motion.main>
      </div>
    </div>
  );
}
