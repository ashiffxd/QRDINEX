/**
 * QRDineX — Middleware Authorization Utilities
 * ==========================================================================
 * Node.js-runtime helpers used exclusively by middleware.ts.
 *
 * WHY a separate file?
 *  middleware.ts itself runs in the Next.js Edge Runtime by default.
 *  However, restaurant status validation requires a Prisma/DB call, which
 *  cannot run in Edge. By setting `export const runtime = 'nodejs'` in
 *  middleware.ts, we switch the entire middleware to Node.js runtime, allowing
 *  Prisma imports here safely.
 *
 * What lives here:
 *  - validateOwnerRestaurant(): checks the restaurant's ACTIVE status for
 *    every OWNER request to a protected route. Ensures a restaurant that was
 *    deactivated AFTER the JWT was issued is immediately blocked.
 *
 * NOT in this file:
 *  - JWT verification (in lib/auth/jwt.ts)
 *  - Cookie reading (in lib/auth/cookie.ts)
 *  - Route classification (in lib/auth/rbac.ts)
 * ==========================================================================
 */

import { RestaurantStatus } from '@prisma/client'
import prisma from '@/lib/prisma'

// ---------------------------------------------------------------------------
// RESTAURANT VALIDATION RESULT
// ---------------------------------------------------------------------------

export type RestaurantValidationResult =
  | { valid: true }
  | { valid: false; reason: 'inactive' | 'not_found' | 'db_error' }

/**
 * Validates that the OWNER's restaurant still exists and is ACTIVE.
 *
 * Called on every OWNER access to a protected route (dashboard/**).
 * This catches the case where a Super Admin deactivates a restaurant
 * after the owner has already logged in and holds a valid JWT.
 *
 * The JWT alone cannot reflect post-issuance status changes — this DB check
 * is the authoritative source of truth for restaurant status.
 *
 * @param restaurantId  The restaurant UUID from the JWT payload.
 * @returns             RestaurantValidationResult — valid or invalid with reason.
 */
export async function validateOwnerRestaurant(
  restaurantId: string,
): Promise<RestaurantValidationResult> {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { status: true },
    })

    if (!restaurant) {
      return { valid: false, reason: 'not_found' }
    }

    if (restaurant.status !== RestaurantStatus.ACTIVE) {
      return { valid: false, reason: 'inactive' }
    }

    return { valid: true }
  } catch (error) {
    console.error('[Middleware] Restaurant validation DB error:', error)
    return { valid: false, reason: 'db_error' }
  }
}
