'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { RestaurantAction } from '@/types/admin'
import { cn } from '@/lib/utils'

interface StatusChangeDialogProps {
  restaurantId: string
  action: RestaurantAction | null
  isOpen: boolean
  onClose: () => void
}

const ACTION_CONFIG: Record<RestaurantAction, { title: string; desc: string; buttonText: string; buttonClass: string }> = {
  [RestaurantAction.APPROVE]: {
    title: 'Approve Restaurant',
    desc: 'This will approve the restaurant and make it fully ACTIVE on QRDineX.',
    buttonText: 'Approve',
    buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
  },
  [RestaurantAction.REJECT]: {
    title: 'Reject Restaurant',
    desc: 'This will reject the restaurant application. Please provide a reason.',
    buttonText: 'Reject',
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
  [RestaurantAction.ACTIVATE]: {
    title: 'Activate Restaurant',
    desc: 'This will reactivate the suspended restaurant, allowing the owner to log in and accept orders again.',
    buttonText: 'Activate',
    buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
  },
  [RestaurantAction.DEACTIVATE]: {
    title: 'Deactivate Restaurant',
    desc: 'This will suspend the restaurant immediately. The owner will be logged out and cannot access their dashboard.',
    buttonText: 'Deactivate',
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
  },
}

export function StatusChangeDialog({ restaurantId, action, isOpen, onClose }: StatusChangeDialogProps) {
  const router = useRouter()
  const [remarks, setRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !action) return null

  const config = ACTION_CONFIG[action]
  const requiresRemarks = action === RestaurantAction.REJECT

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (requiresRemarks && !remarks.trim()) {
      setError('Remarks are required for this action.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarks: remarks.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong.')
      }

      // Success
      setRemarks('')
      onClose()
      
      // Refresh the page data fully via Next.js router
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" aria-hidden="true" onClick={!isSubmitting ? onClose : undefined} />
      
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4">
        <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{config.desc}</p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {requiresRemarks && (
              <div className="mt-4 space-y-1.5">
                <label htmlFor="remarks" className="block text-sm font-medium text-foreground">
                  Reason for Rejection <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => { setRemarks(e.target.value); setError(null); }}
                  placeholder="Explain why this application was rejected..."
                  className="h-24 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>
            )}

            {!requiresRemarks && (
              <div className="mt-4 space-y-1.5">
                <label htmlFor="remarks" className="block text-sm font-medium text-foreground">
                  Internal Notes (Optional)
                </label>
                <textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any internal notes about this action..."
                  className="h-20 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/40 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (requiresRemarks && !remarks.trim())}
              className={cn(
                'flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                config.buttonClass
              )}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Processing...' : config.buttonText}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
