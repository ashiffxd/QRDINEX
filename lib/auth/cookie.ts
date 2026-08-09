/**
 * QRDineX — Auth Cookie Utilities
 * ==========================================================================
 * All HTTP-only cookie operations for the authentication token.
 *
 * Architecture decisions enforced here:
 *  - Authentication state is stored ONLY in an HTTP-only cookie.
 *  - NEVER in localStorage, sessionStorage, or any client-accessible store.
 *  - Cookie name and all options come from constants/auth — never inline.
 *  - Three distinct execution contexts require different cookie APIs:
 *
 *    1. Server Components / Server Actions / Route Handlers
 *       → Use next/headers cookies() — async, requires await.
 *
 *    2. Middleware (Edge Runtime)
 *       → Use NextRequest / NextResponse directly — cookies() is unavailable.
 *       → Middleware cookie functions accept/return Request/Response objects.
 *
 *    3. Client Components
 *       → Cannot read the cookie at all (httpOnly). Do not try.
 *
 * This file provides separate, clearly named functions for each context.
 * ==========================================================================
 */

import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/constants/auth'

// ---------------------------------------------------------------------------
// SERVER CONTEXT — Server Components, Server Actions, Route Handlers
// ---------------------------------------------------------------------------

/**
 * Sets the authentication cookie in a Server Action or Route Handler.
 * This is called immediately after a successful login to persist the JWT.
 *
 * @param token  The signed JWT string to store in the cookie.
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)
}

/**
 * Reads the raw JWT string from the authentication cookie.
 * Returns undefined if the cookie is absent (user is not logged in).
 *
 * Used by session utilities in Server Components and Server Actions.
 *
 * @returns  The raw JWT string, or undefined if not present.
 */
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAME)?.value
}

/**
 * Deletes the authentication cookie, effectively logging the user out.
 *
 * Called by:
 *  - Logout action
 *  - Password change action (force re-login after password update)
 *
 * Deleting the cookie does NOT invalidate the JWT on the server — the token
 * remains cryptographically valid until its exp claim. Since QRDineX uses a
 * 24h lifetime and no refresh tokens, this is the correct and sufficient
 * logout strategy. The cookie is the only delivery mechanism, so removing it
 * prevents all further authenticated requests.
 */
export async function deleteAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

// ---------------------------------------------------------------------------
// MIDDLEWARE CONTEXT — Edge Runtime (middleware.ts)
// ---------------------------------------------------------------------------
// next/headers cookies() is NOT available in middleware.
// Middleware must read cookies from NextRequest and write them to NextResponse.

/**
 * Reads the raw JWT string from a NextRequest's cookies.
 * Safe to call from middleware (Edge Runtime).
 *
 * @param request  The incoming NextRequest from middleware.
 * @returns        The raw JWT string, or undefined if the cookie is absent.
 */
export function getAuthCookieFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value
}

/**
 * Sets the authentication cookie on a NextResponse from middleware.
 * Used when middleware needs to refresh or attach a token to a response.
 *
 * @param response  The NextResponse to attach the cookie to.
 * @param token     The signed JWT string.
 */
export function setAuthCookieOnResponse(
  response: NextResponse,
  token: string,
): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)
}

/**
 * Deletes the authentication cookie on a NextResponse from middleware.
 * Used when middleware detects an invalid/expired token and forces logout.
 *
 * @param response  The NextResponse to remove the cookie from.
 */
export function deleteAuthCookieFromResponse(response: NextResponse): void {
  response.cookies.delete(AUTH_COOKIE_NAME)
}
