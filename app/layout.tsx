import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  // Per-route layouts supply the page name; this stamps the suffix.
  title: {
    default: 'Our Story',
    template: '%s · Our Story',
  },
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

/**
 * Applies the persisted theme before first paint.
 *
 * ThemeProvider can only touch the DOM in an effect, which runs after the
 * browser has already painted - so a dark-mode user saw a white flash on
 * every navigation. This runs synchronously in <head>, ahead of any paint.
 */
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
