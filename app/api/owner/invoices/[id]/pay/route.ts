import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { markInvoicePaid } from '@/services/owner/billing.service'
import { PaymentMethod } from '@prisma/client'
import { socketEmitter, INVOICE_EVENTS, SESSION_EVENTS } from '@/lib/socket'
import { logger } from '@/lib/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['OWNER'])
    if (!session.success || !session.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    const body = await request.json()
    const { paymentMethod, notes } = body as { paymentMethod?: PaymentMethod; notes?: string }

    const validMethods: PaymentMethod[] = [
      PaymentMethod.CASH,
      PaymentMethod.UPI,
      PaymentMethod.CARD,
      PaymentMethod.OTHER,
    ]

    const selectedMethod = paymentMethod && validMethods.includes(paymentMethod)
      ? paymentMethod
      : PaymentMethod.CASH

    const invoice = await markInvoicePaid(
      session.data.restaurantId,
      id,
      session.data.id,
      selectedMethod,
      notes
    )

    try {
      const paidPayload = {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        sessionId: invoice.sessionId,
        tableNumber: invoice.session.table.tableNumber,
        grandTotal: Number(invoice.grandTotal),
        paymentMethod: selectedMethod,
        paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : new Date().toISOString(),
      }

      const closedPayload = {
        sessionId: invoice.sessionId,
        shortId: invoice.sessionId.split('-')[0].toUpperCase(),
        tableNumber: invoice.session.table.tableNumber,
      }

      // Notify Owner dashboard & Customer session devices
      socketEmitter.emitToRestaurant(session.data.restaurantId, INVOICE_EVENTS.PAID, paidPayload)
      socketEmitter.emitToSession(invoice.sessionId, INVOICE_EVENTS.PAID, paidPayload)

      socketEmitter.emitToRestaurant(session.data.restaurantId, SESSION_EVENTS.CLOSED, closedPayload)
      socketEmitter.emitToSession(invoice.sessionId, SESSION_EVENTS.CLOSED, closedPayload)

      logger.audit('PAYMENT_CONFIRMED', {
        invoiceId: invoice.id,
        sessionId: invoice.sessionId,
        restaurantId: session.data.restaurantId,
        userId: session.data.id,
        message: `Invoice ${invoice.invoiceNumber} paid via ${selectedMethod}. Session completed.`,
      })
    } catch (err) {
      console.error('[Pay Invoice API] Socket emit error:', err)
    }

    return NextResponse.json({ success: true, invoice })
  } catch (error: any) {
    console.error('[Pay Invoice API] Error:', error)

    if (error.message === 'INVOICE_NOT_FOUND') {
      return NextResponse.json({ success: false, message: 'Invoice not found.' }, { status: 404 })
    }
    if (error.message === 'INVOICE_ALREADY_PAID') {
      return NextResponse.json({ success: false, message: 'Invoice has already been marked as paid.' }, { status: 400 })
    }

    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 })
  }
}
