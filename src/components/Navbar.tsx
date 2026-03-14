'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, ChevronDown, TrendingUp, Menu, X } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { label: 'Products', href: '/dashboard', hasDropdown: false },
  { label: 'Community', href: '/community', hasDropdown: false },
  { label: 'Markets', href: '/screener', hasDropdown: false },
  { label: 'Pricing', href: '/pricing', hasDropdown: false },
]

export default function Navbar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/screener?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <nav
        className="market-nav fixed top-0 left-0 right-0 z-50 flex items-center h-16 px-4 md:px-6 gap-3"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-3 flex-shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-[var(--foreground)] shadow-[0_10px_28px_rgba(15,23,42,0.14)]">
            <TrendingUp size={16} color="#fff" />
          </div>
          <span className="font-bold text-[1.1rem] text-[var(--foreground)]">
            StockFlow
          </span>
        </Link>

        {/* Search bar */}
        <div className="hidden md:flex items-center flex-1 max-w-[15rem] relative">
          <div
            className="flex items-center w-full h-10 px-3 gap-2 rounded-full market-pill"
          >
            <Search size={14} className="flex-shrink-0 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search (#K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="flex-1 bg-transparent outline-none text-[13px] min-w-0 text-[var(--foreground)] placeholder:text-[var(--text-secondary)]"
              style={{ caretColor: 'var(--accent)' }}
            />
            <span className="ticker-mono hidden sm:flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 bg-[var(--panel)] text-[var(--text-secondary)] border border-[var(--border)]">
              ⌘K
            </span>
          </div>
        </div>

        {/* Nav links — hidden on small screens */}
        <div className="hidden lg:flex items-center ml-2 gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="tv-nav-link flex items-center gap-0.5 px-4 py-2.5"
            >
              {link.label}
              {link.hasDropdown && <ChevronDown size={12} className="text-[var(--text-secondary)]" />}
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auth buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
              <Link href="/settings" className="tv-nav-link hidden md:inline-flex">
                Settings
              </Link>
              <Link href="/dashboard" className="tv-nav-link hidden sm:inline-flex">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="tv-nav-link hidden sm:inline-flex"
                style={{ background: 'none', cursor: 'pointer' }}
              >
                Log out
              </button>
              <button
                onClick={handleLogout}
                className="sm:hidden px-3 py-2 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--foreground)] bg-[var(--panel)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="tv-nav-link text-xs sm:text-sm">
                Sign in
              </Link>
              <Link href="/register" className="tv-btn-primary text-sm hidden sm:inline-flex px-5 py-2.5">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Hamburger for mobile */}
        <button
          className="lg:hidden p-2 rounded-full ml-1 flex-shrink-0 text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div
          className="glass-panel-strong fixed top-14 left-3 right-3 z-40 flex flex-col py-2 rounded-3xl"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-2.5 text-sm transition-colors text-[var(--foreground)]"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="h-px my-1 bg-[var(--border)]" />
          {user ? (
            <>
              <Link
                href="/settings"
                className="px-4 py-2.5 text-sm text-[var(--foreground)]"
                onClick={() => setMobileOpen(false)}
              >
                Settings
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2.5 text-sm text-[var(--foreground)]"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleLogout() }}
                className="px-4 py-2.5 text-sm text-left text-[var(--text-secondary)]"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2.5 text-sm text-[var(--foreground)]"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="tv-btn-primary mx-4 my-2 py-2 rounded-full text-sm text-center font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </>
  )
}
