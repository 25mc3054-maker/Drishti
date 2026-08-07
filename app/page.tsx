"use client";

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import LoadingSpinner from '../components/LoadingSpinner';
import type { BusinessSectionKey, DashboardData, TabKey } from '@/components/enterprise/types';

const Navbar = dynamic(() => import('@/components/enterprise/Navbar').then(mod => mod.Navbar), { ssr: false });
const LeftMiniSidebar = dynamic(() => import('@/components/enterprise/LeftMiniSidebar').then(mod => mod.LeftMiniSidebar), { ssr: false });
const HeroSection = dynamic(() => import('@/components/enterprise/HeroSection').then(mod => mod.HeroSection), { loading: () => <div className="h-[400px] w-full flex justify-center items-center"><LoadingSpinner /></div> });
const MarqueeTicker = dynamic(() => import('@/components/enterprise/MarqueeTicker').then(mod => mod.MarqueeTicker), { ssr: false });
const AIWorkspace = dynamic(() => import('@/components/enterprise/AIWorkspace').then(mod => mod.AIWorkspace), { loading: () => <LoadingSpinner /> });
const BusinessSuite = dynamic(() => import('@/components/enterprise/BusinessSuite').then(mod => mod.BusinessSuite), { loading: () => <LoadingSpinner /> });
const StorefrontPage = dynamic(() => import('@/components/enterprise/StorefrontPage').then(mod => mod.StorefrontPage), { loading: () => <LoadingSpinner /> });
const InsightsPage = dynamic(() => import('@/components/enterprise/InsightsPage').then(mod => mod.InsightsPage), { loading: () => <LoadingSpinner /> });
const AuthScreen = dynamic(() => import('@/components/enterprise/AuthScreen').then(mod => mod.AuthScreen), { loading: () => <div className="grid min-h-screen place-items-center bg-black text-white">Loading...</div> });
const SaaSAdminPage = dynamic(() => import('@/components/enterprise/SaaSAdminPage').then(mod => mod.SaaSAdminPage), { loading: () => <LoadingSpinner /> });
const DatabaseManagementPage = dynamic(() => import('@/components/enterprise/DatabaseManagementPage').then(mod => mod.DatabaseManagementPage), { loading: () => <LoadingSpinner /> });

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
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  const loadData = async () => {
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
  };

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        if (!cancelled) {
          setAuthUser(null);
          setData(initialData);
          setIsCheckingSession(false);
        }
      }, 5000); // 5 second timeout

      try {
        const response = await fetch('/api/auth/session', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.user) {
            setAuthUser(result.user);
            const nextData = await loadData();
            if (!cancelled) setData(nextData);
            return;
          }
        }

        // Unauthenticated or missing session
        setAuthUser(null);
        setData(initialData);
      } catch (error: any) {
        if (!cancelled) {
          if (error?.name !== 'AbortError') {
            // Log at debug level only for actual unexpected errors
          }
          setAuthUser(null);
          setData(initialData);
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setIsCheckingSession(false);
        }
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
      if (!cancelled) {
        setData(initialData);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authUser?.tenantId]);

  const handleAuthenticated = async (user: any) => {
    setAuthUser(user);
    setData(await loadData());
    setActiveTab('business-suite');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
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

  if (isCheckingSession) {
    return <div className="grid min-h-screen place-items-center bg-black text-white font-medium">Loading workspace...</div>;
  }

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
      {/* Top Navigation Bar with Billing, Stock, Invoice... sub-nav */}
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
        onProfileUpdate={(updatedUser) => setAuthUser(updatedUser)}
        profileUser={authUser}
        shopName={authUser.shopName || `Tenant ${String(authUser.tenantId || '').slice(0, 8)}`}
      />

      {/* Main Workspace Layout with Left Mini Sidebar (VISIBLE ON ALL PAGES EXCEPT OVERVIEW) */}
      <div className="flex w-full min-h-[calc(100vh-65px)]">
        {/* Left Mini Sidebar (Visible on all pages EXCEPT overview) */}
        <LeftMiniSidebar
          activeTab={activeTab}
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
