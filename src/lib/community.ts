import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getSupabaseEnv } from '@/lib/env'

export type CommunityIdeaRecord = Database['public']['Tables']['community_ideas']['Row']

export function getCommunityAdminClient() {
  const { url } = getSupabaseEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  return createClient<Database>(url, serviceRoleKey)
}

export function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return 'Recently'

  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 5) return `${diffWeeks}w ago`

  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function mapTimeframeToPeriod(timeframe: string): '1mo' | '3mo' | '6mo' | '1y' {
  switch (timeframe) {
    case '4H':
    case '1D':
      return '1mo'
    case '1W':
      return '6mo'
    case '1M':
      return '1y'
    default:
      return '3mo'
  }
}
