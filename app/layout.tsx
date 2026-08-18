import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'A special place for our love story',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.svg?v=2', sizes: 'any' },
    ],
    apple: [
      { url: '/favicon.svg?v=2', sizes: '180x180', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg?v=2',
  },
}

export const viewport: Viewport = {
  themeColor: '#0c8b7c',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
