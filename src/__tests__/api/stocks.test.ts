/**
 * @jest-environment node
 */

jest.mock('@/lib/yahoo-finance', () => ({
  getStockQuote: jest.fn().mockResolvedValue({
    symbol: 'AAPL',
    price: 150.0,
    change: 2.5,
    changePercent: 1.7,
    volume: 50000000,
  }),
  getHistoricalData: jest.fn().mockResolvedValue([
    { date: '2026-01-01', close: 148.0 },
    { date: '2026-01-02', close: 150.0 },
  ]),
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: () => ({ data: { user: null } }) },
    from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: null }) }) }) }),
  }),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ getAll: () => [] })),
}))

import { GET } from '@/app/api/stocks/[symbol]/route'
import { NextRequest } from 'next/server'
import { cache } from '@/lib/cache'

describe('GET /api/stocks/[symbol]', () => {
  beforeEach(() => {
    cache.clear()
  })

  function makeRequest(symbol: string, query = '') {
    const url = `http://localhost:3000/api/stocks/${symbol}${query}`
    const req = new NextRequest(url)
    return GET(req, { params: Promise.resolve({ symbol }) })
  }

  it('should return stock quote data', async () => {
    const res = await makeRequest('AAPL')
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.quote).toBeDefined()
    expect(data.quote.symbol).toBe('AAPL')
    expect(data.quote.price).toBe(150.0)
  })

  it('should include history when requested', async () => {
    const res = await makeRequest('AAPL', '?history=true')
    const data = await res.json()
    expect(data.history).toBeDefined()
    expect(Array.isArray(data.history)).toBe(true)
  })

  it('should handle errors gracefully', async () => {
    const { getStockQuote } = require('@/lib/yahoo-finance')
    getStockQuote.mockRejectedValueOnce(new Error('API Error'))
    const res = await makeRequest('INVALID')
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})
