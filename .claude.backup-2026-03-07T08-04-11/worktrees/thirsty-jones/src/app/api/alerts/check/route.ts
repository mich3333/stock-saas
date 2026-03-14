import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { sendPriceAlert } from '@/lib/email'

function makeAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
    return NextResponse.json({ error: error.message }, { status: 500 })
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
