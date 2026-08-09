/**
 * QRDineX — Signup API Route Handler
 * POST /api/auth/signup
 * ==========================================================================
 * Handles restaurant owner registration requests.
 *
 * Responsibilities:
 *  1. Parse and validate the request body (server-side Zod validation)
 *  2. Call the signup service
 *  3. Return a structured JSON response
 *
 * This route does NOT:
 *  - Issue a JWT
 *  - Set authentication cookies
 *  - Log the user in
 *
 * Response format:
 *   Success 201: { success: true, message: string, restaurantCode: string }
 *   Error   4xx: { success: false, code: string, message: string, errors?: ZodFieldErrors }
 *   Error   5xx: { success: false, code: string, message: string }
 * ==========================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { signupServerSchema } from '@/schemas/signup'
import { signupRestaurantOwner } from '@/services/auth/signup.service'

// ---------------------------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // -------------------------------------------------------------------------
  // 1. Parse request body
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
  // 2. Server-side validation (never trust client-side Zod alone)
  // -------------------------------------------------------------------------
  const parsed = signupServerSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors

    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Please correct the errors in the form.',
        errors: fieldErrors,
      },
      { status: 422 },
    )
  }

  // -------------------------------------------------------------------------
  // 3. Call service layer
  // -------------------------------------------------------------------------
  const result = await signupRestaurantOwner(parsed.data)

  // -------------------------------------------------------------------------
  // 4. Map service result to HTTP response
  // -------------------------------------------------------------------------
  if (!result.success) {
    const statusMap: Record<string, number> = {
      EMAIL_ALREADY_EXISTS: 409,
      WEAK_PASSWORD: 422,
      DATABASE_ERROR: 503,
      INTERNAL_ERROR: 500,
    }

    const status = statusMap[result.code] ?? 500

    return NextResponse.json(
      {
        success: false,
        code: result.code,
        message: result.message,
        ...(result.field ? { field: result.field } : {}),
      },
      { status },
    )
  }

  // -------------------------------------------------------------------------
  // 5. Success — account created, pending approval
  // -------------------------------------------------------------------------
  return NextResponse.json(
    {
      success: true,
      message:
        'Your restaurant has been registered successfully. Your account is currently under verification. You will be able to log in after approval by the QRDineX administrator.',
      restaurantCode: result.restaurantCode,
    },
    { status: 201 },
  )
}
