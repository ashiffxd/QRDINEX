import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { getRestaurantProfile, getBillingSettings } from '@/services/owner/restaurant.service'
import { OwnerSettingsTabs } from '@/components/owner/settings/OwnerSettingsTabs'

export const metadata: Metadata = {
  title: 'Restaurant Settings — QRDineX',
  description: 'Manage restaurant profile, billing settings and display currency.',
}

export default async function OwnerSettingsPage() {
  const auth = await requireRole('OWNER')
  if (!auth.success || !auth.data.restaurantId) {
    redirect('/login')
  }

  const [restaurant, billingSettings] = await Promise.all([
    getRestaurantProfile(auth.data.restaurantId),
    getBillingSettings(auth.data.restaurantId),
  ])

  if (!restaurant) {
    redirect('/login')
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Restaurant Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your restaurant profile, service charge, and display currency.
        </p>
      </div>

      <OwnerSettingsTabs
        restaurantData={restaurant}
        billingData={billingSettings}
      />
    </div>
  )
}
