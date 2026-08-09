/**
 * QRDineX — Login API Route Handler
 * POST /api/auth/login
 * ==========================================================================
 * Handles user authentication requests for both SUPER_ADMIN and OWNER roles.
 *
 * Responsibilities:
 *  1. Parse and validate the request body (server-side Zod)
 *  2. Delegate to the login service
 *  3. On success: set the HTTP-only auth cookie and return safe user data
 *  4. On failure: return a consistent error response
 *
 * Cookie is set here — not in the service — to keep the service pure
 * (no HTTP concerns, easily testable without a request context).
 *
 * Response format:
 *   Success 200: { success: true, user: { id, fullName, role, restaurantId } }
 *   Error   401: { success: false, code: string, message: string }
 *   Error   403: { success: false, code: string, message: string }
 *   Error   422: { success: false, code: string, message: string, errors?: ... }
 *   Error   500: { success: false, code: string, message: string }
 * ==========================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { loginSchema } from '@/schemas/login'
import { loginUser } from '@/services/auth/login.service'
import { setAuthCookie } from '@/lib/auth/cookie'
import { authErrorToHttpStatus } from '@/lib/auth/errors'
import { AuthErrorCode } from '@/types/auth'
import { checkRateLimit, getClientIp, RATE_LIMIT_PRESETS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`login_${ip}`, RATE_LIMIT_PRESETS.AUTH.limit, RATE_LIMIT_PRESETS.AUTH.windowMs)

  if (!rl.allowed) {
    logger.warn('RATE_LIMIT_EXCEEDED', { ip, metadata: { type: 'LOGIN_RATE_LIMIT' } })
    return NextResponse.json(
      {
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts. Please wait a minute and try again.',
      },
      { status: 429 }
    )
  }
  // -------------------------------------------------------------------------
  // 1. Parse request body
  // -------------------------------------------------------------------------
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: 'INVALID_REQUEST',
        message: 'Request body must be valid JSON.',
      },
      { status: 400 },
    )
  }

  // -------------------------------------------------------------------------
  // 2. Server-side Zod validation (always re-validate — never trust client)
  // -------------------------------------------------------------------------
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Please provide a valid email address and password.',
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    )
  }

  // -------------------------------------------------------------------------
  // 3. Delegate to the service layer
  // -------------------------------------------------------------------------
  const result = await loginUser(parsed.data)

  // -------------------------------------------------------------------------
  // 4a. Handle failure
  // -------------------------------------------------------------------------
  if (!result.success) {
    const status = authErrorToHttpStatus(result.error)
    return NextResponse.json(
      {
        success: false,
        code: result.error.code,
        message: result.error.message,
      },
      { status },
    )
  }

  // -------------------------------------------------------------------------
  // 4b. Handle success — set HTTP-only cookie, return safe user data
  // -------------------------------------------------------------------------
  const { token, user } = result.data

  // Set the authentication cookie via next/headers
  await setAuthCookie(token)

  logger.audit('USER_LOGIN', {
    userId: user.id,
    restaurantId: user.restaurantId || undefined,
    ip,
    message: `User ${user.fullName} logged in successfully.`,
  })

  // Return only safe fields — never the token itself in the response body
  return NextResponse.json(
    {
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    },
    { status: 200 },
  )
}
