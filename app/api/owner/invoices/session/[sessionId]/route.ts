import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getInvoiceBySessionId, calculateBillingPreview } from '@/services/owner/billing.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await requireRole('OWNER')
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { sessionId } = resolvedParams

    // Check if an invoice already exists for this session
    const invoice = await getInvoiceBySessionId(session.data.restaurantId, sessionId)

    if (invoice) {
      return NextResponse.json({ success: true, invoice, isGenerated: true })
    }

    // If no invoice generated yet, calculate a live billing preview
    const { searchParams } = new URL(request.url)
    const discountAmount = searchParams.get('discountAmount') ? Number(searchParams.get('discountAmount')) : undefined
    const discountPercent = searchParams.get('discountPercent') ? Number(searchParams.get('discountPercent')) : undefined
    const taxPercent = searchParams.get('taxPercent') ? Number(searchParams.get('taxPercent')) : undefined
    const serviceChargePercent = searchParams.get('serviceChargePercent') ? Number(searchParams.get('serviceChargePercent')) : undefined

    const preview = await calculateBillingPreview(
      session.data.restaurantId,
      sessionId,
      { discountAmount, discountPercent, taxPercent, serviceChargePercent }
    )

    return NextResponse.json({ success: true, preview, isGenerated: false })
  } catch (error: any) {
    console.error('[GET Invoice by Session API] Error:', error)

    if (error.message === 'SESSION_NOT_FOUND') {
      return NextResponse.json({ success: false, message: 'Dining session not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
