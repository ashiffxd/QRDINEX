import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { TableQuerySchema } from '@/schemas/owner/table-query'
import { getPaginatedTableQRs, generateQrCode } from '@/services/owner/qrcode.service'

export async function GET(request: NextRequest) {
  const sessionResult = await requireRole('OWNER')
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const rawQuery = Object.fromEntries(searchParams.entries())

  const parsed = TableQuerySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: 'VALIDATION_ERROR', message: 'Invalid query parameters.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const result = await getPaginatedTableQRs(sessionResult.data.restaurantId, parsed.data)
    return NextResponse.json({ success: true, data: result.data, metadata: result.metadata })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch QR tables.' }, { status: 500 })
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

  const tableId = body.tableId
  if (!tableId || typeof tableId !== 'string') {
    return NextResponse.json({ success: false, code: 'VALIDATION_ERROR', message: 'tableId is required and must be a string.' }, { status: 422 })
  }

  try {
    const result = await generateQrCode(sessionResult.data.restaurantId, tableId)
    if (!result.success) {
      return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: result.code === 'NOT_FOUND' ? 404 : 400 })
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to generate QR code.' }, { status: 500 })
  }
}
