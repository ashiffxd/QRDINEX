/**
 * QRDineX — Authentication Constants
 * ==========================================================================
 * Single source of truth for all authentication configuration values.
 * Changing any auth behaviour (cookie name, JWT lifetime, bcrypt cost) is
 * done here — all utilities read from this file, never from inline literals.
 * ==========================================================================
 */

// ---------------------------------------------------------------------------
// COOKIE
// ---------------------------------------------------------------------------

/**
 * The name of the HTTP-only authentication cookie.
 * Used consistently by cookie helpers, middleware, and session utilities.
 * Changing this name will invalidate all active sessions — treat as stable.
 */
export const AUTH_COOKIE_NAME = 'qrdinex_auth' as const

/**
 * Cookie options applied to the authentication cookie on every set operation.
 * These are the security-hardened defaults for production.
 */
export const AUTH_COOKIE_OPTIONS = {
  /** Prevents JavaScript from reading the cookie (XSS protection) */
  httpOnly: true,

  /**
   * Only send over HTTPS in production.
   * Automatically false in development so localhost works without SSL.
   */
  secure: process.env.NODE_ENV === 'production',

  /**
   * SameSite=lax: cookie is sent on top-level navigations from external sites
   * (e.g. clicking a link) but NOT on cross-site sub-requests (XSS/CSRF protection).
   * 'strict' would break OAuth flows if ever added. 'lax' is the right balance.
   */
  sameSite: 'lax' as const,

  /** Cookie is accessible on all paths of the domain */
  path: '/',

  /**
   * Cookie max-age in seconds — matches JWT_EXPIRY_SECONDS.
   * Set explicitly so the browser correctly expires the cookie even if the
   * user closes and reopens the browser.
   */
  maxAge: 60 * 60 * 24, // 24 hours in seconds
} as const

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

/**
 * JWT lifetime as a string accepted by jose's setExpirationTime().
 * Must match AUTH_COOKIE_OPTIONS.maxAge exactly.
 */
export const JWT_EXPIRY = '24h' as const

/**
 * JWT lifetime in seconds — used to compute numeric expiry timestamps.
 * Must match JWT_EXPIRY exactly.
 */
export const JWT_EXPIRY_SECONDS = 60 * 60 * 24 // 24 hours

/**
 * HMAC-SHA256 — the signing algorithm for all QRDineX JWTs.
 * HS256 is symmetric (single shared secret), which is correct for a
 * server-to-server token (no external verification parties needed).
 */
export const JWT_ALGORITHM = 'HS256' as const

/**
 * JWT issuer claim — identifies QRDineX as the token issuer.
 * Validated during token verification to reject tokens from other systems.
 */
export const JWT_ISSUER = 'qrdinex' as const

/**
 * JWT audience claim — identifies the intended recipient.
 */
export const JWT_AUDIENCE = 'qrdinex-app' as const

// ---------------------------------------------------------------------------
// PASSWORD
// ---------------------------------------------------------------------------

/**
 * bcrypt cost factor (work factor).
 * 12 is the production-safe minimum recommended by OWASP.
 * Higher values exponentially increase hashing time:
 *   10 → ~100ms  (too fast for production)
 *   12 → ~300ms  (recommended minimum)
 *   14 → ~1200ms (high-security contexts)
 * Do NOT lower this value. Raising it requires re-hashing all passwords.
 */
export const BCRYPT_COST_FACTOR = 12 as const

/**
 * Minimum password length enforced at the application layer.
 */
export const PASSWORD_MIN_LENGTH = 8 as const

/**
 * Maximum password length to prevent bcrypt DoS attacks.
 * bcrypt silently truncates passwords at 72 bytes — very long passwords
 * all produce the same hash. Reject them explicitly instead.
 */
export const PASSWORD_MAX_LENGTH = 72 as const

// ---------------------------------------------------------------------------
// ENVIRONMENT VARIABLE KEYS
// ---------------------------------------------------------------------------

/** The environment variable name for the JWT signing secret */
export const JWT_SECRET_ENV_KEY = 'JWT_SECRET' as const
