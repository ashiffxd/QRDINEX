import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { UpdateMenuItemStatusSchema } from '@/schemas/owner/menu-item'
import { updateMenuItemStatus } from '@/services/owner/menu-item.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const sessionResult = await requireRole('OWNER')
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  const { itemId } = await params

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, code: 'INVALID_REQUEST', message: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = UpdateMenuItemStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION_ERROR', message: 'Invalid data.', errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const result = await updateMenuItemStatus(sessionResult.data.restaurantId, itemId, parsed.data.status)
    if (!result.success) {
      return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: result.code === 'NOT_FOUND' ? 404 : 400 })
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to update menu item status.' }, { status: 500 })
  }
}
