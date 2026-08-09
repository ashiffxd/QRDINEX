import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { MenuItemQuerySchema } from '@/schemas/owner/menu-item-query'
import { CreateMenuItemSchema } from '@/schemas/owner/menu-item'
import { getPaginatedMenuItems, createMenuItem } from '@/services/owner/menu-item.service'

export async function GET(request: NextRequest) {
  const sessionResult = await requireRole('OWNER')
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const rawQuery = Object.fromEntries(searchParams.entries())

  const parsed = MenuItemQuerySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION_ERROR', message: 'Invalid query parameters.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const result = await getPaginatedMenuItems(sessionResult.data.restaurantId, parsed.data)
    return NextResponse.json({ success: true, data: result.data, metadata: result.metadata })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch menu items.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sessionResult = await requireRole('OWNER')
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, code: 'INVALID_REQUEST', message: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = CreateMenuItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION_ERROR', message: 'Invalid data.', errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const result = await createMenuItem(sessionResult.data.restaurantId, parsed.data)
    if (!result.success) {
      return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to create menu item.' }, { status: 500 })
  }
}
