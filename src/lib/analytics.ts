const POSTHOG_KEY = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_POSTHOG_KEY
  : undefined

let initialized = false

function ensureInit() {
  if (initialized || !POSTHOG_KEY || typeof window === 'undefined') return false
  initialized = true
  console.log('[Analytics] PostHog initialized')
  return true
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  ensureInit()
  if (!POSTHOG_KEY) return
  console.log('[Analytics] Track:', event, properties)
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  ensureInit()
  if (!POSTHOG_KEY) return
  console.log('[Analytics] Identify:', userId, traits)
}
