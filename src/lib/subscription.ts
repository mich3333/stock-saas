import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Tier = 'free' | 'pro' | 'enterprise'

const cache = new Map<string, { tier: Tier; expiresAt: number }>()
const CACHE_TTL = 60_000

function getAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getUserTier(userId: string): Promise<Tier> {
  const cached = cache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tier
  }

  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single()

  const tier: Tier = (data?.tier as Tier) ?? 'free'
  cache.set(userId, { tier, expiresAt: Date.now() + CACHE_TTL })
  return tier
}

export function invalidateTierCache(userId: string) {
  cache.delete(userId)
}
