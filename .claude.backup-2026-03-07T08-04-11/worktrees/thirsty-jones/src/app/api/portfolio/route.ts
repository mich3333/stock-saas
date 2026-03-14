import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Return mock portfolio for demo
  const portfolio = [
    { symbol: 'AAPL', shares: 10, avgPrice: 150.00 },
    { symbol: 'GOOGL', shares: 5, avgPrice: 140.00 },
    { symbol: 'MSFT', shares: 8, avgPrice: 380.00 },
  ]
  return NextResponse.json({ portfolio })
}
