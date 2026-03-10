interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttlSeconds = 60): void {
    this.store.set(key, { data, timestamp: Date.now(), ttl: ttlSeconds * 1000 })
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key)
      return null
    }
    return entry.data
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  size(): number {
    return this.store.size
  }
}

// Singleton instances
export const cache = new MemoryCache()

// smartCache uses the same MemoryCache; when Redis is available via redis.ts,
// the RedisCache in redis.ts wraps it. For direct usage, smartCache = cache.
export const smartCache = cache

// Cache TTLs
export const CACHE_TTL = {
  STOCK_QUOTE: 30,
  HISTORICAL: 300,
  SEARCH: 600,
  NEWS: 300,
}

/**
 * Cache-through wrapper: returns cached value if available, otherwise calls fn and caches result.
 */
export async function cacheWrapper<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const cached = smartCache.get<T>(key)
  if (cached !== null) return cached
  const result = await fn()
  smartCache.set(key, result, ttl)
  return result
}
