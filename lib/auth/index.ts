/**
 * QRDineX — Auth Library Barrel Export
 * ==========================================================================
 * Single import point for all authentication utilities.
 *
 * Usage:
 *   import { signAuthToken, verifyAuthToken } from '@/lib/auth'
 *   import { hashPassword, verifyPassword } from '@/lib/auth'
 *   import { requireSession, requireRole } from '@/lib/auth'
 *   import { setAuthCookie, deleteAuthCookie } from '@/lib/auth'
 *   import { authFailure, authSuccess, AUTH_ERROR_MESSAGES } from '@/lib/auth'
 *
 * Note on middleware cookie functions:
 *   getAuthCookieFromRequest, setAuthCookieOnResponse, deleteAuthCookieFromResponse
 *   must be imported directly from '@/lib/auth/cookie' in middleware.ts because
 *   middleware runs in the Edge Runtime and the barrel may pull in next/headers
 *   which is not Edge-compatible. Only import what you need in middleware.
 * ==========================================================================
 */

// JWT utilities
export {
  signAuthToken,
  verifyAuthToken,
  decodeAuthTokenUnsafe,
} from '@/lib/auth/jwt'

// Password utilities
export {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  isSamePassword,
} from '@/lib/auth/password'

// Cookie utilities — Server context (next/headers)
export {
  setAuthCookie,
  getAuthCookie,
  deleteAuthCookie,
} from '@/lib/auth/cookie'

// Session utilities
export {
  getSession,
  getSessionFromRequest,
  requireSession,
  requireRole,
} from '@/lib/auth/session'

// Error utilities
export {
  makeAuthError,
  authFailure,
  authSuccess,
  isAuthSuccess,
  isAuthFailure,
  authErrorToHttpStatus,
  AUTH_ERROR_MESSAGES,
} from '@/lib/auth/errors'

// RBAC utilities (Edge-safe — no Prisma)
export {
  isPublicRoute,
  isAuthPage,
  isOwnerRoute,
  isAdminRoute,
  isProtectedRoute,
  authorize,
  getRoleHome,
  REDIRECT,
  PUBLIC_ROUTES,
  OWNER_ROUTES,
  ADMIN_ROUTES,
} from '@/lib/auth/rbac'
