/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockSupabaseFrom = jest.fn()
const mockAdminFrom = jest.fn()
const mockCheckoutCreate = jest.fn()
const mockPortalCreate = jest.fn()
const mockConstructEvent = jest.fn()
const mockRetrieveSubscription = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockSupabaseFrom,
  }),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockAdminFrom,
  }),
}))

jest.mock('@/lib/stripe', () => ({
  getStripeConfigStatus: jest.fn(() => ({ valid: true, missing: [] })),
  getPlanPriceId: jest.fn((tier: 'pro' | 'enterprise') => `price_${tier}`),
  getOrCreateCustomer: jest.fn(async () => 'cus_123'),
  getTierFromPriceId: jest.fn((priceId: string) => (priceId === 'price_pro' ? 'pro' : 'enterprise')),
  stripe: {
    checkout: {
      sessions: {
        create: mockCheckoutCreate,
      },
    },
    billingPortal: {
      sessions: {
        create: mockPortalCreate,
      },
    },
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    subscriptions: {
      retrieve: mockRetrieveSubscription,
    },
  },
}))

describe('Stripe billing routes', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123'
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro'
    process.env.STRIPE_ENTERPRISE_PRICE_ID = 'price_enterprise'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  })

  it('returns 401 for unauthenticated checkout', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const { POST } = await import('@/app/api/stripe/checkout/route')
    const req = new NextRequest('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier: 'pro' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns a clear 404 when billing portal has no subscription', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user_1', email: 'test@example.com' } },
    })
    mockSupabaseFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null }),
        }),
      }),
    })

    const { POST } = await import('@/app/api/stripe/portal/route')
    const res = await POST()
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toMatch(/No payment method|No active billing profile/)
  })

  it('syncs checkout completion into profiles and subscriptions', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { user_id: 'user_1' },
          subscription: 'sub_123',
          customer: 'cus_123',
        },
      },
    })
    mockRetrieveSubscription.mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      customer: 'cus_123',
      cancel_at_period_end: false,
      cancel_at: null,
      current_period_start: 1710000000,
      current_period_end: 1712600000,
      items: { data: [{ price: { id: 'price_pro' } }] },
    })

    const updateEq = jest.fn().mockResolvedValue({})
    const upsert = jest.fn().mockResolvedValue({})
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { update: () => ({ eq: updateEq }) }
      }
      if (table === 'subscriptions') {
        return { upsert }
      }
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }
    })

    const { POST } = await import('@/app/api/stripe/webhook/route')
    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-body',
      headers: { 'stripe-signature': 'sig_123' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(upsert).toHaveBeenCalled()
    expect(updateEq).toHaveBeenCalledWith('id', 'user_1')
  })
})
