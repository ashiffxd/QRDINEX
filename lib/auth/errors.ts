/**
 * QRDineX — Auth Error Utilities
 * ==========================================================================
 * Typed factories for constructing AuthError and AuthResult objects.
 * Eliminates boilerplate and ensures consistent error shapes across all
 * auth utilities, Server Actions, and Route Handlers.
 *
 * Usage:
 *   return authError(AuthErrorCode.INVALID_CREDENTIALS, 'Email or password is incorrect')
 *   return authSuccess({ userId, role, name })
 * ==========================================================================
 */

import type { AuthError, AuthResult, AuthErrorCode } from '@/types/auth'

// ---------------------------------------------------------------------------
// ERROR FACTORIES
// ---------------------------------------------------------------------------

/**
 * Construct a typed AuthError object.
 * Use this to build the error half of an AuthResult.
 */
export function makeAuthError(
  code: AuthErrorCode,
  message: string,
): AuthError {
  return { code, message }
}

/**
 * Construct a failed AuthResult.
 * Use this as the return value from any auth function that encounters an error.
 */
export function authFailure<T = void>(
  code: AuthErrorCode,
  message: string,
): AuthResult<T> {
  return { success: false, error: { code, message } }
}

/**
 * Construct a successful AuthResult carrying typed data.
 * Use this as the return value when an auth operation completes successfully.
 */
export function authSuccess<T>(data: T): AuthResult<T> {
  return { success: true, data }
}

// ---------------------------------------------------------------------------
// TYPE GUARD
// ---------------------------------------------------------------------------

/**
 * Narrows an AuthResult to the success branch.
 * Useful in Server Actions and Route Handlers to avoid double-checking.
 *
 * Example:
 *   const result = await verifyToken(token)
 *   if (isAuthSuccess(result)) {
 *     // result.data is fully typed here
 *   }
 */
export function isAuthSuccess<T>(
  result: AuthResult<T>,
): result is { success: true; data: T } {
  return result.success === true
}

/**
 * Narrows an AuthResult to the failure branch.
 */
export function isAuthFailure<T>(
  result: AuthResult<T>,
): result is { success: false; error: AuthError } {
  return result.success === false
}

// ---------------------------------------------------------------------------
// HTTP STATUS MAPPING
// Maps AuthErrorCode to HTTP status codes for Route Handlers.
// Server Actions should translate these into user-facing messages instead.
// ---------------------------------------------------------------------------

import { AuthErrorCode as Code } from '@/types/auth'

export function authErrorToHttpStatus(error: AuthError): number {
  switch (error.code) {
    case Code.ACCOUNT_NOT_FOUND:
    case Code.INVALID_CREDENTIALS:
    case Code.INCORRECT_CURRENT_PASSWORD:
      return 401

    case Code.FORBIDDEN:
      return 403

    case Code.SESSION_NOT_FOUND:
    case Code.TOKEN_MISSING:
      return 401

    case Code.TOKEN_EXPIRED:
    case Code.SESSION_EXPIRED:
      return 401

    case Code.TOKEN_INVALID:
    case Code.TOKEN_MALFORMED:
      return 401

    case Code.UNAUTHORIZED:
      return 401

    case Code.ACCOUNT_PENDING:
    case Code.ACCOUNT_REJECTED:
    case Code.ACCOUNT_INACTIVE:
      return 403

    case Code.WEAK_PASSWORD:
    case Code.PASSWORD_SAME_AS_CURRENT:
      return 422

    case Code.INTERNAL_ERROR:
    default:
      return 500
  }
}

// ---------------------------------------------------------------------------
// USER-FACING MESSAGE MAP
// Maps AuthErrorCode to safe, generic messages for the UI.
// These messages deliberately avoid leaking whether an account exists.
// ---------------------------------------------------------------------------

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_NOT_FOUND: 'Invalid email or password.',        // Intentionally generic
  ACCOUNT_PENDING: 'Your account is pending approval. Please wait for Super Admin review.',
  ACCOUNT_REJECTED: 'Your account registration was rejected. Please contact support.',
  ACCOUNT_INACTIVE: 'Your account has been suspended. Please contact support.',
  INCORRECT_CURRENT_PASSWORD: 'Your current password is incorrect.',
  WEAK_PASSWORD: 'Password does not meet the security requirements.',
  PASSWORD_SAME_AS_CURRENT: 'New password must be different from your current password.',
  TOKEN_MISSING: 'Authentication required. Please log in.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid session. Please log in again.',
  TOKEN_MALFORMED: 'Invalid session. Please log in again.',
  SESSION_NOT_FOUND: 'Session not found. Please log in.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
} as const
