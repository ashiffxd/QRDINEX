/**
 * QRDineX — Restaurant Lifecycle Service
 * ==========================================================================
 * Centralized business logic for modifying a restaurant's lifecycle status.
 * Executes all updates within a single Prisma transaction to ensure
 * data integrity. Validates transitions against the state machine.
 * ==========================================================================
 */

import prisma from '@/lib/prisma'
import { VerificationStatus } from '@prisma/client'
import { RESTAURANT_LIFECYCLE_STATE_MACHINE, RestaurantAction } from '@/types/admin'

export interface LifecycleServiceResult {
  success: boolean
  code?: string
  message?: string
}

/**
 * Updates a restaurant's status according to the strict state machine rules.
 * Automatically inserts an audit log and updates verification records.
 * 
 * @param restaurantId    The UUID of the restaurant
 * @param action          The lifecycle action to perform (APPROVE, REJECT, etc)
 * @param currentAdminId  The UUID of the Super Admin performing the action
 * @param remarks         Optional context (required for REJECT)
 */
export async function updateRestaurantStatus(
  restaurantId: string,
  action: RestaurantAction,
  currentAdminId: string,
  remarks?: string,
): Promise<LifecycleServiceResult> {
  // 1. Validate inputs early
  if (action === RestaurantAction.REJECT && (!remarks || remarks.trim() === '')) {
    return {
      success: false,
      code: 'MISSING_REMARKS',
      message: 'Remarks are required when rejecting a restaurant.',
    }
  }

  try {
    // We execute everything within a $transaction.
    // If any query fails (e.g. concurrent update causes record not found),
    // everything rolls back automatically.
    await prisma.$transaction(async (tx) => {
      // 2. Fetch current state (with FOR UPDATE lock to prevent race conditions if supported by DB)
      // Since Prisma doesn't natively do row-level locks without raw SQL easily in all drivers,
      // we rely on the transactional isolation and a pre-check.
      const restaurant = await tx.restaurant.findUnique({
        where: { id: restaurantId },
        select: { status: true, verification: { select: { id: true } } },
      })

      if (!restaurant) {
        throw new Error('RESTAURANT_NOT_FOUND')
      }

      // 3. Validate transition against state machine
      const targetStatus = RESTAURANT_LIFECYCLE_STATE_MACHINE[restaurant.status][action]

      if (!targetStatus) {
        throw new Error('INVALID_TRANSITION')
      }

      // 4. Update the Restaurant core record
      await tx.restaurant.update({
        where: { id: restaurantId },
        data: { status: targetStatus },
      })

      // 5. Handle Verification Record Updates (only for APPROVE/REJECT)
      if (action === RestaurantAction.APPROVE) {
        if (!restaurant.verification) {
            throw new Error('MISSING_VERIFICATION_RECORD')
        }
        await tx.restaurantVerification.update({
          where: { id: restaurant.verification.id },
          data: {
            approvalStatus: VerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            verifiedBy: currentAdminId,
          },
        })
      } else if (action === RestaurantAction.REJECT) {
        if (!restaurant.verification) {
            throw new Error('MISSING_VERIFICATION_RECORD')
        }
        await tx.restaurantVerification.update({
          where: { id: restaurant.verification.id },
          data: {
            approvalStatus: VerificationStatus.REJECTED,
            remarks: remarks?.trim() || 'No remarks provided.',
          },
        })
      }

      // 6. Insert Immutable Audit Log
      const getReasonPhrase = (act: RestaurantAction) => {
        switch (act) {
          case RestaurantAction.APPROVE: return 'Approved by Super Admin'
          case RestaurantAction.REJECT: return `Rejected by Super Admin. Remarks: ${remarks}`
          case RestaurantAction.ACTIVATE: return 'Activated by Super Admin'
          case RestaurantAction.DEACTIVATE: return 'Deactivated by Super Admin'
        }
      }

      await tx.restaurantStatusLog.create({
        data: {
          restaurantId,
          oldStatus: restaurant.status,
          newStatus: targetStatus,
          reason: getReasonPhrase(action),
          changedBy: currentAdminId,
        },
      })
    })

    return { success: true }
  } catch (error) {
    console.error('[RestaurantLifecycle] Transaction failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown'
    
    if (errorMessage === 'RESTAURANT_NOT_FOUND') {
      return { success: false, code: 'NOT_FOUND', message: 'Restaurant not found.' }
    }
    if (errorMessage === 'INVALID_TRANSITION') {
      return { success: false, code: 'INVALID_TRANSITION', message: 'This lifecycle action is not allowed from the current status.' }
    }
    if (errorMessage === 'MISSING_VERIFICATION_RECORD') {
      return { success: false, code: 'DATA_INTEGRITY_ERROR', message: 'The restaurant is missing its verification record.' }
    }

    return {
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'Failed to update restaurant status due to a database error.',
    }
  }
}
