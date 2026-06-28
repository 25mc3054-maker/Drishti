"use client";

import { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import LoadingSpinner from '../components/LoadingSpinner';
import type { DashboardData, TabKey } from '@/components/enterprise/types';

const Navbar = dynamic(() => import('@/components/enterprise/Navbar').then(mod => mod.Navbar), { ssr: false });
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
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [data, setData] = useState<DashboardData>(initialData);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

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
      try {
        const response = await fetch('/api/auth/session');
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('No session');
        if (cancelled) return;
        setAuthUser(result.user);
        const nextData = await loadData();
        if (!cancelled) setData(nextData);
      } catch {
        if (!cancelled) {
          setAuthUser(null);
          setData(initialData);
        }
      } finally {
        if (!cancelled) setIsCheckingSession(false);
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
    setActiveTab('overview');
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthUser(null);
    setData(initialData);
    setActiveTab('overview');
  };

  if (isCheckingSession) {
    return <div className="grid min-h-screen place-items-center bg-black text-white">Loading workspace...</div>;
  }

  if (!authUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.025), transparent 18%), linear-gradient(90deg, rgba(255,156,42,0.06), transparent 28%, transparent 72%, rgba(59,168,255,0.07))',
        }}
      />
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => { void logout(); }}
        profileUser={authUser}
        shopName={authUser.shopName || `Tenant ${String(authUser.tenantId || '').slice(0, 8)}`}
      />

      <motion.main
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-5 md:px-8"
      >
        {(() => {
          switch (activeTab) {
            case 'overview':
              return (
                <div className="space-y-7">
                  <HeroSection data={data} onNavigate={setActiveTab} />
                  <MarqueeTicker />
                </div>
              );
            case 'ai-workspace':
              return <AIWorkspace />;
            case 'business-suite':
              return <BusinessSuite data={data} onDataRefresh={async () => setData(await loadData())} />;
            case 'database-management':
              return <DatabaseManagementPage data={data} />;
            case 'storefront':
              return <StorefrontPage data={data} onNavigate={setActiveTab} />;
            case 'insights':
              return <InsightsPage data={data} onDataRefresh={async () => setData(await loadData())} />;
            case 'saas-admin':
              return <SaaSAdminPage onDataRefresh={async () => setData(await loadData())} />;
            default:
              return null;
          }
        })()}
      </motion.main>
    </div>
  );
}
