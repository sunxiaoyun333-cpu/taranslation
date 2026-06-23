import type { CacheEntry } from './types'

const memoryCache = new Map<string, CacheEntry>()

const DEFAULT_TTL = 1000 * 60 * 30 // 30 minutes

function isExpired(entry: CacheEntry): boolean {
  return Date.now() - entry.created_at > entry.ttl
}

function cleanup(): void {
  const now = Date.now()
  for (const [key, entry] of memoryCache.entries()) {
    if (now - entry.created_at > entry.ttl) {
      memoryCache.delete(key)
    }
  }
}

setInterval(cleanup, 1000 * 60 * 5)
cleanup()

export const cache = {
  get<T>(key: string): T | null {
    const entry = memoryCache.get(key)
    if (!entry) return null
    if (isExpired(entry)) {
      memoryCache.delete(key)
      return null
    }
    return entry.value as T
  },

  set<T>(key: string, value: T, ttl = DEFAULT_TTL): void {
    memoryCache.set(key, { key, value, ttl, created_at: Date.now() })
  },

  delete(key: string): void {
    memoryCache.delete(key)
  },

  clear(): void {
    memoryCache.clear()
  },

  size(): number {
    return memoryCache.size
  },

  keys(): string[] {
    return Array.from(memoryCache.keys())
  },
}

export async function getOrCompute<T>(
  key: string,
  compute: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached) return cached

  const result = await compute()
  cache.set(key, result, ttl)
  return result
}
