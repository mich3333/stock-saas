import { checkRateLimit } from '@/lib/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should allow requests under the free limit', () => {
    for (let i = 0; i < 60; i++) {
      const result = checkRateLimit('10.0.0.1', 'free')
      expect(result.allowed).toBe(true)
    }
  })

  it('should block requests over the free limit', () => {
    for (let i = 0; i < 60; i++) {
      checkRateLimit('10.0.0.2', 'free')
    }
    const result = checkRateLimit('10.0.0.2', 'free')
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeDefined()
    expect(result.retryAfter!).toBeGreaterThan(0)
  })

  it('should allow more requests for pro tier', () => {
    for (let i = 0; i < 100; i++) {
      const result = checkRateLimit('10.0.0.3', 'pro')
      expect(result.allowed).toBe(true)
    }
  })

  it('should allow more requests for enterprise tier', () => {
    for (let i = 0; i < 500; i++) {
      const result = checkRateLimit('10.0.0.4', 'enterprise')
      expect(result.allowed).toBe(true)
    }
  })

  it('should reset after window expires (sliding window)', () => {
    for (let i = 0; i < 60; i++) {
      checkRateLimit('10.0.0.5', 'free')
    }
    expect(checkRateLimit('10.0.0.5', 'free').allowed).toBe(false)

    jest.advanceTimersByTime(61_000)
    expect(checkRateLimit('10.0.0.5', 'free').allowed).toBe(true)
  })

  it('should return retryAfter in seconds', () => {
    for (let i = 0; i < 60; i++) {
      checkRateLimit('10.0.0.6', 'free')
    }
    const result = checkRateLimit('10.0.0.6', 'free')
    expect(result.retryAfter).toBeLessThanOrEqual(60)
  })
})
