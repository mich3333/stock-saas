import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import yahooFinance from 'yahoo-finance2'

async function makeSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

export async function GET() {
  try {
  const supabase = await makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: rawPositions, error } = await supabase
    .from('portfolio_positions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type PositionRow = Database['public']['Tables']['portfolio_positions']['Row']
  const positions = (rawPositions || []) as PositionRow[]

  // Fetch current prices for all symbols
  const symbols = positions.map(p => p.symbol)
  const quotes: Record<string, { price: number; change: number; changePercent: number }> = {}

  if (symbols.length > 0) {
    try {
      const results = await Promise.allSettled(
        symbols.map(async (sym) => {
          const q = await yahooFinance.quote(sym) as Record<string, any>
          return {
            symbol: sym,
            price: (q.regularMarketPrice as number) ?? 0,
            change: (q.regularMarketChange as number) ?? 0,
            changePercent: (q.regularMarketChangePercent as number) ?? 0,
          }
        })
      )
      for (const r of results) {
        if (r.status === 'fulfilled') {
          quotes[r.value.symbol] = r.value
        }
      }
    } catch {
      // Continue with positions without live prices
    }
  }

  const portfolio = (positions || []).map(p => ({
    id: p.id,
    symbol: p.symbol,
    shares: p.shares,
    avgPrice: p.avg_price,
    currentPrice: quotes[p.symbol]?.price ?? null,
    change: quotes[p.symbol]?.change ?? null,
    changePercent: quotes[p.symbol]?.changePercent ?? null,
  }))

  return NextResponse.json({ portfolio })
  } catch (error) {
    console.error('GET /api/portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { symbol, shares, avg_price } = body
    if (!symbol || shares == null || avg_price == null) {
      return NextResponse.json({ error: 'Missing required fields: symbol, shares, avg_price' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('portfolio_positions')
      .insert({
        user_id: user.id,
        symbol: symbol.toUpperCase(),
        shares,
        avg_price,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing position id' }, { status: 400 })

    const { error } = await supabase
      .from('portfolio_positions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/portfolio error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
