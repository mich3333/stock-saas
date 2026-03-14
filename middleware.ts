import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public API routes that do not require authentication
const PUBLIC_API_ROUTES = [
  '/api/indices',
  '/api/stocks',
  '/api/news',
  '/api/heatmap',
  '/api/earnings',
  '/api/screener',
  '/api/stripe/webhook', // Stripe verifies its own signature
]

// In-memory rate limiting (per-process; use Redis in multi-instance deployments)
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 60
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) return true
  entry.count++
  return false
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // --- Rate limiting for all API routes ---
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(req)
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  // --- Public API routes pass through ---
  if (pathname.startsWith('/api/') && isPublicApiRoute(pathname)) {
    return NextResponse.next()
  }

  // --- Protected API routes: require valid session (cookie-local check) ---
  if (pathname.startsWith('/api/')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll() { /* read-only context */ },
        },
      }
    )

    // getSession() is local (no network). Individual route handlers that write
    // data call getUser() themselves for strong JWT validation.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.next()
  }

  // --- Protected dashboard routes: redirect to /login if no session ---
  if (pathname.startsWith('/dashboard')) {
    const response = NextResponse.next({ request: req })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // getSession() reads the cookie locally — no network round-trip, so navigation
    // to /dashboard is instant. The actual JWT is still validated by Supabase when
    // server components call getUser() inside the page. This middleware only gates
    // unauthenticated redirects, not data access.
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // All API routes
    '/api/:path*',
    // Dashboard and all sub-routes
    '/dashboard',
    '/dashboard/:path*',
  ],
}
