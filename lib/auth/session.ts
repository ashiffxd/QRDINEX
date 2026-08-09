/**
 * QRDineX — Session Utilities
 * ==========================================================================
 * Resolves the currently authenticated user from the HTTP-only cookie.
 * Provides separate functions for different Next.js execution contexts.
 *
 * Functions provided:
 *
 *   getSession()          — For Server Components and Server Actions.
 *                           Reads the cookie via next/headers, verifies the JWT,
 *                           and returns a typed AuthSession or null.
 *
 *   getSessionFromRequest() — For Middleware (Edge Runtime).
 *                           Reads the cookie from NextRequest, verifies the JWT,
 *                           and returns a typed AuthSession or null.
 *                           Does NOT call next/headers (unavailable in Edge).
 *
 *   requireSession()      — For Server Actions and Route Handlers that must
 *                           abort if the user is not authenticated.
 *                           Returns AuthResult<AuthSession> — never throws.
 *
 *   requireRole()         — For Server Actions and Route Handlers that require
 *                           a specific role (e.g. SUPER_ADMIN only).
 *                           Returns AuthResult<AuthSession> — never throws.
 * ==========================================================================
 */

import type { NextRequest } from 'next/server'
import type { AuthResult, AuthSession, UserRole } from '@/types/auth'
import { AuthErrorCode } from '@/types/auth'
import { getAuthCookie, getAuthCookieFromRequest } from '@/lib/auth/cookie'
import { verifyAuthToken } from '@/lib/auth/jwt'
import { authFailure, authSuccess } from '@/lib/auth/errors'

// ---------------------------------------------------------------------------
// PAYLOAD → SESSION MAPPER
// Converts a verified JwtPayload into the application-level AuthSession shape.
// ---------------------------------------------------------------------------

function buildSession(payload: {
  sub: string
  role: UserRole
  name: string
  restaurantId: string | null
  iat?: number
  exp?: number
}): AuthSession {
  const now = Math.floor(Date.now() / 1000)

  return {
    userId: payload.sub,
    role: payload.role,
    name: payload.name,
    restaurantId: payload.restaurantId,
    issuedAt: new Date((payload.iat ?? now) * 1000),
    expiresAt: new Date((payload.exp ?? now) * 1000),
  }
}

// ---------------------------------------------------------------------------
// GET SESSION — Server Components / Server Actions / Route Handlers
// ---------------------------------------------------------------------------

/**
 * Resolves the current session from the HTTP-only auth cookie.
 *
 * Use in Server Components and Server Actions where next/headers is available.
 * Returns null if:
 *  - The cookie is missing (user not logged in)
 *  - The JWT is expired
 *  - The JWT signature is invalid
 *
 * @returns  AuthSession if authenticated, null if not.
 */
export async function getSession(): Promise<AuthSession | null> {
  const token = await getAuthCookie()
  if (!token) return null

  const result = await verifyAuthToken(token)
  if (!result.valid) return null

  return buildSession(result.payload)
}

// ---------------------------------------------------------------------------
// GET SESSION FROM REQUEST — Middleware (Edge Runtime)
// ---------------------------------------------------------------------------

/**
 * Resolves the current session from a NextRequest's cookie.
 *
 * Use ONLY in middleware — next/headers is not available in Edge Runtime.
 * Same return semantics as getSession() — null for any invalid state.
 *
 * @param request  The incoming NextRequest from middleware.
 * @returns        AuthSession if authenticated, null if not.
 */
export async function getSessionFromRequest(
  request: NextRequest,
): Promise<AuthSession | null> {
  const token = getAuthCookieFromRequest(request)
  if (!token) return null

  const result = await verifyAuthToken(token)
  if (!result.valid) return null

  return buildSession(result.payload)
}

// ---------------------------------------------------------------------------
// REQUIRE SESSION — Server Actions / Route Handlers
// ---------------------------------------------------------------------------

/**
 * Returns the current session or a typed authentication error.
 *
 * Use in Server Actions and Route Handlers that require authentication.
 * The caller checks result.success — no try/catch needed.
 *
 * Example:
 *   const result = await requireSession()
 *   if (!result.success) return { error: result.error.code }
 *   const { userId, role } = result.data
 *
 * @returns  AuthResult<AuthSession> — success with session, or failure with error code.
 */
export async function requireSession(): Promise<AuthResult<AuthSession>> {
  const token = await getAuthCookie()

  if (!token) {
    return authFailure(AuthErrorCode.TOKEN_MISSING, 'No authentication token found.')
  }

  const result = await verifyAuthToken(token)

  if (!result.valid) {
    if (result.reason === 'expired') {
      return authFailure(AuthErrorCode.TOKEN_EXPIRED, 'Authentication token has expired.')
    }
    if (result.reason === 'missing') {
      return authFailure(AuthErrorCode.TOKEN_MISSING, 'No authentication token found.')
    }
    return authFailure(AuthErrorCode.TOKEN_INVALID, 'Authentication token is invalid.')
  }

  return authSuccess(buildSession(result.payload))
}

// ---------------------------------------------------------------------------
// REQUIRE ROLE — Server Actions / Route Handlers
// ---------------------------------------------------------------------------

/**
 * Returns the current session only if the user has one of the required roles.
 *
 * Use in Server Actions and Route Handlers that are role-restricted.
 * Returns UNAUTHORIZED if not authenticated, FORBIDDEN if wrong role.
 *
 * Example:
 *   const result = await requireRole(['SUPER_ADMIN'])
 *   if (!result.success) return { error: result.error.code }
 *   // Guaranteed: result.data.role === 'SUPER_ADMIN'
 *
 * @param allowedRoles  Array of roles that are permitted to proceed.
 * @returns             AuthResult<AuthSession> — session or failure with code.
 */
export async function requireRole(
  allowedRoles: UserRole[],
): Promise<AuthResult<AuthSession>> {
  const sessionResult = await requireSession()

  if (!sessionResult.success) {
    return sessionResult
  }

  const { data: session } = sessionResult

  if (!allowedRoles.includes(session.role)) {
    return authFailure(
      AuthErrorCode.FORBIDDEN,
      `Access denied. Required role(s): ${allowedRoles.join(', ')}. ` +
        `Current role: ${session.role}.`,
    )
  }

  return authSuccess(session)
}
