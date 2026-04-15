'use client'
import { useState, useRef, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart2, PieChart, Search, Users, Settings, Bell, Menu, Grid3X3, LogOut, Globe, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Watchlist } from '@/components/Watchlist'
import { NewsFeed } from '@/components/NewsFeed'
import { useKeyboardShortcuts, SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/markets', label: 'Markets', icon: Globe },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/heatmap', label: 'Heatmap', icon: Grid3X3 },
  { href: '/screener', label: 'Screener', icon: Search },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function isMarketOpen(): boolean {
  // NYSE hours: Mon-Fri 9:30am – 4:00pm Eastern Time
  const now = new Date()
  // Convert to ET (UTC-5 standard, UTC-4 daylight saving)
  // Use Intl to get the current ET hour/minute/weekday reliably
  const etParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) => etParts.find(p => p.type === type)?.value ?? ''
  const weekday = get('weekday') // 'Mon', 'Tue', etc.
  const hour = parseInt(get('hour'), 10)
  const minute = parseInt(get('minute'), 10)
  const isWeekday = !['Sat', 'Sun'].includes(weekday)
  const afterOpen = hour > 9 || (hour === 9 && minute >= 30)
  const beforeClose = hour < 16
  return isWeekday && afterOpen && beforeClose
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [watchlistCollapsed, setWatchlistCollapsed] = useState(false)
  const [marketOpen, setMarketOpen] = useState(isMarketOpen)

  useEffect(() => {
    // Re-check every minute so the indicator updates without a page reload
    const id = setInterval(() => setMarketOpen(isMarketOpen()), 60_000)
    return () => clearInterval(id)
  }, [])
  const [newsFeedCollapsed, setNewsFeedCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)

  useKeyboardShortcuts([
    { ...SHORTCUTS.TOGGLE_SIDEBAR, handler: () => setWatchlistCollapsed(v => !v) },
    { ...SHORTCUTS.NEW_ALERT, handler: () => router.push('/alerts') },
    { ...SHORTCUTS.FOCUS_SEARCH, handler: () => searchRef.current?.focus() },
  ])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="app-shell flex flex-col h-screen overflow-hidden">
      <Suspense><OnboardingModal /></Suspense>
      {/* Top nav */}
      <header
        className="glass-panel flex items-center justify-between px-4 flex-shrink-0 border-b"
        style={{ height: 52 }}
      >
        <div className="flex items-center gap-6">
          <button
            className="md:hidden p-2 rounded-full hover:bg-[var(--accent-soft)] transition-colors text-[var(--text-secondary)]"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Open watchlist"
          >
            <Menu size={16} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-2xl bg-[var(--accent)] shadow-[0_12px_24px_var(--glow)]">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm text-[var(--foreground)]">StockFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--accent-soft)]'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--border)] bg-[var(--panel)] text-[var(--foreground)] hover:bg-[var(--accent-soft)]"
          >
            <LogOut size={13} />
            Sign out
          </button>
          <div
            className="ticker-mono flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-[var(--border)] bg-[var(--panel)]"
            style={{ color: marketOpen ? 'var(--green)' : 'var(--text-secondary)' }}
          >
            <div
              className={marketOpen ? 'w-1.5 h-1.5 rounded-full animate-pulse' : 'w-1.5 h-1.5 rounded-full'}
              style={{ background: marketOpen ? 'var(--green)' : 'var(--red)' }}
            />
            <span>{marketOpen ? 'Market Open' : 'Market Closed'}</span>
          </div>
          <button className="p-2 rounded-full hover:bg-[var(--accent-soft)] transition-colors text-[var(--text-secondary)]">
            <Bell size={15} />
          </button>
          <div className="rounded-full border border-[var(--border)] bg-[var(--panel)] p-0.5">
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden p-2 rounded-full hover:bg-[var(--accent-soft)] transition-colors text-[var(--text-secondary)]"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Mobile watchlist overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              <Watchlist collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Watchlist — desktop only */}
        <div className="hidden md:block">
          <Watchlist collapsed={watchlistCollapsed} onToggle={() => setWatchlistCollapsed(v => !v)} />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Right: News/Ideas panel */}
        <NewsFeed collapsed={newsFeedCollapsed} onToggle={() => setNewsFeedCollapsed(v => !v)} />
      </div>
    </div>
  )
}
