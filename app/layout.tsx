import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Drishti Agent - Vision to Value Orchestrator',
  description: 'AI-powered solution architect for businesses in Bharat. Upload images to get instant business insights and optimization plans.',
  keywords: ['AI', 'Business Intelligence', 'Computer Vision', 'Gemini', 'Amazon Hackathon'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  )
}
