import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required').optional(),

  // Stripe (optional during development)
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  // Analytics (optional — public key, safe to expose to browser)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

type Env = z.infer<typeof envSchema>

export type EnvValidationError = {
  valid: false
  missing: string[]
  error: string
}

export type EnvValidationSuccess = {
  valid: true
  data: Env
}

/**
 * Validate environment variables without throwing.
 * Returns a discriminated union so callers can handle missing vars gracefully.
 */
export function validateEnvSafe(): EnvValidationSuccess | EnvValidationError {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((e) => e.path.join('.'))
    const error = parsed.error.issues
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n')
    return { valid: false, missing, error }
  }
  return { valid: true, data: parsed.data }
}

function validateEnv(): Env {
  const result = validateEnvSafe()
  if (!result.valid) {
    throw new Error(`Invalid environment variables:\n${result.error}`)
  }
  return result.data
}

// Singleton — validated once at module load
let _env: Env | null = null

export function getEnv(): Env {
  if (!_env) _env = validateEnv()
  return _env
}

/**
 * Returns the required Supabase env vars, or throws a structured NextResponse-
 * compatible error object if they are missing. Use in API routes to avoid
 * crashes when NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are not set.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are not configured')
  }
  return { url, anonKey }
}

export const env = new Proxy({} as Env, {
  get(_target, key: string) {
    return getEnv()[key as keyof Env]
  },
})
