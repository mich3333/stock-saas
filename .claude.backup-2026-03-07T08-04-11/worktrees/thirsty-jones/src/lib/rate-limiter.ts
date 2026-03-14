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
