import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { getInvoiceById } from '@/services/owner/billing.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole('OWNER')
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    const invoice = await getInvoiceById(session.data.restaurantId, id)

    if (!invoice) {
      return NextResponse.json({ success: false, message: 'Invoice not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, invoice })
  } catch (error) {
    console.error('[GET Invoice API] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
