'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SubscriptionStatus } from '@/components/subscription/subscription-status'
import { PriceAlerts } from '@/components/alerts/price-alerts'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { TrendingUp, LogOut, Settings, User } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserEmail(session.user.email ?? null)
      setUserName(session.user.user_metadata?.full_name ?? null)
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 h-16 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={22} />
            <span className="font-bold text-lg text-gray-900 dark:text-white">StockFlow</span>
          </button>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <span>/</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium ml-1">Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings size={22} className="text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>

        {/* Profile section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Profile
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <User size={22} className="text-blue-500" />
            </div>
            <div>
              {userName && (
                <p className="font-semibold text-gray-900 dark:text-white">{userName}</p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail ?? '...'}</p>
            </div>
          </div>
        </section>

        {/* Subscription / Billing section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Subscription & Billing
          </h2>
          <SubscriptionStatus />
        </section>

        {/* Price Alerts section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Price Alerts
          </h2>
          <PriceAlerts />
        </section>
      </div>
    </div>
  )
}
