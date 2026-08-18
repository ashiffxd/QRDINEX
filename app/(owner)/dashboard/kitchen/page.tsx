import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { getKitchenOrders } from '@/services/owner/order.service'
import { KitchenDisplayClient } from '@/components/owner/kitchen/KitchenDisplayClient'

export const metadata: Metadata = {
  title: 'Kitchen Display System (KDS)',
  description: 'Live order queue and preparation board for restaurant chefs.',
}

export default async function KitchenDisplayPage() {
  const auth = await requireRole(['OWNER'])
  if (!auth.success || !auth.data.restaurantId) {
    redirect('/login')
  }

  const initialOrders = await getKitchenOrders(auth.data.restaurantId)

  return <KitchenDisplayClient initialOrders={initialOrders} />
}
