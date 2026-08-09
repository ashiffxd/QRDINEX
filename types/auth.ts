/**
 * QRDineX — Authentication Types
 * ==========================================================================
 * Single source of truth for all authentication-related types and interfaces.
 * These types are shared across JWT utilities, session helpers, middleware,
 * Server Actions, and Route Handlers.
 *
 * Rules:
 *  - Never import Prisma types here — auth types are independent of the ORM.
 *  - Keep types minimal and serialization-safe (suitable for JWT payloads).
 *  - All fields that go into a JWT must be primitives (string | number | boolean).
 * ==========================================================================
 */

// ---------------------------------------------------------------------------
// USER ROLES
// Mirrors the UserRole enum from schema.prisma — defined here independently
// so auth utilities have no dependency on the Prisma client.
// ---------------------------------------------------------------------------

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

// ---------------------------------------------------------------------------
// JWT PAYLOAD
// The exact shape of the claims embedded inside the signed JWT.
// All fields are primitives — objects and arrays cannot be reliably round-
// tripped through JWT encoding in all jose versions.
//
// Security rules:
//  - NEVER include: password, raw email (use it for lookup only), sensitive PII
//  - ALWAYS include: id (for DB lookup), role (for authorization), iat, exp
// ---------------------------------------------------------------------------

export interface JwtPayload {
  /** UUID of the authenticated User record */
  sub: string

  /** User's role — used for authorization without an extra DB round-trip */
  role: UserRole

  /** User's full name — used for display in the UI without a DB call */
  name: string

  /**
   * UUID of the restaurant owned by this user.
   * Null for SUPER_ADMIN (no restaurant).
   * Required for OWNER — avoids an extra DB lookup in every middleware check.
   */
  restaurantId: string | null

  /** Standard JWT issued-at timestamp (seconds since epoch) — set by jose */
  iat?: number

  /** Standard JWT expiry timestamp (seconds since epoch) — set by jose */
  exp?: number
}

// ---------------------------------------------------------------------------
// SESSION
// The decoded, application-level representation of a signed-in user.
// Derived from a verified JwtPayload after signature validation.
// This is what Server Components, Server Actions, and Route Handlers receive.
// ---------------------------------------------------------------------------

export interface AuthSession {
  /** UUID of the authenticated User record */
  userId: string

  /** User's role — drives all authorization decisions */
  role: UserRole

  /** User's full name — for display without a Prisma call */
  name: string

  /**
   * UUID of the owned restaurant. Null for SUPER_ADMIN.
   * Derived from the JWT payload — no extra DB query required.
   */
  restaurantId: string | null

  /** When this session was issued (JS Date derived from JWT iat) */
  issuedAt: Date

  /** When this session expires (JS Date derived from JWT exp) */
  expiresAt: Date
}

// ---------------------------------------------------------------------------
// AUTH RESULT
// Discriminated union returned by all auth operations.
// Eliminates try/catch at the call site — callers check result.success.
// ---------------------------------------------------------------------------

export type AuthResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: AuthError }

// ---------------------------------------------------------------------------
// AUTH ERROR
// Typed error returned from auth operations.
// message is safe to log server-side; NEVER expose it directly in a UI.
// Use the code to map to user-facing messages in the component layer.
// ---------------------------------------------------------------------------

export interface AuthError {
  code: AuthErrorCode
  message: string
}

// ---------------------------------------------------------------------------
// AUTH ERROR CODES
// Used by the component layer to display the correct user-facing message.
// ---------------------------------------------------------------------------

export const AuthErrorCode = {
  // Credential errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  ACCOUNT_PENDING: 'ACCOUNT_PENDING',
  ACCOUNT_REJECTED: 'ACCOUNT_REJECTED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',

  // Password errors
  INCORRECT_CURRENT_PASSWORD: 'INCORRECT_CURRENT_PASSWORD',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  PASSWORD_SAME_AS_CURRENT: 'PASSWORD_SAME_AS_CURRENT',

  // Token errors
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_MALFORMED: 'TOKEN_MALFORMED',

  // Session errors
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Authorization errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Input validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode]

// ---------------------------------------------------------------------------
// PASSWORD VALIDATION RESULT
// ---------------------------------------------------------------------------

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

// ---------------------------------------------------------------------------
// TOKEN VERIFICATION RESULT
// Returned by verifyAuthToken — keeps all token states explicit.
// ---------------------------------------------------------------------------

export type TokenVerificationResult =
  | { valid: true; payload: JwtPayload }
  | { valid: false; reason: 'expired' | 'invalid' | 'missing' }
