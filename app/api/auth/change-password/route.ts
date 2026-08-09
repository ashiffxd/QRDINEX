/**
 * QRDineX — Change Password API Route Handler
 * POST /api/auth/change-password
 * ==========================================================================
 * Handles authenticated password change requests.
 *
 * Flow:
 *  1. Verify authentication (requireSession — defence-in-depth)
 *  2. Server-side Zod validation of request body
 *  3. Delegate to changePassword service
 *  4. On success: clear auth cookie + return 200
 *  5. On failure: return appropriate error
 *
 * IMPORTANT: On success, the auth cookie is CLEARED.
 * The user MUST log in again with their new password.
 * No new JWT is generated. No auto-login.
 *
 * Response:
 *   200: { success: true, message: string }
 *   401: { success: false, code: string, message: string }
 *   422: { success: false, code: string, message: string, errors?: ... }
 *   500: { success: false, code: string, message: string }
 * ==========================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { deleteAuthCookie } from '@/lib/auth/cookie'
import { authErrorToHttpStatus } from '@/lib/auth/errors'
import { changePasswordServerSchema } from '@/schemas/change-password'
import { changePassword } from '@/services/auth/account.service'

// ---------------------------------------------------------------------------
// POST /api/auth/change-password
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // -------------------------------------------------------------------------
  // 1. Verify authentication
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
  // 2. Parse request body
  // -------------------------------------------------------------------------
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: 'INVALID_REQUEST',
        message: 'Request body must be valid JSON.',
      },
      { status: 400 },
    )
  }

  // -------------------------------------------------------------------------
  // 3. Server-side Zod validation
  // -------------------------------------------------------------------------
  const parsed = changePasswordServerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Please correct the errors and try again.',
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    )
  }

  // -------------------------------------------------------------------------
  // 4. Delegate to service layer
  // -------------------------------------------------------------------------
  const result = await changePassword(sessionResult.data.userId, parsed.data)

  if (!result.success) {
    const statusMap: Record<string, number> = {
      INCORRECT_CURRENT_PASSWORD: 400,
      PASSWORD_SAME_AS_CURRENT: 422,
      ACCOUNT_NOT_FOUND: 404,
      WEAK_PASSWORD: 422,
      INTERNAL_ERROR: 500,
    }

    return NextResponse.json(
      {
        success: false,
        code: result.error.code,
        message: result.error.message,
      },
      { status: statusMap[result.error.code] ?? 500 },
    )
  }

  // -------------------------------------------------------------------------
  // 5. Success — clear auth cookie (user must re-authenticate)
  // -------------------------------------------------------------------------
  await deleteAuthCookie()

  return NextResponse.json(
    {
      success: true,
      message:
        'Your password has been updated successfully. Please log in again with your new password.',
    },
    { status: 200 },
  )
}
