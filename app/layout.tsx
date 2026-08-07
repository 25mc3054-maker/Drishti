import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientToaster from '../components/ClientToaster'
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from '../contexts/ThemeContext'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#05070A',
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://easytrader.onrender.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EasyTrader | Smart Billing, Business Suite & E-Commerce Workspace',
    template: '%s | EasyTrader',
  },
  description: 'Replace manual registers with EasyTrader. An all-in-one AI smart billing desk, stock inventory manager, customer ledger, supplier database, and e-commerce storefront for modern shopkeepers and SMBs.',
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
    'Business Intelligence Workspace'
  ],
  authors: [{ name: 'EasyTrader Team', url: siteUrl }],
  creator: 'EasyTrader',
  publisher: 'EasyTrader',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
    title: 'EasyTrader | Complete Billing & Business Workspace for Shopkeepers',
    description: 'Manage retail billing, stock inventory, customers, suppliers, expenses, and automated storefronts effortlessly with EasyTrader.',
    url: siteUrl,
    siteName: 'EasyTrader',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/diagram-export-08-03-2026-15_08_32.png',
        width: 1200,
        height: 630,
        alt: 'EasyTrader Business Suite Workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyTrader | Complete Billing & Business Workspace',
    description: 'Manage retail billing, stock inventory, customers, suppliers, expenses, and automated storefronts effortlessly with EasyTrader.',
    images: ['/diagram-export-08-03-2026-15_08_32.png'],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <ClientToaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
