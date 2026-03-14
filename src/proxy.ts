import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS = 60
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.yahoo.com https://*.yimg.com https://s.yimg.com https://finance.yahoo.com https://logo.clearbit.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://api.stripe.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function applyCSP(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', CSP)
  return response
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
    const key = `rl:${ip}`
    const now = Date.now()
    const entry = rateLimitStore.get(key)
    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    } else if (entry.count >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    } else {
      entry.count++
    }
    return applyCSP(NextResponse.next())
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const response = NextResponse.next({ request: req })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return applyCSP(NextResponse.redirect(new URL('/login', req.url)))
    }

    return applyCSP(response)
  }

  return applyCSP(NextResponse.next())
}

export const config = {
  matcher: ['/api/:path*', '/dashboard', '/dashboard/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
