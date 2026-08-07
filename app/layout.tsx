import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ClientToaster from '../components/ClientToaster'
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from '../contexts/ThemeContext'
import { NextAuthProvider } from '@/components/NextAuthProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://easytrader.onrender.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EasyTrader - Smart Billing, Business Suite & AI Workspace for Bharat',
    template: '%s | EasyTrader',
  },
  description: 'AI-powered solution architect and retail operations platform for businesses in Bharat. Smart POS billing, inventory management, AI workspace, customer ledger, and digital storefronts.',
  keywords: [
    'EasyTrader',
    'Smart Billing System',
    'Shopkeeper Management Software',
    'Retail POS Software',
    'Inventory Management System',
    'Invoice Generator',
    'Digital Khata Book',
    'E-commerce Storefront Generator',
    'AI Business Suite',
    'Bharat MSME',
    'Digital Storefront',
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
}

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'EasyTrader',
      description: 'All-in-one smart billing desk, stock inventory manager, and business suite for shopkeepers.',
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'en-US',
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'EasyTrader',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/diagram-export-08-03-2026-15_08_32.png`,
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#software`,
      name: 'EasyTrader Business Suite',
      operatingSystem: 'All',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
      description: 'Smart retail POS, inventory control, automated invoicing, customer ledgers, and e-commerce storefront generation.',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark font-sans ${inter.variable}`} suppressHydrationWarning>
      <head>
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
  )
}
