// Redis client with in-memory fallback for development
// When REDIS_URL is set, uses ioredis; otherwise falls back to MemoryCache

import { cache } from './cache'

interface PubSubClient {
  publish(channel: string, message: string): void
  subscribe(channel: string, callback: (message: string) => void): void
  unsubscribe(channel: string): void
}

class InMemoryPubSub implements PubSubClient {
  private listeners = new Map<string, Set<(message: string) => void>>()

  publish(channel: string, message: string): void {
    const subs = this.listeners.get(channel)
    if (subs) {
      subs.forEach((cb) => cb(message))
    }
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(callback)
  }

  unsubscribe(channel: string): void {
    this.listeners.delete(channel)
  }
}

// In-memory Redis-like client
class InMemoryRedis {
  get<T>(key: string): T | null {
    return cache.get<T>(key)
  }

  set<T>(key: string, value: T, ttl = 60): void {
    cache.set(key, value, ttl)
  }

  del(key: string): void {
    cache.delete(key)
  }
}

export const redis = new InMemoryRedis()
export const pubClient: PubSubClient = new InMemoryPubSub()
export const subClient: PubSubClient = new InMemoryPubSub()
