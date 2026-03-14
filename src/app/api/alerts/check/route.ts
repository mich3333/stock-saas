import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'crypto'
import { Database } from '@/types/database'
import { sendPriceAlert } from '@/lib/email'
import { getSupabaseEnv } from '@/lib/env'

function makeAdminSupabase() {
  const { url } = getSupabaseEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createClient<Database>(url, serviceRoleKey)
}

export async function GET(request: NextRequest) {
  // Verify cron secret using timing-safe comparison to prevent timing attacks
  const authHeader = request.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET ?? ''
  const expected = `Bearer ${cronSecret}`
  let authorized = false
  try {
    authorized = authHeader.length === expected.length &&
      timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  } catch {
    authorized = false
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = makeAdminSupabase()

  type AlertWithProfile = Database['public']['Tables']['alerts']['Row'] & {
    profiles: { email: string } | null
  }

  // Get all active alerts with user emails
  const { data: rawAlerts, error } = await supabase
    .from('alerts')
    .select('*, profiles!inner(email)')
    .eq('is_active', true)
    .is('triggered_at', null)

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const alerts = (rawAlerts ?? []) as unknown as AlertWithProfile[]
  let triggered = 0

  for (const alert of alerts) {
    try {
      // Fetch current price
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stocks/${alert.symbol}`)
      if (!res.ok) continue
      const { quote } = await res.json()
      const price: number = quote?.regularMarketPrice
      if (!price) continue

      const shouldTrigger =
        (alert.condition === 'above' && price >= alert.target_price) ||
        (alert.condition === 'below' && price <= alert.target_price)

      if (shouldTrigger) {
        if (alert.profiles?.email) {
          await sendPriceAlert(alert.profiles.email, alert.symbol, alert.condition, alert.target_price, price)
        }

        await supabase
          .from('alerts')
          .update({ is_active: false, triggered_at: new Date().toISOString() })
          .eq('id', alert.id)

        triggered++
      }
    } catch {
      // Skip failed alerts
    }
  }

  return NextResponse.json({ checked: alerts.length, triggered })
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
