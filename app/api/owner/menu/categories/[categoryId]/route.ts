import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { UpdateCategorySchema } from '@/schemas/owner/menu-category'
import { updateCategory } from '@/services/owner/menu-category.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  const { categoryId } = await params

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, code: 'INVALID_REQUEST', message: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = UpdateCategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION_ERROR', message: 'Invalid data.', errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const result = await updateCategory(sessionResult.data.restaurantId, categoryId, parsed.data)
    if (!result.success) {
      return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: result.code === 'NOT_FOUND' ? 404 : 400 })
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to update category.' }, { status: 500 })
  }
}
