const SENTRY_DSN = process.env.SENTRY_DSN

let sentryInitialized = false

function ensureInit() {
  if (sentryInitialized || !SENTRY_DSN) return false
  sentryInitialized = true
  console.log('[Sentry] Initialized with DSN:', SENTRY_DSN.slice(0, 20) + '...')
  return true
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  ensureInit()
  if (!SENTRY_DSN) return
  console.error('[Sentry] Exception:', error.message, context)
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  ensureInit()
  if (!SENTRY_DSN) return
  console.log(`[Sentry] ${level}:`, message)
}
