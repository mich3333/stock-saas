'use client'
import { useState, useRef, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  TrendingUp, Bell, Menu, LogOut, Search, ChevronDown, LayoutGrid, MoreHorizontal, Bookmark,
  MousePointer2, Minus, TrendingUp as TrendLine, Square, Type, Magnet, ZoomIn,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Watchlist } from '@/components/Watchlist'
import { useKeyboardShortcuts, SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/markets', label: 'Markets' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/heatmap', label: 'Heatmap' },
  { href: '/screener', label: 'Screener' },
  { href: '/community', label: 'Community' },
]

const SHELL_LINKS = [
  { label: 'Community', href: '/community' },
  { label: 'Markets', href: '/markets' },
  { label: 'Brokers', href: '/portfolio' },
  { label: 'More', href: '/settings' },
]

const DRAWING_TOOLS = [
  { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
  { id: 'trendline', icon: TrendLine, label: 'Trend Line' },
  { id: 'hline', icon: Minus, label: 'Horizontal Line' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'magnet', icon: Magnet, label: 'Magnet' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
]

function isMarketOpen(): boolean {
  const now = new Date()
  const etParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) => etParts.find(p => p.type === type)?.value ?? ''
  const weekday = get('weekday')
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
  const [activeTool, setActiveTool] = useState('cursor')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const showDrawingTools = pathname.startsWith('/chart')

  useEffect(() => {
    const id = setInterval(() => setMarketOpen(isMarketOpen()), 60_000)
    return () => clearInterval(id)
  }, [])

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
    <div className="app-shell flex flex-col h-screen overflow-hidden" style={{ background: '#131722' }}>
      <Suspense><OnboardingModal /></Suspense>

      {/* Top nav */}
      <header
        className="flex flex-col flex-shrink-0 border-b"
        style={{ background: '#050608', borderColor: '#1f232d' }}
      >
        <div
          className="flex items-center justify-between px-3 md:px-4"
          style={{ height: 46, borderBottom: '1px solid #11141a' }}
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            className="md:hidden p-2 rounded-full transition-colors"
            style={{ color: '#787B86' }}
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Open watchlist"
          >
            <Menu size={16} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-md" style={{ background: '#ffffff' }}>
              <TrendingUp size={15} style={{ color: '#050608' }} />
            </div>
            <span className="font-bold text-[13px] hidden sm:inline" style={{ color: '#f5f7fb' }}>StockFlow</span>
          </Link>

            <div
              className="hidden lg:flex items-center gap-2 rounded-full px-3 shrink-0"
              style={{ height: 32, minWidth: 148, background: '#11141a', border: '1px solid #1f232d' }}
            >
              <Search size={13} style={{ color: '#6b7280' }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search"
                aria-label="Search"
                className="w-full bg-transparent outline-none text-[12px]"
                style={{ color: '#d1d4dc' }}
              />
              <span style={{ fontSize: 10, color: '#6b7280' }}>⌘K</span>
            </div>

            <button
              className="hidden md:inline-flex items-center gap-1.5 px-3 rounded-full text-[12px] font-medium shrink-0"
              style={{ height: 32, background: '#11141a', color: '#f5f7fb', border: '1px solid #1f232d' }}
            >
              Products
              <ChevronDown size={13} />
            </button>

            <nav className="hidden lg:flex items-center gap-0.5 h-full min-w-0 overflow-x-auto">
              {SHELL_LINKS.map(({ href, label }) => {
                const active = href !== '/settings' && pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center px-2.5 text-[12px] font-medium transition-colors rounded-md h-8 shrink-0"
                    style={{
                      color: active ? '#f5f7fb' : '#9ca3af',
                      background: active ? '#0b0e13' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.color = '#f5f7fb'
                        e.currentTarget.style.background = '#0b0e13'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.color = '#9ca3af'
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="ticker-mono hidden sm:flex items-center gap-1.5 px-3 rounded-full text-[11px] border"
              style={{
                height: 32,
                borderColor: '#1f232d',
                background: '#11141a',
                color: '#d1d4dc',
              }}
            >
              <div
                className={`tv-status-dot ${marketOpen ? 'live' : 'closed'}`}
              />
              <span>{marketOpen ? 'Market Open' : 'Market Closed'}</span>
            </div>
            <button
              className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors"
              style={{ color: '#787B86', border: '1px solid #1f232d', background: '#0b0e13' }}
            >
              <Bell size={15} />
            </button>
            <button
              className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors"
              style={{ color: '#787B86', border: '1px solid #1f232d', background: '#0b0e13' }}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors"
              style={{ color: '#787B86', border: '1px solid #1f232d', background: '#0b0e13' }}
            >
              <MoreHorizontal size={14} />
            </button>
            <button
              className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors"
              style={{ color: '#787B86', border: '1px solid #1f232d', background: '#0b0e13' }}
            >
              <Bookmark size={14} />
            </button>
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex items-center gap-1.5 px-3 rounded-full text-[12px] font-medium border transition-colors"
              style={{ height: 32, borderColor: '#1f232d', background: '#11141a', color: '#9ca3af' }}
            >
              <LogOut size={13} />
              Sign out
            </button>
            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded transition-colors"
              style={{ color: '#787B86' }}
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
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
              className="fixed right-0 top-0 bottom-0 z-50 md:hidden"
              initial={{ x: 260 }}
              animate={{ x: 0 }}
              exit={{ x: 260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              <Watchlist collapsed={false} onToggle={() => setMobileMenuOpen(false)} side="right" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Drawing tools toolbar — chart pages only */}
        {showDrawingTools && (
          <div
            className="tv-tools-sidebar hidden md:flex flex-col items-center py-1.5 gap-0.5 flex-shrink-0 border-r"
            style={{ width: 44, borderColor: '#2A2E39' }}
          >
            {DRAWING_TOOLS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                title={label}
                data-label={label}
                onClick={() => setActiveTool(id)}
                className={`tv-tool-btn${activeTool === id ? ' active' : ''} flex items-center justify-center w-[28px] h-[28px] rounded transition-colors`}
                style={{
                  background: activeTool === id ? 'rgba(41,98,255,0.2)' : 'transparent',
                  color: activeTool === id ? '#2962FF' : '#787B86',
                }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        )}

        {/* Main content */}
        <main
          className={`flex-1 ${pathname === '/dashboard' ? 'overflow-hidden' : 'overflow-y-auto'}`}
          style={{ background: '#131722' }}
        >
          {children}
        </main>

        {/* Right: Watchlist — desktop only */}
        <div className="hidden md:block flex-shrink-0">
          <Watchlist
            collapsed={watchlistCollapsed}
            onToggle={() => setWatchlistCollapsed(v => !v)}
            side="right"
          />
        </div>
      </div>
    </div>
  )
}
