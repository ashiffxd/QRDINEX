import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getQrCodeForDownload, generateQrImageBuffer } from '@/services/owner/qrcode.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrId: string }> }
) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
  }

  const { qrId } = await params

  try {
    const qrData = await getQrCodeForDownload(sessionResult.data.restaurantId, qrId)
    
    if (!qrData) {
      return NextResponse.json({ success: false, code: 'NOT_FOUND', message: 'QR Code not found.' }, { status: 404 })
    }

    const buffer = await generateQrImageBuffer(qrData.token)

    const headers = new Headers()
    headers.set('Content-Type', 'image/png')
    headers.set('Content-Disposition', `attachment; filename="Table-${qrData.table.tableNumber}-QR.png"`)
    headers.set('Content-Length', buffer.length.toString())

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error('[QR Download API Error]', error)
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Failed to download QR code.' }, { status: 500 })
  }
}
