'use client'

import { useState } from 'react'
import { Building2, Percent } from 'lucide-react'
import { RestaurantProfileForm } from './RestaurantProfileForm'
import { BillingSettingsForm } from './BillingSettingsForm'

interface OwnerSettingsTabsProps {
  restaurantData: any
  billingData: any
}

export function OwnerSettingsTabs({
  restaurantData,
  billingData,
}: OwnerSettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing'>('profile')

  const tabs = [
    { id: 'profile', label: 'Restaurant Profile', icon: Building2 },
    { id: 'billing', label: 'Billing & Currency', icon: Percent },
  ] as const

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-border space-x-2 sm:space-x-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'profile' && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <RestaurantProfileForm initialData={restaurantData} />
          </div>
        )}

        {activeTab === 'billing' && (
          <BillingSettingsForm initialData={billingData} />
        )}
      </div>
    </div>
  )
}
