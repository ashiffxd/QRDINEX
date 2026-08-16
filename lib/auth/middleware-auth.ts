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
  const localPort = process.env.PORT || '3000'
  const urls: string[] = []

  // If we are in production, try local loopback first to avoid Render public routing issues
  if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    urls.push(`http://127.0.0.1:${localPort}/api/restaurant-status?id=${restaurantId}`)
    urls.push(`http://localhost:${localPort}/api/restaurant-status?id=${restaurantId}`)
  }
  urls.push(`${origin}/api/restaurant-status?id=${restaurantId}`)

  let res: Response | null = null
  let lastError: any = null

  for (const url of urls) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    try {
      console.log(`[Middleware] Validating restaurant via URL: ${url}`)
      res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      
      if (res.ok) {
        break
      } else {
        console.warn(`[Middleware] Fetch to ${url} failed with status: ${res.status}`)
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      lastError = error
      console.warn(`[Middleware] Fetch to ${url} threw error:`, error.message || error)
    }
  }

  if (!res || !res.ok) {
    console.error('[Middleware] All validation fetch attempts failed.', lastError)
    return { valid: false, reason: 'db_error' }
  }

  try {
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
    console.error('[Middleware] Failed to parse restaurant validation response:', error)
    return { valid: false, reason: 'db_error' }
  }
}
