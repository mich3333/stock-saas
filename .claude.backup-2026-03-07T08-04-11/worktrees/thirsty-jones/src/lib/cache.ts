interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
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

// Singleton cache instance
export const cache = new MemoryCache()

// Cache TTLs
export const CACHE_TTL = {
  STOCK_QUOTE: 30,      // 30 seconds for live quotes
  HISTORICAL: 300,       // 5 minutes for historical data
  SEARCH: 600,          // 10 minutes for search results
  NEWS: 300,            // 5 minutes for news
}
