import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'StockFlow — Real-Time Stock Market Intelligence',
  description: 'Professional-grade stock analysis for individual investors. Real-time data, beautiful charts, and smart alerts.',
  keywords: ['stocks', 'stock market', 'investing', 'portfolio tracker', 'real-time quotes'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased" style={{ backgroundColor: '#131722', color: '#D1D4DC' }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
