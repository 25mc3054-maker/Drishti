import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import ClientToaster from '../components/ClientToaster';
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from '../contexts/ThemeContext';
import { NextAuthProvider } from '@/components/NextAuthProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://easytrader.onrender.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EasyTrader - Smart Billing, Business Suite & AI Workspace for Bharat',
    template: '%s | EasyTrader',
  },
  description: 'AI-powered solution architect and retail operations platform for businesses in Bharat. Smart POS billing, inventory management, AI workspace, supplier reordering, and customer digital storefronts.',
  keywords: [
    'EasyTrader',
    'AI Retail Software',
    'Kirana Billing Software',
    'Smart POS India',
    'Inventory Management System',
    'Bharat MSME Operations',
    'Computer Vision Retail Analytics',
    'Digital Storefront Builder',
    'Retail Automation India',
    'E-commerce Storefront for Kirana',
    'GST Billing App',
    'Smart Billing System',
    'Shopkeeper Management Software',
    'Retail POS Software',
    'Invoice Generator',
    'Digital Khata Book',
    'AI Business Suite',
  ],
  authors: [{ name: 'EasyTrader Team', url: siteUrl }],
  creator: 'EasyTrader',
  publisher: 'EasyTrader',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'EasyTrader - Smart Billing & Business Workspace for Shopkeepers',
    description: 'Manage retail billing, stock inventory, customers, suppliers, expenses, and automated storefronts effortlessly with EasyTrader.',
    url: siteUrl,
    siteName: 'EasyTrader',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/diagram-export-08-03-2026-15_08_32.png`,
        width: 1200,
        height: 630,
        alt: 'EasyTrader Business Suite Workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyTrader - Smart Billing & Business Workspace',
    description: 'Manage retail billing, stock inventory, customers, suppliers, expenses, and automated storefronts effortlessly with EasyTrader.',
    images: [`${siteUrl}/diagram-export-08-03-2026-15_08_32.png`],
    creator: '@EasyTraderApp',
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'EasyTrader',
      url: siteUrl,
      logo: `${siteUrl}/diagram-export-08-03-2026-15_08_32.png`,
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'EasyTrader',
      description: 'AI-powered solution architect and retail operations platform for businesses in Bharat.',
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'EasyTrader Business Suite',
      operatingSystem: 'Web, Android, iOS, Windows, Mac',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
      description: 'AI-powered retail business suite, vision analytics, smart billing, inventory management, and customer storefront for Bharat.',
      url: siteUrl,
      author: { '@id': `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark font-sans ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var activeAcc = localStorage.getItem('drishti_active_account_id');
                var theme = null;
                if (activeAcc) {
                  theme = localStorage.getItem('drishti_theme_' + activeAcc);
                }
                if (!theme) {
                  theme = localStorage.getItem('drishti_global_theme');
                }
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            })();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased text-slate-100 bg-black selection:bg-blue-500 selection:text-white`} suppressHydrationWarning>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <NextAuthProvider>
          <ThemeProvider>
            {children}
            <ClientToaster />
          </ThemeProvider>
        </NextAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

