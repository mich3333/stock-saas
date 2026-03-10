'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, BarChart2, PieChart, Search, Users, Settings, Bell } from 'lucide-react'
import { Watchlist } from '@/components/Watchlist'
import { NewsFeed } from '@/components/NewsFeed'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/screener', label: 'Screener', icon: Search },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [watchlistCollapsed, setWatchlistCollapsed] = useState(false)
  const [newsFeedCollapsed, setNewsFeedCollapsed] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#131722' }}>
      {/* Top nav */}
      <header
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{ height: 48, background: '#1E222D', borderBottom: '1px solid #2A2E39' }}
      >
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <TrendingUp size={18} style={{ color: '#2962FF' }} />
            <span className="font-bold text-sm" style={{ color: '#D1D4DC' }}>StockFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    color: active ? '#D1D4DC' : '#787B86',
                    background: active ? '#2A2E39' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#D1D4DC' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#787B86' }}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
            style={{ background: '#2A2E39', color: '#787B86' }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#26a69a' }} />
            <span>Market Open</span>
          </div>
          <button className="p-1.5 rounded hover:bg-[#2A2E39] transition-colors" style={{ color: '#787B86' }}>
            <Bell size={15} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Watchlist */}
        <Watchlist collapsed={watchlistCollapsed} onToggle={() => setWatchlistCollapsed(v => !v)} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#131722' }}>
          {children}
        </main>

        {/* Right: News/Ideas panel */}
        <NewsFeed collapsed={newsFeedCollapsed} onToggle={() => setNewsFeedCollapsed(v => !v)} />
      </div>
    </div>
  )
}
