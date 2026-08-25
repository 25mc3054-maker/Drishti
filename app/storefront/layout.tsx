import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easytrader.onrender.com';
const pageUrl = `${siteUrl}/storefront`;

export const metadata: Metadata = {
  title: 'Merchant Digital Storefront Manager',
  description: 'Manage your retail storefront, track live customer orders, update product catalogs, and review automated sales analytics on EasyTrader.',
  keywords: [
    'Storefront Manager',
    'Merchant Dashboard',
    'Kirana Digital Catalog',
    'Live Orders Tracker',
    'EasyTrader Retail',
  ],
  openGraph: {
    title: 'Merchant Digital Storefront Manager | EasyTrader',
    description: 'Manage your digital storefront, track live customer orders, and update inventory in real-time.',
    url: pageUrl,
    type: 'website',
  },
  alternates: {
    canonical: pageUrl,
  },
};

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
