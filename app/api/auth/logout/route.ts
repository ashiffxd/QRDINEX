/**
 * QRDineX — Logout API Route Handler
 * POST /api/auth/logout
 * ==========================================================================
 * Clears the HTTP-only auth cookie and returns a success response.
 *
 * Design decisions:
 *  - POST (not GET) — logout is a state-changing operation; GET would allow
 *    CSRF via an <img> tag or link. POST requires an explicit form/fetch.
 *  - No database changes — JWT invalidation is handled via cookie removal.
 *    The cookie is the sole delivery mechanism, so removing it is sufficient.
 *  - Does NOT redirect — the client handles the redirect after receiving 200.
 *    This allows both fetch-based calls and future SSR actions to use this route.
 *  - Returns 200 even if no cookie was present — idempotent logout is correct
 *    behaviour (logging out an already-logged-out user should not error).
 * ==========================================================================
 */

import { NextResponse } from 'next/server'
import { deleteAuthCookie } from '@/lib/auth/cookie'

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

export async function POST() {
  // Clear the HTTP-only auth cookie
  await deleteAuthCookie()

  return NextResponse.json(
    {
      success: true,
      message: 'You have been logged out successfully.',
    },
    { status: 200 },
  )
}
