import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { authErrorToHttpStatus } from '@/lib/auth/errors'
import { RestaurantQuerySchema } from '@/schemas/admin/restaurant-query'
import { getPaginatedRestaurants } from '@/services/admin/restaurant.service'

export async function GET(request: NextRequest) {
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

  // 2. Extract and Parse Search Params
  const { searchParams } = request.nextUrl
  const rawQuery = Object.fromEntries(searchParams.entries())

  // 3. Validate with Zod
  const parsed = RestaurantQuerySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters provided.',
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  try {
    // 4. Fetch Data from Service
    const result = await getPaginatedRestaurants(parsed.data)

    // 5. Return JSON Response
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('[Restaurant API] Failed to fetch restaurants:', error)
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while fetching restaurants.',
      },
      { status: 500 }
    )
  }
}
