import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Inter } from 'next/font/google'
import { TabBar } from '@/components/tab-bar'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const display = Instrument_Serif({
  variable: '--font-display',
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "Cock 'n Tail",
  description: 'Ingredient sets to riff on, for bartenders who need a starting point.',
  applicationName: "Cock 'n Tail",
  appleWebApp: {
    capable: true,
    title: "Cock 'n Tail",
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets the layout run under the notch and home indicator.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0d0c' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} h-full`}>
      <body className="font-sans min-h-full flex flex-col bg-bg text-ink">
        <main className="flex-1 flex flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <TabBar />
      </body>
    </html>
  )
}
