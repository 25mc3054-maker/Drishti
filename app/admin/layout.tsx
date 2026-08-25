import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easytrader.onrender.com';
const pageUrl = `${siteUrl}/admin`;

export const metadata: Metadata = {
  title: 'Business Suite & Admin Control Center',
  description: 'EasyTrader Admin Suite: Smart POS billing, real-time inventory management, customer ledger, supplier reorders, and AI business insights.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: pageUrl,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
