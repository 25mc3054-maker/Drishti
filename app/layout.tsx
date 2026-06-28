import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientToaster from '../components/ClientToaster'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'EasyTrader - Vision to Value Orchestrator',
  description: 'AI-powered solution architect for businesses in Bharat. Upload images to get instant business insights and optimization plans.',
  keywords: ['AI', 'Business Intelligence', 'Computer Vision', 'Gemini', 'Amazon Hackathon'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <ClientToaster />
      </body>
    </html>
  )
}
