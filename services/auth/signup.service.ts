/**
 * QRDineX — Signup Service
 * ==========================================================================
 * Pure business logic for restaurant owner registration.
 * Contains no HTTP concerns (no Request/Response objects).
 * Called by the API Route Handler after input validation.
 *
 * Transaction:
 *   All four DB writes (User, Restaurant, RestaurantVerification,
 *   RestaurantStatusLog) execute inside a single Prisma transaction.
 *   Any failure rolls back all writes atomically.
 * ==========================================================================
 */

import { UserRole, RestaurantStatus, VerificationStatus } from '@prisma/client'
import { withTransaction } from '@/lib/db-utils'
import { parsePrismaError, PrismaErrorCode } from '@/lib/db-error'
import { hashPassword } from '@/lib/auth/password'
import { generateRestaurantCode } from '@/lib/utils/restaurant-code'
import type { SignupServerInput } from '@/schemas/signup'
import prisma from '@/lib/prisma'

// ---------------------------------------------------------------------------
// RETURN TYPE
// ---------------------------------------------------------------------------

export type SignupServiceResult =
  | { success: true; restaurantCode: string }
  | { success: false; code: SignupErrorCode; message: string; field?: string }

export type SignupErrorCode =
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'

// ---------------------------------------------------------------------------
// PRE-FLIGHT CHECK — email uniqueness
// ---------------------------------------------------------------------------

/**
 * Checks whether an email address is already registered.
 * Runs BEFORE the transaction to give a clean, specific error
 * rather than a generic unique-constraint violation.
 */
async function checkEmailAvailability(email: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  return existing === null // true = available
}

// ---------------------------------------------------------------------------
// MAIN SERVICE FUNCTION
// ---------------------------------------------------------------------------

/**
 * Registers a new restaurant owner account.
 *
 * Steps:
 *  1. Check email uniqueness (pre-flight, outside transaction)
 *  2. Hash the password
 *  3. Generate a unique restaurant code
 *  4. Open a Prisma transaction and:
 *     a. Create User (role = OWNER)
 *     b. Create Restaurant (status = PENDING, linked to User)
 *     c. Create RestaurantVerification (approvalStatus = PENDING)
 *     d. Create RestaurantStatusLog (initial PENDING entry)
 *  5. Return restaurantCode on success
 *
 * Does NOT:
 *  - Log the user in
 *  - Issue a JWT
 *  - Set any cookies
 *
 * @param input  Validated signup data from the API route handler.
 */
export async function signupRestaurantOwner(
  input: SignupServerInput,
): Promise<SignupServiceResult> {
  // -------------------------------------------------------------------------
  // Step 1: Pre-flight — email uniqueness check
  // -------------------------------------------------------------------------
  const isEmailAvailable = await checkEmailAvailability(input.email)
  if (!isEmailAvailable) {
    return {
      success: false,
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'This email address is already registered. Please log in or use a different email.',
      field: 'email',
    }
  }

  // -------------------------------------------------------------------------
  // Step 2: Hash the password
  // -------------------------------------------------------------------------
  const passwordResult = await hashPassword(input.password)
  if (!passwordResult.success) {
    return {
      success: false,
      code: 'WEAK_PASSWORD',
      message: passwordResult.error.message,
      field: 'password',
    }
  }
  const hashedPassword = passwordResult.data

  // -------------------------------------------------------------------------
  // Step 3: Generate unique restaurant code
  // -------------------------------------------------------------------------
  let restaurantCode: string
  try {
    restaurantCode = await generateRestaurantCode()
  } catch (error) {
    console.error('[Signup] Restaurant code generation failed:', error)
    return {
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Unable to complete registration at this time. Please try again.',
    }
  }

  // -------------------------------------------------------------------------
  // Step 4: Atomic transaction — all four writes or none
  // -------------------------------------------------------------------------
  const txResult = await withTransaction(async (tx) => {
    // 4a. Create the owner User record
    const user = await tx.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        password: hashedPassword,
        phoneNumber: input.phoneNumber,
        role: UserRole.OWNER,
      },
      select: { id: true },
    })

    // 4b. Create the Restaurant (PENDING status, linked to User)
    const restaurant = await tx.restaurant.create({
      data: {
        restaurantCode,
        restaurantName: input.restaurantName,
        address: input.address,
        city: input.city,
        status: RestaurantStatus.PENDING,
        ownerId: user.id,
      },
      select: { id: true, restaurantCode: true },
    })

    // 4c. Create the RestaurantVerification record (onboarding workflow)
    await tx.restaurantVerification.create({
      data: {
        restaurantId: restaurant.id,
        approvalStatus: VerificationStatus.PENDING,
        submittedAt: new Date(),
      },
    })

    // 4d. Create the initial RestaurantStatusLog entry
    // Note: oldStatus is not applicable for initial creation.
    // We use PENDING for both oldStatus and newStatus to satisfy
    // the non-nullable constraint while clearly marking this as the
    // first entry via the reason field.
    await tx.restaurantStatusLog.create({
      data: {
        restaurantId: restaurant.id,
        oldStatus: RestaurantStatus.PENDING,
        newStatus: RestaurantStatus.PENDING,
        reason: 'Restaurant registered. Awaiting Super Admin verification.',
        changedBy: null, // No admin performed this — it's a self-registration
      },
    })

    return restaurant.restaurantCode
  })

  // -------------------------------------------------------------------------
  // Step 5: Handle transaction result
  // -------------------------------------------------------------------------
  if (!txResult.success) {
    const parsed = txResult.error

    // Check specifically for a race-condition duplicate email
    // (another request registered the same email between pre-flight and tx)
    if (parsed.code === PrismaErrorCode.UNIQUE_CONSTRAINT) {
      if (parsed.field?.includes('email')) {
        return {
          success: false,
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'This email address is already registered. Please log in or use a different email.',
          field: 'email',
        }
      }
      // restaurantCode collision: extremely rare, but handle it
      if (parsed.field?.includes('restaurantCode')) {
        return {
          success: false,
          code: 'INTERNAL_ERROR',
          message: 'Unable to complete registration at this time. Please try again.',
        }
      }
    }

    return {
      success: false,
      code: 'DATABASE_ERROR',
      message: 'Registration failed due to a database error. Please try again.',
    }
  }

  return { success: true, restaurantCode: txResult.data }
}
