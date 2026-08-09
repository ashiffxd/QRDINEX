import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { generateInvoice } from '@/services/owner/billing.service'
import { socketEmitter, INVOICE_EVENTS } from '@/lib/socket'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole('OWNER')
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, discountAmount, discountPercent, taxPercent, serviceChargePercent, notes } = body

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, message: 'sessionId is required.' }, { status: 400 })
    }

    const invoice = await generateInvoice(
      session.data.restaurantId,
      sessionId,
      session.data.id,
      {
        discountAmount: discountAmount ? Number(discountAmount) : undefined,
        discountPercent: discountPercent ? Number(discountPercent) : undefined,
        taxPercent: taxPercent !== undefined ? Number(taxPercent) : undefined,
        serviceChargePercent: serviceChargePercent !== undefined ? Number(serviceChargePercent) : undefined,
        notes,
      }
    )

    try {
      const payload = {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        sessionId: invoice.sessionId,
        tableNumber: invoice.session.table.tableNumber,
        grandTotal: Number(invoice.grandTotal),
        generatedAt: invoice.generatedAt.toISOString(),
      }

      socketEmitter.emitToRestaurant(session.data.restaurantId, INVOICE_EVENTS.GENERATED, payload)
      socketEmitter.emitToSession(invoice.sessionId, INVOICE_EVENTS.GENERATED, payload)

      logger.audit('INVOICE_GENERATED', {
        invoiceId: invoice.id,
        sessionId: invoice.sessionId,
        restaurantId: session.data.restaurantId,
        userId: session.data.id,
        message: `Invoice ${invoice.invoiceNumber} generated for Table ${payload.tableNumber}. Total: ${payload.grandTotal}`,
      })
    } catch (err) {
      console.error('[Generate Invoice API] Socket emit error:', err)
    }

    return NextResponse.json({ success: true, invoice })
  } catch (error: any) {
    console.error('[Generate Invoice API] Error:', error)

    if (error.message === 'SESSION_NOT_FOUND') {
      return NextResponse.json({ success: false, message: 'Dining session not found.' }, { status: 404 })
    }
    if (error.message === 'NO_ORDERS_TO_BILL') {
      return NextResponse.json({ success: false, message: 'No orders placed in this session.' }, { status: 400 })
    }
    if (error.message === 'INVOICE_ALREADY_EXISTS') {
      return NextResponse.json({ success: false, message: 'An invoice has already been generated for this session.' }, { status: 409 })
    }
    if (error.message === 'INVALID_SESSION_STATUS_FOR_BILLING') {
      return NextResponse.json({ success: false, message: 'Session is not active or ready for billing.' }, { status: 400 })
    }

    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
