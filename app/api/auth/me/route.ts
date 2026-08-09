/**
 * QRDineX — Profile API Route Handler
 * GET /api/auth/me
 * ==========================================================================
 * Returns the authenticated user's profile data.
 * Protected — requires a valid auth cookie (middleware enforces this,
 * but the route also calls requireSession() as a defence-in-depth check).
 *
 * Response:
 *   200: { success: true, profile: UserProfile }
 *   401: { success: false, code: string, message: string }
 *   500: { success: false, code: string, message: string }
 * ==========================================================================
 */

import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { authErrorToHttpStatus } from '@/lib/auth/errors'
import { getProfile } from '@/services/auth/account.service'

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

export async function GET() {
  // -------------------------------------------------------------------------
  // 1. Verify authentication (defence-in-depth — middleware already checked)
  // -------------------------------------------------------------------------
  const sessionResult = await requireSession()

  if (!sessionResult.success) {
    return NextResponse.json(
      {
        success: false,
        code: sessionResult.error.code,
        message: sessionResult.error.message,
      },
      { status: authErrorToHttpStatus(sessionResult.error) },
    )
  }

  // -------------------------------------------------------------------------
  // 2. Fetch profile from service
  // -------------------------------------------------------------------------
  const profileResult = await getProfile(sessionResult.data.userId)

  if (!profileResult.success) {
    return NextResponse.json(
      {
        success: false,
        code: profileResult.error.code,
        message: profileResult.error.message,
      },
      { status: authErrorToHttpStatus(profileResult.error) },
    )
  }

  // -------------------------------------------------------------------------
  // 3. Return safe profile data
  // -------------------------------------------------------------------------
  return NextResponse.json(
    {
      success: true,
      profile: profileResult.data,
    },
    { status: 200 },
  )
}
