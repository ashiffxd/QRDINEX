import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { validateActiveCustomer } from '@/lib/auth/customer-session'
import prisma from '@/lib/prisma'
import { CustomerInvoiceClient } from '@/components/customer/invoice/CustomerInvoiceClient'

export const metadata: Metadata = {
  title: 'Invoice — QRDineX',
  description: 'View your dining session invoice.',
  robots: { index: false, follow: false },
}

export default async function CustomerInvoicePage() {
  const customer = await validateActiveCustomer({ allowCompletedOrClosed: true })

  if (!customer) {
    redirect('/menu')
  }

  const session = await prisma.diningSession.findUnique({
    where: { id: customer.sessionId },
    include: {
      restaurant: {
        select: {
          restaurantName: true,
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
    redirect('/menu')
  }

  const invoice = await prisma.invoice.findUnique({
    where: { sessionId: customer.sessionId },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const formattedInvoice = invoice
    ? {
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
      }
    : null

  return (
    <CustomerInvoiceClient
      initialHasInvoice={!!invoice}
      initialSessionStatus={session.status}
      initialRestaurantName={session.restaurant.restaurantName}
      initialTableNumber={session.table.tableNumber}
      initialInvoice={formattedInvoice}
    />
  )
}
