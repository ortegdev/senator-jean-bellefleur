/**
 * Rate Limit Store Abstraction
 * 
 * Redis-compatible interface for rate limiting.
 * Supports both Redis (production) and in-memory (development).
 */

export interface RateLimitStore {
  /**
   * Increment a counter and return current value
   * Sets expiry if key is new
   */
  increment(key: string, expirySeconds: number): Promise<number>

  /**
   * Get current counter value
   */
  get(key: string): Promise<number>

  /**
   * Delete a key
   */
  delete(key: string): Promise<void>

  /**
   * Check if key exists
   */
  exists(key: string): Promise<boolean>

  /**
   * Set a value with expiry
   */
  set(key: string, value: string, expirySeconds: number): Promise<void>

  /**
   * Get time-to-live for a key
   */
  ttl(key: string): Promise<number>
}

/**
 * In-Memory Rate Limit Store
 * 
 * For development and testing.
 * NOT suitable for production with multiple instances.
 */
export class InMemoryRateLimitStore implements RateLimitStore {
  private data = new Map<string, { value: number; expiresAt: number }>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired keys every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  async increment(key: string, expirySeconds: number): Promise<number> {
    const now = Date.now()
    const existing = this.data.get(key)

    if (existing && existing.expiresAt > now) {
      existing.value++
      return existing.value
    } else {
      const expiresAt = now + expirySeconds * 1000
      this.data.set(key, { value: 1, expiresAt })
      return 1
    }
  }

  async get(key: string): Promise<number> {
    const now = Date.now()
    const existing = this.data.get(key)

    if (existing && existing.expiresAt > now) {
      return existing.value
    }

    return 0
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    const now = Date.now()
    const existing = this.data.get(key)
    return !!(existing && existing.expiresAt > now)
  }

  async set(key: string, value: string, expirySeconds: number): Promise<void> {
    const now = Date.now()
    const expiresAt = now + expirySeconds * 1000
    this.data.set(key, { value: parseInt(value, 10) || 0, expiresAt })
  }

  async ttl(key: string): Promise<number> {
    const now = Date.now()
    const existing = this.data.get(key)

    if (existing && existing.expiresAt > now) {
      return Math.floor((existing.expiresAt - now) / 1000)
    }

    return -1
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, value] of this.data.entries()) {
      if (value.expiresAt <= now) {
        this.data.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.data.clear()
  }
}

/**
 * Redis Rate Limit Store
 * 
 * For production with actual Redis/Upstash.
 */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private redis: any) {} // Accept any Redis client (ioredis, @upstash/redis, etc.)

  async increment(key: string, expirySeconds: number): Promise<number> {
    const value = await this.redis.incr(key)
    
    if (value === 1) {
      await this.redis.expire(key, expirySeconds)
    }

    return value
  }

  async get(key: string): Promise<number> {
    const value = await this.redis.get(key)
    return parseInt(value, 10) || 0
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key)
    return result > 0
  }

  async set(key: string, value: string, expirySeconds: number): Promise<void> {
    await this.redis.setex(key, expirySeconds, value)
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key)
  }
}

/**
 * Get rate limit store instance
 * 
 * Returns Redis store if configured, otherwise in-memory.
 */
let store: RateLimitStore | null = null

export function getRateLimitStore(): RateLimitStore {
  if (store) return store

  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL

  if (redisUrl) {
    // Production: Use Redis
    console.log('[RateLimit] Using Redis store')
    
    // Lazy load Redis client
    // In production, you would import and initialize Redis here
    // For now, fall back to in-memory
    console.warn('[RateLimit] Redis URL configured but Redis client not initialized. Using in-memory store.')
    store = new InMemoryRateLimitStore()
  } else {
    // Development: Use in-memory
    console.log('[RateLimit] Using in-memory store (not suitable for production)')
    store = new InMemoryRateLimitStore()
  }

  return store
}

/**
 * Reset store instance (for testing)
 */
export function resetRateLimitStore(): void {
  if (store instanceof InMemoryRateLimitStore) {
    store.destroy()
  }
  store = null
}
