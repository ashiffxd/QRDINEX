'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Restaurant {
  id: string
  restaurantName: string
  restaurantCode: string
  city: string
  createdAt: Date | string
  owner: { fullName: string; email: string; phoneNumber: string }
  verification: { submittedAt: Date | string } | null
}

interface PendingApprovalsTableProps {
  restaurants: Restaurant[]
}

export function PendingApprovalsTable({ restaurants: initial }: PendingApprovalsTableProps) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<Restaurant | null>(null)
  const [remarks, setRemarks] = useState('')
  const [remarksError, setRemarksError] = useState('')

  const callStatusApi = async (restaurantId: string, action: 'APPROVE' | 'REJECT', remarks?: string) => {
    const res = await fetch(`/api/admin/restaurants/${restaurantId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, remarks }),
    })
    return res.json()
  }

  const handleApprove = async (restaurant: Restaurant) => {
    setLoadingId(restaurant.id)
    try {
      const data = await callStatusApi(restaurant.id, 'APPROVE')
      if (data.success) {
        setRows((prev) => prev.filter((r) => r.id !== restaurant.id))
        router.refresh() // refresh server component stats
      } else {
        alert(data.message || 'Failed to approve.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  const openRejectModal = (restaurant: Restaurant) => {
    setRejectTarget(restaurant)
    setRemarks('')
    setRemarksError('')
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return
    if (!remarks.trim()) {
      setRemarksError('Remarks are required for rejection.')
      return
    }
    setLoadingId(rejectTarget.id)
    try {
      const data = await callStatusApi(rejectTarget.id, 'REJECT', remarks.trim())
      if (data.success) {
        setRows((prev) => prev.filter((r) => r.id !== rejectTarget.id))
        setRejectTarget(null)
        router.refresh()
      } else {
        setRemarksError(data.message || 'Failed to reject.')
      }
    } catch {
      setRemarksError('Network error. Please try again.')
    } finally {
      setLoadingId(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No pending approvals</h3>
        <p className="mt-1 text-sm text-muted-foreground">All restaurant registrations have been reviewed.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Restaurant', 'Owner', 'Phone', 'City', 'Submitted', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((restaurant) => {
                const isLoading = loadingId === restaurant.id
                return (
                  <tr key={restaurant.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{restaurant.restaurantName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{restaurant.restaurantCode}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{restaurant.owner.fullName}</p>
                      <p className="text-xs text-muted-foreground">{restaurant.owner.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {restaurant.owner.phoneNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {restaurant.city}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {restaurant.verification
                        ? format(new Date(restaurant.verification.submittedAt), 'MMM d, yyyy')
                        : format(new Date(restaurant.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(restaurant)}
                          disabled={isLoading || loadingId !== null}
                          className="inline-flex items-center gap-1 rounded-md bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 transition-opacity hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400"
                        >
                          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(restaurant)}
                          disabled={isLoading || loadingId !== null}
                          className="inline-flex items-center gap-1 rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 transition-opacity hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400"
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-base font-bold text-foreground">Reject Restaurant</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You are rejecting <span className="font-semibold text-foreground">{rejectTarget.restaurantName}</span>. Please provide a reason.
            </p>
            <textarea
              rows={4}
              value={remarks}
              onChange={(e) => { setRemarks(e.target.value); setRemarksError('') }}
              placeholder="e.g. Incomplete documentation, invalid address..."
              className="mt-4 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {remarksError && (
              <p className="mt-1.5 text-xs text-destructive">{remarksError}</p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                disabled={loadingId !== null}
                className="rounded-xl border border-border bg-muted/50 px-5 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={loadingId !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2 text-sm font-bold text-destructive-foreground disabled:opacity-50"
              >
                {loadingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
