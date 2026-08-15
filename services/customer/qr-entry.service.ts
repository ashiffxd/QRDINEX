import prisma from '@/lib/prisma'
import { RestaurantStatus, DiningTableStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------
export type QRErrorType =
  | 'INVALID_QR'
  | 'QR_INACTIVE'
  | 'RESTAURANT_INACTIVE'
  | 'TABLE_UNAVAILABLE'

export interface QRValidationResult {
  success: boolean
  error?: QRErrorType
  data?: {
    qrCodeId: string
    restaurantId: string
    restaurantName: string
    tableId: string
    tableNumber: number
    /** Whether the owner must approve before the customer sees the menu. */
    sessionMode: 'OPEN' | 'APPROVAL'
  }
}

// ---------------------------------------------------------------------------
// QR Entry Service
// ---------------------------------------------------------------------------

/**
 * Validates a QR token scanned by a customer.
 *
 * Rules:
 * 1. Token must exist and be active.
 * 2. Associated Restaurant must be ACTIVE.
 * 3. Associated Table must NOT be OUT_OF_SERVICE.
 *
 * Never exposes full DB models to prevent data leakage.
 * Only returns what is strictly necessary to proceed to the next step.
 *
 * @param token The raw token string from the URL path.
 * @returns QRValidationResult containing safe data or a specific error code.
 */
export async function validateQrToken(token: string): Promise<QRValidationResult> {
  // 1. Fetch QR code with relations
  const qrCode = await prisma.qrCode.findUnique({
    where: { token },
    include: {
      table: {
        include: {
          restaurant: true,
        },
      },
    },
  })

  // 2. Token doesn't exist
  if (!qrCode) {
    return { success: false, error: 'INVALID_QR' }
  }

  // 3. Token exists but is no longer the active one for this table
  if (!qrCode.isActive) {
    return { success: false, error: 'QR_INACTIVE' }
  }

  const { table } = qrCode
  const { restaurant } = table

  // 4. Validate Restaurant Status
  if (restaurant.status !== RestaurantStatus.ACTIVE) {
    return { success: false, error: 'RESTAURANT_INACTIVE' }
  }

  // 5. Validate Table Status
  if (table.status === DiningTableStatus.OUT_OF_SERVICE) {
    return { success: false, error: 'TABLE_UNAVAILABLE' }
  }

  // 6. Success — Return only safe, necessary data
  return {
    success: true,
    data: {
      qrCodeId: qrCode.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.restaurantName,
      tableId: table.id,
      tableNumber: table.tableNumber,
      sessionMode: restaurant.sessionMode,
    },
  }
}
