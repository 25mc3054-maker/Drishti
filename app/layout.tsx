import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ClientToaster from '../components/ClientToaster'

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easytrader.onrender.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'EasyTrader - Vision to Value Orchestrator for Bharat',
    template: '%s | EasyTrader',
  },
  description: 'AI-powered solution architect and retail operations platform for businesses in Bharat. Smart POS billing, inventory management, AI workspace, and customer digital storefronts.',
  keywords: [
    'EasyTrader',
    'AI Retail',
    'Kirana Billing Software',
    'Smart POS India',
    'Inventory Management System',
    'Bharat MSME',
    'Computer Vision Analytics',
    'Digital Storefront',
    'Amazon Hackathon',
  ],
  authors: [{ name: 'EasyTrader Team' }],
  creator: 'EasyTrader',
  publisher: 'EasyTrader',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'EasyTrader - Vision to Value Orchestrator for Bharat',
    description: 'Empowering local retail & enterprises with AI-driven inventory, instant billing, customer insights, and digital storefronts.',
    url: siteUrl,
    siteName: 'EasyTrader',
    images: [
      {
        url: `${siteUrl}/diagram-export-08-03-2026-15_08_32.png`,
        width: 1200,
        height: 630,
        alt: 'EasyTrader Vision to Value Platform Overview',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyTrader - Vision to Value Orchestrator for Bharat',
    description: 'AI-powered retail business suite, vision analytics, smart billing, and inventory management for India.',
    images: [`${siteUrl}/diagram-export-08-03-2026-15_08_32.png`],
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
  alternates: {
    canonical: siteUrl,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'EasyTrader',
  operatingSystem: 'Web, Android, iOS',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  description: 'AI-powered retail business suite, vision analytics, smart billing, inventory management, and customer storefront for Bharat.',
  url: siteUrl,
  author: {
    '@type': 'Organization',
    name: 'EasyTrader',
    url: siteUrl,
  },
}
 
import { NextAuthProvider } from '@/components/NextAuthProvider'

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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased text-slate-100 bg-black selection:bg-blue-500 selection:text-white" suppressHydrationWarning>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
        <ClientToaster />
      </body>
    </html>
  )
}

