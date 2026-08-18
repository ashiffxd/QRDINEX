import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { validateActiveCustomer } from '@/lib/auth/customer-session'
import { getSessionOrders } from '@/services/customer/order.service'
import prisma from '@/lib/prisma'
import { CustomerOrdersClient } from '@/components/customer/orders/CustomerOrdersClient'

export const metadata: Metadata = {
  title: 'My Orders — QRDineX',
  description: 'View your session order history.',
  robots: { index: false, follow: false },
}

export default async function OrdersPage() {
  const customer = await validateActiveCustomer({ allowCompletedOrClosed: true })

  if (!customer) {
    redirect('/menu')
  }

  const orders = await getSessionOrders(customer.sessionId)

  const session = await prisma.diningSession.findUnique({
    where: { id: customer.sessionId },
    select: { status: true },
  })

  // Format orders with plain JSON objects so dates pass cleanly to client component
  const formattedOrders = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
  }))

  return (
    <CustomerOrdersClient
      initialOrders={formattedOrders}
      initialSessionStatus={session?.status || 'OPEN'}
    />
  )
}
