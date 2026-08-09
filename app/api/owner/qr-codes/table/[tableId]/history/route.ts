import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getQrHistory } from '@/services/owner/qrcode.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  const { tableId } = await params

  try {
    const result = await getQrHistory(sessionResult.data.restaurantId, tableId)
    if (!result.success) {
      return NextResponse.json({ success: false, code: result.code, message: result.message }, { status: result.code === 'NOT_FOUND' ? 404 : 400 })
    }
    return NextResponse.json({ success: true, data: result.data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch history.' }, { status: 500 })
  }
}
