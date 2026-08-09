/**
 * QRDineX — Restaurant Lifecycle Status API
 * PATCH /api/admin/restaurants/:restaurantId/status
 * ==========================================================================
 * Unified endpoint for processing lifecycle transitions.
 * Protected by SUPER_ADMIN role assertion.
 * ==========================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/session'
import { authErrorToHttpStatus } from '@/lib/auth/errors'
import { RestaurantAction } from '@/types/admin'
import { updateRestaurantStatus } from '@/services/admin/restaurant-lifecycle.service'

const updateStatusSchema = z.object({
  action: z.nativeEnum(RestaurantAction, {
    errorMap: () => ({ message: 'Invalid lifecycle action provided.' }),
  }),
  remarks: z.string().optional(),
}).refine(
  (data) => {
    if (data.action === RestaurantAction.REJECT) {
      return !!data.remarks && data.remarks.trim().length > 0
    }
    return true
  },
  {
    message: 'Remarks are required when rejecting a restaurant.',
    path: ['remarks'],
  }
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  // 1. Verify Authentication & Authorization (SUPER_ADMIN only)
  const sessionResult = await requireRole('SUPER_ADMIN')

  if (!sessionResult.success) {
    return NextResponse.json(
      {
        success: false,
        code: sessionResult.error.code,
        message: sessionResult.error.message,
      },
      { status: authErrorToHttpStatus(sessionResult.error) }
    )
  }

  // 2. Parse Path Params
  const resolvedParams = await params
  const { restaurantId } = resolvedParams

  if (!restaurantId) {
    return NextResponse.json(
      { success: false, code: 'INVALID_URL', message: 'Restaurant ID is missing.' },
      { status: 400 }
    )
  }

  // 3. Parse JSON Body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, code: 'INVALID_REQUEST', message: 'Request body must be valid JSON.' },
      { status: 400 }
    )
  }

  // 4. Validate with Zod
  const parsed = updateStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid data submitted.',
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    )
  }

  // 5. Execute Service (which wraps the transaction)
  const result = await updateRestaurantStatus(
    restaurantId,
    parsed.data.action,
    sessionResult.data.userId, // Admin ID
    parsed.data.remarks
  )

  // 6. Handle Response
  if (!result.success) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      INVALID_TRANSITION: 422,
      MISSING_REMARKS: 422,
      DATA_INTEGRITY_ERROR: 500,
      INTERNAL_ERROR: 500,
    }

    return NextResponse.json(
      {
        success: false,
        code: result.code,
        message: result.message,
      },
      { status: statusMap[result.code || ''] || 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Restaurant status updated successfully.',
  })
}
