import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { ReorderCategoriesSchema } from '@/schemas/owner/menu-category'
import { reorderCategories } from '@/services/owner/menu-category.service'

export async function PATCH(request: NextRequest) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, code: 'INVALID_REQUEST', message: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = ReorderCategoriesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION_ERROR', message: 'Invalid data.', errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const result = await reorderCategories(sessionResult.data.restaurantId, parsed.data)
    if (!result.success) {
      return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: result.code === 'UNAUTHORIZED' ? 403 : 400 })
    }
    return NextResponse.json({ success: true, message: result.message }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to reorder categories.' }, { status: 500 })
  }
}
