import { SubscriptionTier } from '@/lib/tier-limits'

interface WindowEntry {
  timestamps: number[]
}

const windows = new Map<string, WindowEntry>()

const LIMITS: Record<SubscriptionTier, number> = {
  free: 60,
  pro: 300,
  enterprise: 1000,
}

const WINDOW_MS = 60_000 // 1 minute sliding window

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of windows.entries()) {
    entry.timestamps = entry.timestamps.filter(t => now - t < WINDOW_MS)
    if (entry.timestamps.length === 0) windows.delete(key)
  }
}

// Periodically clean up expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, 60_000)
}

export function checkRateLimit(
  ip: string,
  tier: SubscriptionTier = 'free'
): { allowed: boolean; retryAfter?: number } {
  const limit = LIMITS[tier]
  const now = Date.now()
  const key = `${ip}:${tier}`

  let entry = windows.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    windows.set(key, entry)
  }

  // Slide the window
  entry.timestamps = entry.timestamps.filter(t => now - t < WINDOW_MS)

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0]
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.timestamps.push(now)
  return { allowed: true }
}

/** Redis-backed rate limiter using sorted sets (falls back to in-memory) */
export function checkRateLimitRedis(
  ip: string,
  tier: SubscriptionTier = 'free'
): { allowed: boolean; retryAfter?: number } {
  // Redis sorted-set based rate limiting would go here when a real Redis client is available.
  // For now, delegate to the in-memory implementation which uses the same algorithm.
  return checkRateLimit(ip, tier)
}
