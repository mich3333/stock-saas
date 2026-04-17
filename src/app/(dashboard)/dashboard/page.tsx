'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import MarketSummaryChart from '@/components/dashboard/MarketSummaryChart'
import MajorIndicesCard from '@/components/dashboard/MajorIndicesCard'
import CryptoMarketCapCard from '@/components/dashboard/CryptoMarketCapCard'

function DashboardContent() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
    })
  }, [router])

  return (
    <ErrorBoundary>
      <div
        style={{ background: '#131722' }}
        className="h-full overflow-auto p-4"
      >
        <div className="flex flex-col gap-4">
          <MarketSummaryChart />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MajorIndicesCard />
            <CryptoMarketCapCard />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: '#131722' }} className="h-full" />
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
