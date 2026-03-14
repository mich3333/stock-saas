import { NextRequest, NextResponse } from 'next/server'
import { searchSymbols } from '@/lib/yahoo-finance'
import { checkRateLimit } from '@/lib/rate-limiter'

const MAX_QUERY_LENGTH = 100

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, retryAfter } = checkRateLimit(ip, 'free')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query || !query.trim()) return NextResponse.json({ results: [] })
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 })
  }

  try {
    const results = await searchSymbols(query.trim())
    // Normalize to the shape callers expect: { symbol, shortname, exchange }
    return NextResponse.json({
      results: results.map((r) => ({
        symbol: r.symbol,
        shortname: r.name,
        exchange: r.exchange,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Live search is temporarily unavailable' }, { status: 502 })
  }
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
