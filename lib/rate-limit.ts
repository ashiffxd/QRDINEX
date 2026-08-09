/**
 * QRDineX — In-Memory Rate Limiter
 * ============================================================
 * Provides token bucket rate limiting for sensitive endpoints
 * (Auth, Customer Ordering, Bill Requests, QR Join Requests).
 *
 * Lightweight, zero external dependencies (no Redis required).
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const cache = new Map<string, RateLimitRecord>()

// Periodically clean up expired keys every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of cache.entries()) {
      if (now > record.resetTime) {
        cache.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetMs: number
}

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const record = cache.get(identifier)

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    }
    cache.set(identifier, newRecord)
    return {
      allowed: true,
      remaining: limit - 1,
      resetMs: windowMs,
    }
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: record.resetTime - now,
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: limit - record.count,
    resetMs: record.resetTime - now,
  }
}

/**
 * Convenience helper to extract client IP from NextRequest headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}

export const RATE_LIMIT_PRESETS = {
  /** Auth routes: 5 attempts per minute per IP */
  AUTH: { limit: 5, windowMs: 60 * 1000 },
  /** Customer order placement: 10 orders per minute per IP */
  ORDER: { limit: 10, windowMs: 60 * 1000 },
  /** Customer request bill: 3 requests per minute per IP */
  BILL_REQUEST: { limit: 3, windowMs: 60 * 1000 },
  /** Participant join request: 5 requests per minute per IP */
  JOIN_REQUEST: { limit: 5, windowMs: 60 * 1000 },
}
