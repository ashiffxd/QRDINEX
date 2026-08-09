import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { getDashboardStats } from '@/services/owner/dashboard.service'
import { OverviewDashboardClient } from '@/components/owner/overview/OverviewDashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function OwnerDashboardOverviewPage() {
  const sessionResult = await requireRole(['OWNER'])
  
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    redirect('/login')
  }

  const restaurantId = sessionResult.data.restaurantId

  // Fetch initial Dashboard Stats on Server
  const stats = await getDashboardStats(restaurantId)

  return <OverviewDashboardClient initialStats={stats} />
}
