import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { getBillingSettings } from '@/services/owner/restaurant.service'
import {
  getOverviewAnalytics,
  getRevenueAnalytics,
  getOrderAnalytics,
  getMenuAnalytics,
  getTableAnalytics,
  getKitchenAnalytics,
  getSessionAnalytics,
  getFeedbackAnalytics,
} from '@/services/owner/analytics.service'
import { AnalyticsDashboardClient } from '@/components/owner/analytics/AnalyticsDashboardClient'

export const metadata: Metadata = {
  title: 'Analytics & Feedback',
  description: 'Business intelligence, operational analytics, and customer reviews for restaurant owners.',
}

export default async function OwnerAnalyticsPage() {
  const auth = await requireRole(['OWNER'])
  if (!auth.success || !auth.data.restaurantId) {
    redirect('/login')
  }

  const restaurantId = auth.data.restaurantId

  const [
    billingSettings,
    overview,
    revenue,
    orders,
    menu,
    tables,
    kitchen,
    sessions,
    feedback,
  ] = await Promise.all([
    getBillingSettings(restaurantId),
    getOverviewAnalytics(restaurantId, { range: '7days' }),
    getRevenueAnalytics(restaurantId, { range: '7days' }),
    getOrderAnalytics(restaurantId, { range: '7days' }),
    getMenuAnalytics(restaurantId, { range: '7days' }),
    getTableAnalytics(restaurantId, { range: '7days' }),
    getKitchenAnalytics(restaurantId, { range: '7days' }),
    getSessionAnalytics(restaurantId, { range: '7days' }),
    getFeedbackAnalytics(restaurantId, { range: '7days' }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Analytics & Feedback
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your restaurant's revenue, order volume, menu performance, and customer satisfaction ratings.
        </p>
      </div>

      <AnalyticsDashboardClient
        currency={billingSettings.currency || 'INR'}
        initialOverview={overview}
        initialRevenue={revenue}
        initialOrders={orders}
        initialMenu={menu}
        initialTables={tables}
        initialKitchen={kitchen}
        initialSessions={sessions}
        initialFeedback={feedback}
      />
    </div>
  )
}
