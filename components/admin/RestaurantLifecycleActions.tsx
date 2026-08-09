'use client'

import { useState } from 'react'
import { RestaurantStatus } from '@prisma/client'
import { RestaurantAction, RESTAURANT_LIFECYCLE_STATE_MACHINE } from '@/types/admin'
import { CheckCircle, XCircle, PlayCircle, PauseCircle } from 'lucide-react'
import { StatusChangeDialog } from './StatusChangeDialog'

interface RestaurantLifecycleActionsProps {
  restaurantId: string
  currentStatus: RestaurantStatus
}

export function RestaurantLifecycleActions({ restaurantId, currentStatus }: RestaurantLifecycleActionsProps) {
  const [selectedAction, setSelectedAction] = useState<RestaurantAction | null>(null)
  
  // Get all valid transitions from the current state
  const allowedTransitions = RESTAURANT_LIFECYCLE_STATE_MACHINE[currentStatus]
  const validActions = Object.keys(allowedTransitions) as RestaurantAction[]

  if (validActions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No lifecycle actions available for this state.
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {validActions.includes(RestaurantAction.APPROVE) && (
          <button
            onClick={() => setSelectedAction(RestaurantAction.APPROVE)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            Approve Application
          </button>
        )}

        {validActions.includes(RestaurantAction.REJECT) && (
          <button
            onClick={() => setSelectedAction(RestaurantAction.REJECT)}
            className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        )}

        {validActions.includes(RestaurantAction.ACTIVATE) && (
          <button
            onClick={() => setSelectedAction(RestaurantAction.ACTIVATE)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <PlayCircle className="h-4 w-4" />
            Reactivate Restaurant
          </button>
        )}

        {validActions.includes(RestaurantAction.DEACTIVATE) && (
          <button
            onClick={() => setSelectedAction(RestaurantAction.DEACTIVATE)}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            <PauseCircle className="h-4 w-4" />
            Suspend Restaurant
          </button>
        )}
      </div>

      <StatusChangeDialog
        isOpen={selectedAction !== null}
        action={selectedAction}
        restaurantId={restaurantId}
        onClose={() => setSelectedAction(null)}
      />
    </>
  )
}
