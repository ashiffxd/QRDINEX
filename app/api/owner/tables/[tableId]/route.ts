import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { UpdateTableSchema, UpdateTableStatusSchema } from '@/schemas/owner/table'
import { updateTable, updateTableStatus } from '@/services/owner/table.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const sessionResult = await requireRole('OWNER')
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  const { tableId } = await params
  
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, code: 'INVALID_REQUEST', message: 'Invalid JSON body.' }, { status: 400 })
  }

  // Determine which action we are doing based on the payload.
  // If 'status' is present, it's a status update. Otherwise, it's a details update.
  if ('status' in body) {
    const parsed = UpdateTableStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'Invalid status data.', errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    try {
      const result = await updateTableStatus(sessionResult.data.restaurantId, tableId, parsed.data)
      if (!result.success) {
        return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: result.code === 'NOT_FOUND' ? 404 : 400 })
      }
      return NextResponse.json({ success: true, data: result.data }, { status: 200 })
    } catch (error) {
      return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to update table status.' }, { status: 500 })
    }
  } else {
    const parsed = UpdateTableSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', message: 'Invalid table data.', errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    try {
      const result = await updateTable(sessionResult.data.restaurantId, tableId, parsed.data)
      if (!result.success) {
        return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: result.code === 'NOT_FOUND' ? 404 : 400 })
      }
      return NextResponse.json({ success: true, data: result.data }, { status: 200 })
    } catch (error) {
      return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to update table.' }, { status: 500 })
    }
  }
}
