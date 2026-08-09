/**
 * QRDineX — Next.js Middleware (Route Protection & RBAC)
 * ==========================================================================
 * Runs on every matched request BEFORE the page or API route renders.
 * Responsible for:
 *  1. Short-circuiting public routes immediately (no auth check)
 *  2. Reading and verifying the HTTP-only auth cookie
 *  3. Enforcing role-based access control
 *  4. Validating OWNER restaurant status on every protected request
 *  5. Redirecting correctly for all denial scenarios
 *  6. Clearing invalid/expired cookies on the redirect response
 *
 * Runtime: Node.js (not Edge) — required for Prisma restaurant status checks.
 *
 * Import rules — ONLY import from:
 *  - next/server (NextRequest, NextResponse)
 *  - lib/auth/cookie   (getAuthCookieFromRequest, deleteAuthCookieFromResponse)
 *  - lib/auth/session  (getSessionFromRequest)
 *  - lib/auth/rbac     (isPublicRoute, isAuthPage, isOwnerRoute, authorize, etc.)
 *  - lib/auth/middleware-auth (validateOwnerRestaurant)
 *
 * DO NOT import:
 *  - lib/prisma (import is via middleware-auth.ts which handles the runtime boundary)
 *  - next/headers (unavailable in middleware)
 *  - bcryptjs or any non-Edge library directly
 * ==========================================================================
 */

export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getAuthCookieFromRequest,
  deleteAuthCookieFromResponse,
} from '@/lib/auth/cookie'
import { getSessionFromRequest } from '@/lib/auth/session'
import {
  isPublicRoute,
  isAuthPage,
  isOwnerRoute,
  authorize,
  REDIRECT,
} from '@/lib/auth/rbac'
import { validateOwnerRestaurant } from '@/lib/auth/middleware-auth'

// ---------------------------------------------------------------------------
// MIDDLEWARE ENTRY POINT
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // -------------------------------------------------------------------------
  // STEP 1: Public routes — allow unconditionally, no JWT check.
  // Checked first so we never waste time verifying a token for /, /menu/*, etc.
  // -------------------------------------------------------------------------
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // -------------------------------------------------------------------------
  // STEP 2: Read the auth cookie from the request.
  // -------------------------------------------------------------------------
  const rawToken = getAuthCookieFromRequest(request)

  // -------------------------------------------------------------------------
  // STEP 3: Token missing — redirect to /login.
  // -------------------------------------------------------------------------
  if (!rawToken) {
    return redirectToLogin(request)
  }

  // -------------------------------------------------------------------------
  // STEP 4: Verify the JWT (signature + expiry + issuer + audience).
  // getSessionFromRequest wraps verifyAuthToken — returns null on any failure.
  // -------------------------------------------------------------------------
  const session = await getSessionFromRequest(request)

  if (!session) {
    // Token present but invalid or expired — clear the stale cookie and redirect.
    return redirectToLoginAndClearCookie(request)
  }

  // -------------------------------------------------------------------------
  // STEP 5: OWNER — validate restaurant status on every protected route access.
  // This is the critical check that catches post-login restaurant deactivation.
  // If the restaurant's status changed to INACTIVE after the JWT was issued,
  // the JWT is still cryptographically valid but the owner must be blocked.
  // -------------------------------------------------------------------------
  if (session.role === 'OWNER' && isOwnerRoute(pathname)) {
    if (!session.restaurantId) {
      // OWNER JWT has no restaurantId — data integrity issue, force re-login.
      console.error(
        '[Middleware] OWNER session missing restaurantId, forcing logout:',
        session.userId,
      )
      return redirectToLoginAndClearCookie(request)
    }

    const restaurantCheck = await validateOwnerRestaurant(session.restaurantId)

    if (!restaurantCheck.valid) {
      // Restaurant inactive, deleted, or DB error — clear cookie and redirect.
      // A query parameter signals the reason so the login page can display a
      // contextual message without exposing implementation details in the URL.
      const reason =
        restaurantCheck.reason === 'inactive'
          ? 'account_inactive'
          : 'unauthorized'

      return redirectToLoginAndClearCookie(request, reason)
    }
  }

  // -------------------------------------------------------------------------
  // STEP 6: Authorization — check role against requested route.
  // -------------------------------------------------------------------------
  const decision = authorize(session, pathname)

  if (!decision.allow) {
    // Build the redirect response
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = decision.redirectTo

    const response = NextResponse.redirect(redirectUrl)

    if (decision.clearCookie) {
      deleteAuthCookieFromResponse(response)
    }

    return response
  }

  // -------------------------------------------------------------------------
  // STEP 7: All checks passed — allow the request through.
  // Forward the user's identity in request headers so Server Components can
  // read it without re-verifying the JWT on every render.
  // -------------------------------------------------------------------------
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', session.userId)
  requestHeaders.set('x-user-role', session.role)
  requestHeaders.set('x-user-name', session.name)
  if (session.restaurantId) {
    requestHeaders.set('x-restaurant-id', session.restaurantId)
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

// ---------------------------------------------------------------------------
// REDIRECT HELPERS
// ---------------------------------------------------------------------------

/**
 * Redirects the request to /login, preserving the intended destination
 * in a `from` query parameter for post-login redirect.
 * Does NOT clear the cookie (no cookie was present).
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = REDIRECT.LOGIN

  // Preserve the original destination so the login page can redirect back
  const intendedPath = request.nextUrl.pathname
  if (intendedPath !== REDIRECT.LOGIN) {
    loginUrl.searchParams.set('from', intendedPath)
  }

  return NextResponse.redirect(loginUrl)
}

/**
 * Redirects the request to /login AND clears the stale/invalid auth cookie.
 * Used when a token is present but invalid, expired, or the restaurant
 * account has been deactivated after the token was issued.
 *
 * @param reason  Optional query param to show a contextual message on the login page.
 */
function redirectToLoginAndClearCookie(
  request: NextRequest,
  reason?: string,
): NextResponse {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = REDIRECT.LOGIN
  loginUrl.search = '' // Clear any existing query params

  if (reason) {
    loginUrl.searchParams.set('reason', reason)
  }

  const response = NextResponse.redirect(loginUrl)
  deleteAuthCookieFromResponse(response)

  return response
}

// ---------------------------------------------------------------------------
// MATCHER CONFIGURATION
// ---------------------------------------------------------------------------
// The matcher determines which requests invoke this middleware.
// Excluded patterns:
//   - api/*           : API routes handle their own auth via requireSession()
//   - _next/static    : Static assets (JS, CSS, fonts)
//   - _next/image     : Next.js image optimization
//   - favicon.ico     : Browser favicon requests
//   - *.{ext}         : All static file extensions (prevents middleware on assets)

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - /api/* (API routes — auth handled per-route)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico
     * - Files with common static extensions
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)$).*)',
  ],
}
