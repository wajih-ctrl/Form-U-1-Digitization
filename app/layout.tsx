import type { Metadata, Viewport } from 'next'
import { Jost } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AppStateProvider } from '@/lib/store'
import './globals.css'

const jost = Jost({ subsets: ['latin'], variable: '--font-jost', display: 'swap' })

export const metadata: Metadata = {
  title: 'Vessel | Form U-1 Engineering Records',
  description:
    'Capture, extract, review and approve Form U-1 manufacturer data reports.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0b1f2d',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light bg-background ${jost.variable}`}>
      <body className="antialiased font-sans">
        <AppStateProvider>
          <TooltipProvider delay={200}>
            {children}
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </AppStateProvider>
      </body>
    </html>
  )
}
