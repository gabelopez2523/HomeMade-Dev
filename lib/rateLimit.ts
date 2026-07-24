type RateLimitRecord = { count: number; resetTime: number }

const store = new Map<string, RateLimitRecord>()

// Prune expired entries to prevent unbounded memory growth
function pruneExpired() {
  const now = Date.now()
  store.forEach((record, key) => {
    if (now > record.resetTime) store.delete(key)
  })
}

/**
 * Returns true if the request is allowed, false if it should be blocked.
 * @param key      Unique identifier (e.g. IP address)
 * @param limit    Max requests per window (default: 5)
 * @param windowMs Window duration in ms (default: 60s)
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now()
  const record = store.get(key)

  if (!record || now > record.resetTime) {
    if (store.size > 10_000) pruneExpired()
    store.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) return false

  record.count++
  return true
}
