/**
 * QRDineX — Middleware Authorization Utilities
 * ==========================================================================
 * Edge-compatible helpers used exclusively by middleware.ts.
 *
 * WHY a separate file?
 *  Originally, middleware.ts set runtime='nodejs' to run database queries.
 *  However, Next.js Middleware strictly executes on the Edge Runtime.
 *  To prevent Prisma Client compilation errors on Edge (which lacks TCP support),
 *  we now execute status validation via a local HTTP fetch request to the
 *  /api/restaurant-status route, which runs in Node.js.
 * ==========================================================================
 */

export type RestaurantValidationResult =
  | { valid: true }
  | { valid: false; reason: 'inactive' | 'not_found' | 'db_error' }

/**
 * Validates that the OWNER's restaurant still exists and is ACTIVE.
 * Calls the local API endpoint to execute the database query safely.
 *
 * @param restaurantId  The restaurant UUID from the JWT payload.
 * @param origin        The server's nextUrl.origin (e.g. http://localhost:3000)
 * @returns             RestaurantValidationResult — valid or invalid with reason.
 */
export async function validateOwnerRestaurant(
  restaurantId: string,
  origin: string,
): Promise<RestaurantValidationResult> {
  try {
    const res = await fetch(`${origin}/api/restaurant-status?id=${restaurantId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      return { valid: false, reason: 'db_error' }
    }

    const data = await res.json()
    if (!data.success) {
      if (data.reason === 'not_found') {
        return { valid: false, reason: 'not_found' }
      }
      return { valid: false, reason: 'db_error' }
    }

    if (!data.active) {
      return { valid: false, reason: 'inactive' }
    }

    return { valid: true }
  } catch (error) {
    console.error('[Middleware] Restaurant validation fetch error:', error)
    return { valid: false, reason: 'db_error' }
  }
}
