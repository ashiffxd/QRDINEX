/**
 * QRDineX — Login Service
 * ==========================================================================
 * Complete authentication flow for both SUPER_ADMIN and OWNER roles.
 *
 * Flow:
 *  1. Look up user by email (single query — fetches user + restaurant together)
 *  2. If not found → generic INVALID_CREDENTIALS (never reveal account existence)
 *  3. Verify password (timing-safe bcrypt compare)
 *  4. If wrong → generic INVALID_CREDENTIALS (same message as step 2)
 *  5. Role-specific status checks:
 *     - OWNER: restaurant must be ACTIVE
 *     - SUPER_ADMIN: always allowed after credential verification
 *  6. Sign JWT with sub, role, name, restaurantId
 *  7. Return token + safe user data (no password, no internal IDs exposed)
 *
 * Security properties:
 *  - Steps 2 and 4 return the exact same error code and message.
 *    An attacker cannot distinguish "wrong email" from "wrong password".
 *  - Specific messages (PENDING, REJECTED, INACTIVE) are only returned AFTER
 *    credentials are verified — they do not leak account existence.
 *  - Password is never logged or included in return values.
 *  - restaurantId is included in the JWT for OWNERs — middleware can perform
 *    restaurant-scoped authorization without extra DB queries.
 * ==========================================================================
 */

import { UserRole, RestaurantStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { signAuthToken } from '@/lib/auth/jwt'
import { authFailure, authSuccess } from '@/lib/auth/errors'
import { AuthErrorCode, UserRole as AuthUserRole } from '@/types/auth'
import type { AuthResult } from '@/types/auth'
import type { LoginInput } from '@/schemas/login'

// ---------------------------------------------------------------------------
// RETURN TYPE
// ---------------------------------------------------------------------------

/**
 * Safe user data returned on successful login.
 * Never includes password, internal DB metadata, or sensitive PII.
 */
export interface LoginSuccessData {
  /** The signed JWT — must be stored in an HTTP-only cookie by the caller */
  token: string

  /** Safe user representation — safe to send to the client */
  user: {
    id: string
    fullName: string
    role: string
    restaurantId: string | null
  }
}

// ---------------------------------------------------------------------------
// MAIN SERVICE FUNCTION
// ---------------------------------------------------------------------------

/**
 * Authenticates a user with email and password.
 *
 * Returns AuthResult<LoginSuccessData> — callers never need try/catch.
 * The route handler is responsible for setting the HTTP-only cookie.
 */
export async function loginUser(
  input: LoginInput,
): Promise<AuthResult<LoginSuccessData>> {
  // -------------------------------------------------------------------------
  // Step 1: Fetch user by email — include restaurant in the same query
  //         to avoid a second round-trip for OWNER status checks.
  // -------------------------------------------------------------------------
  let dbUser: {
    id: string
    fullName: string
    password: string
    role: UserRole
    restaurant: {
      id: string
      status: RestaurantStatus
    } | null
  } | null

  try {
    dbUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        fullName: true,
        password: true,
        role: true,
        restaurant: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })
  } catch (error) {
    console.error('[Login] Database error during user lookup:', error)
    return authFailure(
      AuthErrorCode.INTERNAL_ERROR,
      'A database error occurred. Please try again.',
    )
  }

  // -------------------------------------------------------------------------
  // Step 2: User not found — return generic error (do NOT reveal account status)
  // -------------------------------------------------------------------------
  if (!dbUser) {
    return authFailure(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password.',
    )
  }

  // -------------------------------------------------------------------------
  // Step 3: Verify password — timing-safe bcrypt compare
  // -------------------------------------------------------------------------
  const passwordResult = await verifyPassword(input.password, dbUser.password)

  if (!passwordResult.success) {
    // Internal error during bcrypt — treat as credential failure
    console.error('[Login] Password verification error for user:', dbUser.id)
    return authFailure(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password.',
    )
  }

  // -------------------------------------------------------------------------
  // Step 4: Password mismatch — same generic error as step 2
  // -------------------------------------------------------------------------
  if (!passwordResult.data) {
    return authFailure(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password.',
    )
  }

  // -------------------------------------------------------------------------
  // Steps 5+: Credentials are verified.
  // Specific status messages are now safe to return — they do NOT leak
  // account existence because we only reach here after successful authentication.
  // -------------------------------------------------------------------------

  let restaurantId: string | null = null

  if (dbUser.role === UserRole.OWNER) {
    // -----------------------------------------------------------------------
    // Step 5a — OWNER: restaurant must exist and be ACTIVE
    // -----------------------------------------------------------------------
    if (!dbUser.restaurant) {
      // Orphaned owner account (restaurant was never created — data integrity issue)
      console.error('[Login] OWNER has no restaurant record:', dbUser.id)
      return authFailure(
        AuthErrorCode.INTERNAL_ERROR,
        'Your account is not correctly configured. Please contact QRDineX support.',
      )
    }

    const { status, id: restId } = dbUser.restaurant

    switch (status) {
      case RestaurantStatus.PENDING:
        return authFailure(
          AuthErrorCode.ACCOUNT_PENDING,
          'Your restaurant is currently under verification. You will be able to log in after approval by the QRDineX administrator.',
        )

      case RestaurantStatus.INACTIVE:
        return authFailure(
          AuthErrorCode.ACCOUNT_INACTIVE,
          'Your account is currently inactive. Please contact QRDineX support.',
        )

      case RestaurantStatus.REJECTED:
        return authFailure(
          AuthErrorCode.ACCOUNT_REJECTED,
          'Your registration request was rejected. Please contact QRDineX.',
        )

      case RestaurantStatus.ACTIVE:
        restaurantId = restId
        break

      default:
        // Exhaustive guard — catches future enum additions
        console.error('[Login] Unknown restaurant status:', status, 'for user:', dbUser.id)
        return authFailure(
          AuthErrorCode.INTERNAL_ERROR,
          'Unable to verify account status. Please contact support.',
        )
    }
  }

  // Step 5b — SUPER_ADMIN: no restaurant check required, proceeds immediately.
  // restaurantId remains null for admins.

  // -------------------------------------------------------------------------
  // Step 6: Sign JWT
  // -------------------------------------------------------------------------
  const tokenResult = await signAuthToken({
    sub: dbUser.id,
    role: dbUser.role as AuthUserRole,
    name: dbUser.fullName,
    restaurantId,
  })

  if (!tokenResult.success) {
    return authFailure(
      AuthErrorCode.INTERNAL_ERROR,
      'Failed to create authentication session. Please try again.',
    )
  }

  // -------------------------------------------------------------------------
  // Step 7: Return token + safe user data
  // The caller (route handler) is responsible for setting the cookie.
  // -------------------------------------------------------------------------
  return authSuccess({
    token: tokenResult.data,
    user: {
      id: dbUser.id,
      fullName: dbUser.fullName,
      role: dbUser.role,
      restaurantId,
    },
  })
}
