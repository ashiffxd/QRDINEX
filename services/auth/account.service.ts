
import { UserRole } from '@prisma/client'
import prisma from '@/lib/prisma'
import { verifyPassword, hashPassword, isSamePassword } from '@/lib/auth/password'
import { AuthErrorCode } from '@/types/auth'
import { authFailure, authSuccess } from '@/lib/auth/errors'
import type { AuthResult } from '@/types/auth'
import type { ChangePasswordInput } from '@/schemas/change-password'


// PROFILE TYPES


export interface UserProfile {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  role: string
  restaurant: {
    id: string
    restaurantName: string
    restaurantCode: string
    status: string
  } | null
}


// GET PROFILE


/**
 * Fetches the authenticated user's profile data.
 *
 * Returns only safe fields — no password hash, no internal DB timestamps.
 * OWNER profiles include their associated restaurant.
 * SUPER_ADMIN profiles have restaurant: null.
 *
 * @param userId  The authenticated user's UUID (from the verified JWT session).
 */
export async function getProfile(
  userId: string,
): Promise<AuthResult<UserProfile>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        restaurant: {
          select: {
            id: true,
            restaurantName: true,
            restaurantCode: true,
            status: true,
          },
        },
      },
    })

    if (!user) {
      return authFailure(
        AuthErrorCode.ACCOUNT_NOT_FOUND,
        'User account not found.',
      )
    }

    return authSuccess<UserProfile>({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      restaurant:
        user.role === UserRole.OWNER && user.restaurant
          ? {
              id: user.restaurant.id,
              restaurantName: user.restaurant.restaurantName,
              restaurantCode: user.restaurant.restaurantCode,
              status: user.restaurant.status,
            }
          : null,
    })
  } catch (error) {
    console.error('[Account] getProfile DB error:', error)
    return authFailure(
      AuthErrorCode.INTERNAL_ERROR,
      'Failed to retrieve profile. Please try again.',
    )
  }
}

// ---------------------------------------------------------------------------
// CHANGE PASSWORD
// ---------------------------------------------------------------------------

/**
 * Changes a user's password after verifying their current one.
 *
 * Steps:
 *  1. Fetch user's current hashed password from DB
 *  2. Verify currentPassword against the stored hash
 *  3. Check new password differs from current
 *  4. Hash the new password
 *  5. Update the database
 *  6. Return success — cookie clearing is the route handler's responsibility
 *
 * Does NOT:
 *  - Issue a new JWT
 *  - Set or clear any cookie
 *  - Auto-log-in the user
 *
 * @param userId  The authenticated user's UUID (from the verified JWT session).
 * @param input   Validated input containing currentPassword and newPassword.
 */
export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<AuthResult<void>> {
  // -------------------------------------------------------------------------
  // Step 1: Fetch current password hash from DB
  // -------------------------------------------------------------------------
  let currentHash: string

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      return authFailure(
        AuthErrorCode.ACCOUNT_NOT_FOUND,
        'User account not found.',
      )
    }

    currentHash = user.password
  } catch (error) {
    console.error('[Account] changePassword DB lookup error:', error)
    return authFailure(
      AuthErrorCode.INTERNAL_ERROR,
      'Failed to process request. Please try again.',
    )
  }

  // -------------------------------------------------------------------------
  // Step 2: Verify the current password
  // -------------------------------------------------------------------------
  const verifyResult = await verifyPassword(input.currentPassword, currentHash)

  if (!verifyResult.success) {
    return authFailure(
      AuthErrorCode.INTERNAL_ERROR,
      'Failed to verify current password.',
    )
  }

  if (!verifyResult.data) {
    return authFailure(
      AuthErrorCode.INCORRECT_CURRENT_PASSWORD,
      'Your current password is incorrect.',
    )
  }

  // -------------------------------------------------------------------------
  // Step 3: Ensure new password differs from current
  // -------------------------------------------------------------------------
  const samePassword = await isSamePassword(input.newPassword, currentHash)
  if (samePassword) {
    return authFailure(
      AuthErrorCode.PASSWORD_SAME_AS_CURRENT,
      'New password must be different from your current password.',
    )
  }

  // -------------------------------------------------------------------------
  // Step 4: Hash the new password
  // -------------------------------------------------------------------------
  const hashResult = await hashPassword(input.newPassword)
  if (!hashResult.success) {
    return authFailure(
      AuthErrorCode.WEAK_PASSWORD,
      hashResult.error.message,
    )
  }

  // -------------------------------------------------------------------------
  // Step 5: Update the database
  // -------------------------------------------------------------------------
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashResult.data },
    })
  } catch (error) {
    console.error('[Account] changePassword DB update error:', error)
    return authFailure(
      AuthErrorCode.INTERNAL_ERROR,
      'Failed to update password. Please try again.',
    )
  }

  // -------------------------------------------------------------------------
  // Step 6: Return success — the route handler clears the cookie
  // -------------------------------------------------------------------------
  return authSuccess(undefined)
}

/**
 * Updates the user's personal account profile details (fullName, email, phoneNumber).
 */
export async function updateUserProfile(
  userId: string,
  input: { fullName?: string; email?: string; phoneNumber?: string }
): Promise<AuthResult<UserProfile>> {
  const { fullName, email, phoneNumber } = input

  if (fullName !== undefined && !fullName.trim()) {
    return authFailure(AuthErrorCode.INVALID_INPUT, 'Full name cannot be empty.')
  }

  if (email !== undefined) {
    const emailTrimmed = email.trim().toLowerCase()
    if (!emailTrimmed.includes('@')) {
      return authFailure(AuthErrorCode.INVALID_INPUT, 'Invalid email address format.')
    }
    const existing = await prisma.user.findFirst({
      where: {
        email: emailTrimmed,
        id: { not: userId },
      },
    })
    if (existing) {
      return authFailure(AuthErrorCode.EMAIL_ALREADY_EXISTS, 'Email address is already in use.')
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined ? { fullName: fullName.trim() } : {}),
        ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber: phoneNumber.trim() } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        restaurant: {
          select: {
            id: true,
            restaurantName: true,
            restaurantCode: true,
            status: true,
          },
        },
      },
    })

    return authSuccess<UserProfile>({
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
      phoneNumber: updated.phoneNumber,
      role: updated.role,
      restaurant: updated.restaurant,
    })
  } catch (error) {
    console.error('[Account] updateUserProfile error:', error)
    return authFailure(
      AuthErrorCode.INTERNAL_ERROR,
      'Failed to update account profile.',
    )
  }
}
