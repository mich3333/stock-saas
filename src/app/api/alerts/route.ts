import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { canCreateAlerts, SubscriptionTier } from '@/lib/tier-limits'
import { checkRateLimit } from '@/lib/rate-limiter'
import { createLogger } from '@/lib/logger'
import { getSupabaseEnv } from '@/lib/env'
import { sanitizeSymbol, validateSymbol } from '@/lib/security'

const log = createLogger('api/alerts')

async function makeSupabase() {
  const { url, anonKey } = getSupabaseEnv()
  const cookieStore = await cookies()
  return createServerClient<Database>(
    url,
    anonKey,
    { cookies: { getAll() { return cookieStore.getAll() } } }
  )
}

async function getUserTier(supabase: Awaited<ReturnType<typeof makeSupabase>>, userId: string): Promise<SubscriptionTier> {
  const result = await supabase.from('profiles').select('tier').eq('id', userId).single()
  const row = result.data as { tier: SubscriptionTier } | null
  return row?.tier ?? 'free'
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tier = await getUserTier(supabase, user.id)
    const { allowed, retryAfter } = checkRateLimit(ip, tier)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ data })
  } catch (error) {
    log.error('GET /api/alerts error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tier = await getUserTier(supabase, user.id)
    const { allowed, retryAfter } = checkRateLimit(ip, tier)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    if (!canCreateAlerts(tier)) {
      return NextResponse.json(
        { error: 'Upgrade to Pro to create alerts', upgradeUrl: '/pricing' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { symbol, condition, target_price } = body
    if (!symbol || !condition || target_price == null) {
      return NextResponse.json({ error: 'Missing required fields: symbol, condition, target_price' }, { status: 400 })
    }
    const upperSymbol = sanitizeSymbol(String(symbol))
    if (!validateSymbol(upperSymbol)) {
      return NextResponse.json({ error: 'Invalid symbol format' }, { status: 400 })
    }
    if (!['above', 'below'].includes(condition)) {
      return NextResponse.json({ error: 'condition must be "above" or "below"' }, { status: 400 })
    }
    const price = Number(target_price)
    if (!isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'target_price must be a positive number' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert({ user_id: user.id, symbol: upperSymbol, condition, target_price: price })
      .select()
      .single()

    return NextResponse.json({ data, error: error?.message || null }, { status: error ? 400 : 201 })
  } catch (error) {
    log.error('POST /api/alerts error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
    const supabase = await makeSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tier = await getUserTier(supabase, user.id)
    const { allowed, retryAfter } = checkRateLimit(ip, tier)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing alert id' }, { status: 400 })

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: !error, error: error?.message || null })
  } catch (error) {
    log.error('DELETE /api/alerts error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST, DELETE' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST, DELETE' } }) }
