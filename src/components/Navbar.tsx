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
  { label: 'Brokers', href: '/dashboard', hasDropdown: false },
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
        className="fixed top-0 left-0 right-0 z-50 flex items-center h-12 px-3 gap-2"
        style={{ backgroundColor: '#131722', borderBottom: '1px solid #2A2E39' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 mr-3 flex-shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded" style={{ backgroundColor: '#2962FF' }}>
            <TrendingUp size={16} color="#fff" />
          </div>
          <span className="font-bold text-base" style={{ color: '#2962FF' }}>
            StockFlow
          </span>
        </Link>

        {/* Search bar */}
        <div className="flex items-center flex-1 max-w-xs relative">
          <div
            className="flex items-center w-full h-8 px-3 gap-2 rounded"
            style={{ backgroundColor: '#1E222D', border: '1px solid #2A2E39' }}
          >
            <Search size={14} style={{ color: '#787B86' }} className="flex-shrink-0" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="flex-1 bg-transparent outline-none text-sm min-w-0"
              style={{ color: '#D1D4DC', caretColor: '#2962FF' }}
            />
            <span
              className="hidden sm:flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ color: '#787B86', backgroundColor: '#2A2E39', fontSize: '11px' }}
            >
              Enter
            </span>
          </div>
        </div>

        {/* Nav links — hidden on small screens */}
        <div className="hidden lg:flex items-center ml-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="tv-nav-link flex items-center gap-0.5"
            >
              {link.label}
              {link.hasDropdown && <ChevronDown size={12} style={{ color: '#787B86' }} />}
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auth buttons */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {user ? (
            <>
              <Link href="/dashboard" className="tv-nav-link">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="tv-nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="tv-nav-link">
                Log in
              </Link>
              <Link href="/register" className="tv-btn-primary text-sm">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Hamburger for mobile */}
        <button
          className="lg:hidden p-2 rounded ml-1 flex-shrink-0"
          style={{ color: '#787B86' }}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div
          className="fixed top-12 left-0 right-0 z-40 flex flex-col py-2"
          style={{ background: '#1E222D', borderBottom: '1px solid #2A2E39' }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-2.5 text-sm transition-colors"
              style={{ color: '#D1D4DC' }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="h-px my-1" style={{ background: '#2A2E39' }} />
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-2.5 text-sm"
                style={{ color: '#D1D4DC' }}
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleLogout() }}
                className="px-4 py-2.5 text-sm text-left"
                style={{ color: '#787B86' }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2.5 text-sm"
                style={{ color: '#D1D4DC' }}
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="mx-4 my-2 py-2 rounded text-sm text-center font-medium"
                style={{ background: '#2962FF', color: '#fff' }}
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
