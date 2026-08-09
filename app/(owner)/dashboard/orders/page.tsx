import { Metadata } from 'next'
import { OrdersDashboardClient } from '@/components/owner/orders/OrdersDashboardClient'

export const metadata: Metadata = {
  title: 'Incoming Orders — QRDineX',
  description: 'Manage and track incoming orders for your restaurant.',
}

export default function OrdersDashboardPage() {
  return (
    <div className="p-6">
      <OrdersDashboardClient />
    </div>
  )
}
