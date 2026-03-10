import { cache } from '@/lib/cache'

describe('MemoryCache', () => {
  beforeEach(() => {
    cache.clear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should set and get values', () => {
    cache.set('key1', { price: 100 })
    expect(cache.get('key1')).toEqual({ price: 100 })
  })

  it('should return null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull()
  })

  it('should delete keys', () => {
    cache.set('key1', 'value')
    cache.delete('key1')
    expect(cache.get('key1')).toBeNull()
  })

  it('should expire entries after TTL', () => {
    cache.set('key1', 'value', 5) // 5 seconds
    expect(cache.get('key1')).toBe('value')

    jest.advanceTimersByTime(6000)
    expect(cache.get('key1')).toBeNull()
  })

  it('should not expire entries before TTL', () => {
    cache.set('key1', 'value', 10)
    jest.advanceTimersByTime(5000)
    expect(cache.get('key1')).toBe('value')
  })

  it('should track size', () => {
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.size()).toBe(2)
    cache.clear()
    expect(cache.size()).toBe(0)
  })
})
