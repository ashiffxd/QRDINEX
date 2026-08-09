import prisma from '@/lib/prisma'
import {
  SessionStatus,
  DiningTableStatus,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from '@prisma/client'

// ============================================================
// TYPES
// ============================================================

export interface BillingOptions {
  discountAmount?: number
  discountPercent?: number
  taxPercent?: number
  serviceChargePercent?: number
  notes?: string
}

export interface BillingItemPreview {
  orderItemId: string
  itemName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface BillingPreviewResult {
  sessionId: string
  tableNumber: number
  items: BillingItemPreview[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  serviceCharge: number
  roundOff: number
  grandTotal: number
}

// ============================================================
// CALCULATE BILLING PREVIEW
// ============================================================

export async function calculateBillingPreview(
  restaurantId: string,
  sessionId: string,
  options: BillingOptions = {},
): Promise<BillingPreviewResult> {
  const session = await prisma.diningSession.findUnique({
    where: { id: sessionId },
    include: {
      table: true,
      restaurant: {
        select: {
          serviceChargeEnabled: true,
          serviceChargePercent: true,
        },
      },
      orders: {
        where: {
          status: { not: OrderStatus.CANCELLED },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.restaurantId !== restaurantId) {
    throw new Error('SESSION_NOT_FOUND')
  }

  const items: BillingItemPreview[] = []
  let rawSubtotal = 0

  for (const order of session.orders) {
    for (const item of order.orderItems) {
      const unitPrice = Number(item.priceAtPurchase)
      const lineTotal = Number(item.subtotal)
      rawSubtotal += lineTotal

      items.push({
        orderItemId: item.id,
        itemName: item.menuItem.itemName,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      })
    }
  }

  const subtotal = Math.round(rawSubtotal * 100) / 100

  // Calculate discount
  let discountAmount = 0
  if (options.discountAmount && options.discountAmount > 0) {
    discountAmount = Math.min(subtotal, options.discountAmount)
  } else if (options.discountPercent && options.discountPercent > 0) {
    discountAmount = Math.min(subtotal, (subtotal * options.discountPercent) / 100)
  }
  discountAmount = Math.round(discountAmount * 100) / 100

  const taxableSubtotal = Math.max(0, subtotal - discountAmount)

  // Tax calculation (e.g. 5% GST default if taxPercent passed)
  const taxPercent = options.taxPercent ?? 0
  const taxAmount = Math.round(((taxableSubtotal * taxPercent) / 100) * 100) / 100

  // Service charge calculation: use explicit option if provided, else use restaurant's configuration
  let serviceChargePercent = 0
  if (options.serviceChargePercent !== undefined) {
    serviceChargePercent = options.serviceChargePercent
  } else if (session.restaurant?.serviceChargeEnabled) {
    serviceChargePercent = Number(session.restaurant.serviceChargePercent ?? 0)
  }

  const serviceCharge = Math.round(((subtotal * serviceChargePercent) / 100) * 100) / 100

  const preRoundTotal = taxableSubtotal + taxAmount + serviceCharge
  const grandTotal = Math.round(preRoundTotal)
  const roundOff = Math.round((grandTotal - preRoundTotal) * 100) / 100

  return {
    sessionId: session.id,
    tableNumber: session.table.tableNumber,
    items,
    subtotal,
    discountAmount,
    taxAmount,
    serviceCharge,
    roundOff,
    grandTotal,
  }
}

// ============================================================
// GENERATE INVOICE
// ============================================================

export async function generateInvoice(
  restaurantId: string,
  sessionId: string,
  ownerUserId: string,
  options: BillingOptions = {},
) {
  const preview = await calculateBillingPreview(restaurantId, sessionId, options)

  if (preview.items.length === 0) {
    throw new Error('NO_ORDERS_TO_BILL')
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Verify session exists and is active
    const session = await tx.diningSession.findUnique({
      where: { id: sessionId },
    })

    if (!session || session.restaurantId !== restaurantId) {
      throw new Error('SESSION_NOT_FOUND')
    }

    if (
      session.status !== SessionStatus.OPEN &&
      session.status !== SessionStatus.BILL_REQUESTED
    ) {
      throw new Error('INVALID_SESSION_STATUS_FOR_BILLING')
    }

    // 2. Ensure invoice does NOT already exist
    const existingInvoice = await tx.invoice.findUnique({
      where: { sessionId },
    })

    if (existingInvoice) {
      throw new Error('INVOICE_ALREADY_EXISTS')
    }

    // 3. Generate unique Invoice Number (Format: INV-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randSuffix = Math.floor(1000 + Math.random() * 9000).toString()
    const invoiceNumber = `INV-${dateStr}-${randSuffix}`

    // 4. Create Invoice & InvoiceItems snapshot
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        sessionId,
        restaurantId,
        subtotal: preview.subtotal,
        discountAmount: preview.discountAmount,
        taxAmount: preview.taxAmount,
        serviceCharge: preview.serviceCharge,
        roundOff: preview.roundOff,
        grandTotal: preview.grandTotal,
        paymentStatus: PaymentStatus.UNPAID,
        generatedBy: ownerUserId,
        notes: options.notes ?? null,
        items: {
          create: preview.items.map((item) => ({
            orderItemId: item.orderItemId,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        items: true,
        session: {
          include: {
            table: true,
          },
        },
      },
    })

    // 5. Update DiningSession status to INVOICE_GENERATED
    await tx.diningSession.update({
      where: { id: sessionId },
      data: { status: SessionStatus.INVOICE_GENERATED },
    })

    // 6. Log status transition
    await tx.diningSessionStatusLog.create({
      data: {
        sessionId,
        oldStatus: session.status,
        newStatus: SessionStatus.INVOICE_GENERATED,
        changedBy: ownerUserId,
        remarks: `Invoice generated: ${invoiceNumber}`,
      },
    })

    return invoice
  })
}

// ============================================================
// MARK INVOICE PAID & COMPLETE SESSION
// ============================================================

export async function markInvoicePaid(
  restaurantId: string,
  invoiceId: string,
  ownerUserId: string,
  paymentMethod: PaymentMethod = PaymentMethod.CASH,
  notes?: string,
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch invoice
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        session: true,
      },
    })

    if (!invoice || invoice.restaurantId !== restaurantId) {
      throw new Error('INVOICE_NOT_FOUND')
    }

    if (invoice.paymentStatus === PaymentStatus.PAID) {
      throw new Error('INVOICE_ALREADY_PAID')
    }

    const now = new Date()

    // 2. Update Invoice to PAID
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod,
        paidAt: now,
        paidBy: ownerUserId,
        notes: notes ? (invoice.notes ? `${invoice.notes}\n${notes}` : notes) : invoice.notes,
      },
      include: {
        items: true,
        session: {
          include: {
            table: true,
          },
        },
      },
    })

    // 3. Mark DiningSession as COMPLETED
    const session = await tx.diningSession.update({
      where: { id: invoice.sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        closedAt: now,
      },
    })

    // 4. Mark DiningTable as AVAILABLE
    await tx.diningTable.update({
      where: { id: session.tableId },
      data: { status: DiningTableStatus.AVAILABLE },
    })

    // 5. Mark all linked non-cancelled orders as COMPLETED
    await tx.order.updateMany({
      where: {
        sessionId: invoice.sessionId,
        status: { not: OrderStatus.CANCELLED },
      },
      data: { status: OrderStatus.COMPLETED },
    })

    // 6. Log Session status transition
    await tx.diningSessionStatusLog.create({
      data: {
        sessionId: invoice.sessionId,
        oldStatus: invoice.session.status,
        newStatus: SessionStatus.COMPLETED,
        changedBy: ownerUserId,
        remarks: `Invoice paid via ${paymentMethod}. Session completed.`,
      },
    })

    return updatedInvoice
  })
}

// ============================================================
// GET INVOICE BY ID / SESSION ID
// ============================================================

export async function getInvoiceById(restaurantId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      session: {
        include: {
          table: true,
        },
      },
    },
  })

  if (!invoice || invoice.restaurantId !== restaurantId) {
    return null
  }

  return invoice
}

export async function getInvoiceBySessionId(restaurantId: string, sessionId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { sessionId },
    include: {
      items: true,
      session: {
        include: {
          table: true,
        },
      },
    },
  })

  if (!invoice || invoice.restaurantId !== restaurantId) {
    return null
  }

  return invoice
}
