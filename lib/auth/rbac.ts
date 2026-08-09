/**
 * QRDineX — RBAC (Role-Based Access Control) Authorization Helpers
 * ==========================================================================
 * Centralizes all route-authorization logic so middleware.ts stays thin.
 *
 * Responsibilities:
 *  1. Classify any pathname as PUBLIC, OWNER-only, ADMIN-only, or UNKNOWN
 *  2. Determine whether a given session is permitted to access a pathname
 *  3. Compute the correct redirect target for any denied access scenario
 *
 * Edge-Runtime safe:
 *  - No Prisma imports
 *  - No next/headers imports
 *  - Only pure string/object operations
 *
 * Shared between:
 *  - middleware.ts (route-level gate)
 *  - Server Components / layouts (secondary per-page guard)
 * ==========================================================================
 */

import type { AuthSession, UserRole } from '@/types/auth'

// ---------------------------------------------------------------------------
// ROUTE CLASSIFICATION
// ---------------------------------------------------------------------------

/**
 * Routes that are always accessible regardless of authentication state.
 * Middleware lets these pass through unconditionally.
 *
 * Rules:
 *  - Exact matches: '/'
 *  - Prefix matches: '/menu' covers '/menu/RST-4H8K92' etc.
 *  - Auth pages (/login, /signup) are handled separately — authenticated
 *    users are redirected AWAY from them, not blocked.
 */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/features',
  '/pricing',
  '/about',
  '/contact',
  '/menu',
  '/s',
  '/cart',
  '/orders',
  '/invoice',
] as const

/**
 * Routes exclusively accessible by OWNER role.
 * SUPER_ADMIN is redirected away from these.
 */
export const OWNER_ROUTES = ['/dashboard'] as const

/**
 * Routes exclusively accessible by SUPER_ADMIN role.
 * OWNERs are redirected away from these.
 */
export const ADMIN_ROUTES = ['/admin'] as const

/**
 * Auth pages — special handling:
 *  - Unauthenticated users: allow through
 *  - Authenticated users: redirect to their dashboard
 */
export const AUTH_PAGES = ['/login', '/signup'] as const

// ---------------------------------------------------------------------------
// REDIRECT TARGETS
// ---------------------------------------------------------------------------

export const REDIRECT = {
  /** Destination for unauthenticated users trying to access protected routes */
  LOGIN: '/login',

  /** Destination for OWNERs after login and for OWNER dashboard cross-access */
  OWNER_HOME: '/dashboard/overview',

  /** Destination for SUPER_ADMINs after login and for admin cross-access */
  ADMIN_HOME: '/admin/dashboard',
} as const

// ---------------------------------------------------------------------------
// ROUTE MATCHERS
// ---------------------------------------------------------------------------

/**
 * Returns true if the pathname starts with any of the given route prefixes.
 */
function matchesAny(pathname: string, routes: readonly string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

/**
 * Returns true if the pathname is a public route (no auth required).
 */
export function isPublicRoute(pathname: string): boolean {
  return matchesAny(pathname, PUBLIC_ROUTES)
}

/**
 * Returns true if the pathname is an auth page (/login or /signup).
 */
export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))
}

/**
 * Returns true if the pathname requires the OWNER role.
 */
export function isOwnerRoute(pathname: string): boolean {
  return matchesAny(pathname, OWNER_ROUTES)
}

/**
 * Returns true if the pathname requires the SUPER_ADMIN role.
 */
export function isAdminRoute(pathname: string): boolean {
  return matchesAny(pathname, ADMIN_ROUTES)
}

/**
 * Returns true if the pathname is a known protected route
 * (either OWNER or ADMIN — not public).
 */
export function isProtectedRoute(pathname: string): boolean {
  return isOwnerRoute(pathname) || isAdminRoute(pathname)
}

// ---------------------------------------------------------------------------
// AUTHORIZATION DECISION
// ---------------------------------------------------------------------------

export type AuthDecision =
  | { allow: true }
  | { allow: false; redirectTo: string; clearCookie: boolean }

/**
 * Determines whether a session is authorized to access the given pathname.
 *
 * Call this ONLY after the session has been verified (JWT valid, not expired).
 * This function performs role-level checks, not authentication checks.
 *
 * @param session   The verified AuthSession from the JWT.
 * @param pathname  The requested pathname (from NextRequest.nextUrl.pathname).
 * @returns         AuthDecision — allow or redirect with optional cookie clear.
 */
export function authorize(session: AuthSession, pathname: string): AuthDecision {
  const { role } = session

  // Auth pages — authenticated users must be redirected to their dashboard
  if (isAuthPage(pathname)) {
    return {
      allow: false,
      redirectTo: role === 'SUPER_ADMIN' ? REDIRECT.ADMIN_HOME : REDIRECT.OWNER_HOME,
      clearCookie: false,
    }
  }

  // Admin routes — SUPER_ADMIN only
  if (isAdminRoute(pathname)) {
    if (role === 'SUPER_ADMIN') return { allow: true }
    // OWNER trying to access /admin → redirect to their dashboard
    return { allow: false, redirectTo: REDIRECT.OWNER_HOME, clearCookie: false }
  }

  // Owner routes — OWNER only
  if (isOwnerRoute(pathname)) {
    if (role === 'OWNER') return { allow: true }
    // SUPER_ADMIN trying to access /dashboard → redirect to admin
    return { allow: false, redirectTo: REDIRECT.ADMIN_HOME, clearCookie: false }
  }

  // All other routes — allow (public routes are already short-circuited
  // in middleware before this function is called)
  return { allow: true }
}

/**
 * Returns the correct home route for a given role.
 * Used for post-login redirects and authenticated visits to auth pages.
 */
export function getRoleHome(role: UserRole): string {
  return role === 'SUPER_ADMIN' ? REDIRECT.ADMIN_HOME : REDIRECT.OWNER_HOME
}
