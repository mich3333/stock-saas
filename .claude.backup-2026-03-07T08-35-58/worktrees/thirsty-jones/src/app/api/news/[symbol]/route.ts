import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import { checkRateLimit } from '@/lib/rate-limiter'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { SubscriptionTier } from '@/lib/tier-limits'

async function getUserTier(): Promise<SubscriptionTier> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'free'
    const { data } = await supabase.from('profiles').select('tier').eq('id', user.id).single()
    return (data as { tier: SubscriptionTier } | null)?.tier ?? 'free'
  } catch {
    return 'free'
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const tier = await getUserTier()
  const { allowed, retryAfter } = checkRateLimit(ip, tier)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const { symbol } = await params
    const result = await yahooFinance.search(symbol.toUpperCase())
    const news = (result as any).news || []
    return NextResponse.json({ news: news.slice(0, 10) })
  } catch {
    return NextResponse.json({ news: [] })
  }
}
