/**
 * QRDineX — Production Structured Logger & Audit System
 * ============================================================
 * Provides consistent, structured JSON logging for production observability.
 * Automatically masks sensitive data (passwords, tokens, cookies, secrets)
 * and formats audit logs for critical business events.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'audit'

export interface LogPayload {
  event: string
  message?: string
  userId?: string
  restaurantId?: string
  sessionId?: string
  orderId?: string
  invoiceId?: string
  ip?: string
  metadata?: Record<string, any>
  error?: unknown
}

const SENSITIVE_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'jwt',
  'cookie',
  'secret',
  'authorization',
  'creditcard',
  'cardnumber',
])

/**
 * Recursively redacts sensitive keys from metadata payloads.
 */
function redact(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(redact)
  }

  const sanitized: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = redact(val)
    } else {
      sanitized[key] = val
    }
  }
  return sanitized
}

function formatLog(level: LogLevel, payload: LogPayload) {
  const timestamp = new Date().toISOString()
  const sanitizedMeta = payload.metadata ? redact(payload.metadata) : undefined
  const errorMessage = payload.error instanceof Error ? payload.error.message : payload.error

  return JSON.stringify({
    timestamp,
    level: level.toUpperCase(),
    event: payload.event,
    message: payload.message,
    userId: payload.userId,
    restaurantId: payload.restaurantId,
    sessionId: payload.sessionId,
    orderId: payload.orderId,
    invoiceId: payload.invoiceId,
    ip: payload.ip,
    metadata: sanitizedMeta,
    error: errorMessage,
    environment: process.env.NODE_ENV || 'development',
  })
}

export const logger = {
  info(event: string, payload: Omit<LogPayload, 'event'> = {}) {
    console.log(formatLog('info', { event, ...payload }))
  },

  warn(event: string, payload: Omit<LogPayload, 'event'> = {}) {
    console.warn(formatLog('warn', { event, ...payload }))
  },

  error(event: string, payload: Omit<LogPayload, 'event'> = {}) {
    console.error(formatLog('error', { event, ...payload }))
  },

  audit(event: string, payload: Omit<LogPayload, 'event'> = {}) {
    console.log(formatLog('audit', { event, ...payload }))
  },
}
