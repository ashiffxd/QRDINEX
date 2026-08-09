import { NextRequest, NextResponse } from 'next/server'
import { validateActiveCustomer } from '@/lib/auth/customer-session'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const customer = await validateActiveCustomer()
    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized session' },
        { status: 401 }
      )
    }

    const session = await prisma.diningSession.findUnique({
      where: { id: customer.sessionId },
      include: {
        restaurant: {
          select: {
            restaurantName: true,
            logoUrl: true,
            address: true,
            phone: true,
          },
        },
        table: {
          select: {
            tableNumber: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      )
    }

    const invoice = await prisma.invoice.findUnique({
      where: { sessionId: customer.sessionId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({
        success: true,
        hasInvoice: false,
        sessionStatus: session.status,
        restaurantName: session.restaurant.restaurantName,
        tableNumber: session.table.tableNumber,
      })
    }

    return NextResponse.json({
      success: true,
      hasInvoice: true,
      sessionStatus: session.status,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        restaurantName: session.restaurant.restaurantName,
        tableNumber: session.table.tableNumber,
        generatedAt: invoice.generatedAt.toISOString(),
        paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
        paymentStatus: invoice.paymentStatus,
        paymentMethod: invoice.paymentMethod,
        subtotal: Number(invoice.subtotal),
        discountAmount: Number(invoice.discountAmount),
        taxAmount: Number(invoice.taxAmount),
        serviceCharge: Number(invoice.serviceCharge),
        roundOff: Number(invoice.roundOff),
        grandTotal: Number(invoice.grandTotal),
        notes: invoice.notes,
        items: invoice.items.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          lineTotal: Number(item.lineTotal),
        })),
      },
    })
  } catch (error: any) {
    console.error('[Customer Invoice API] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
