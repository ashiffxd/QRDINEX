'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Clock, CheckCircle } from 'lucide-react'

interface SessionDetails {
  id: string
  shortId: string
  status: string
  startedAt: string
  totalAmount: number
  participantsCount: number
  table: {
    tableNumber: number
  }
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    createdAt: string
    orderItems: Array<{
      id: string
      quantity: number
      priceAtPurchase: number
      subtotal: number
      menuItem: {
        itemName: string
        isVeg: boolean
      }
    }>
  }>
}

interface SessionDetailsModalProps {
  sessionId: string | null
  onClose: () => void
  onUpdate: () => void
  onOpenBilling?: (sessionId: string) => void
}

export function SessionDetailsModal({ sessionId, onClose, onUpdate, onOpenBilling }: SessionDetailsModalProps) {
  const [session, setSession] = useState<SessionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setSession(null)
      return
    }

    const fetchSession = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/owner/sessions/${sessionId}`)
        const data = await res.json()
        if (data.success) {
          setSession(data.session)
        } else {
          setError(data.message)
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

  const handleComplete = async () => {
    setIsUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/owner/sessions/${sessionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'COMPLETE' }),
      })
      const data = await res.json()
      if (data.success) {
        onUpdate()
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!sessionId) return null

  const isCompleted = session?.status === 'CLOSED' || session?.status === 'EXPIRED'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="h-full w-full max-w-lg border-l border-border bg-card p-6 shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <h2 className="text-xl font-bold">Session Details</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : session ? (
          <div className="flex-1 flex flex-col">
            {/* Header Info */}
            <div className="mb-8 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Session ID</p>
                <p className="font-bold text-foreground">#{session.shortId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Table</p>
                <p className="font-bold text-foreground">T-{session.table.tableNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  session.status === 'BILL_REQUESTED' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  session.status === 'CLOSED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  'bg-primary/10 text-primary'
                }`}>
                  <Clock className="h-3 w-3" />
                  {session.status}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Started At</p>
                <p className="font-semibold text-foreground">
                  {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="mb-6 flex justify-between items-center rounded-lg bg-muted p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Participants</p>
                <p className="text-xl font-bold">{session.participantsCount}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Grand Total</p>
                <p className="text-2xl font-bold text-primary">₹{session.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="mb-4 text-sm font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Orders ({session.orders.length})</h3>
            
            <div className="space-y-6 flex-1">
              {session.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No orders placed yet.</p>
              ) : (
                session.orders.map((order) => (
                  <div key={order.id} className="rounded-lg border border-border p-4">
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-border/50">
                      <div>
                        <span className="font-semibold">#{order.id.split('-')[0].toUpperCase()}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                        {order.status}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {order.orderItems.map((item) => (
                        <li key={item.id} className="flex justify-between text-sm">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground">{item.quantity}x</span>
                            <span>{item.menuItem.itemName}</span>
                          </div>
                          <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 text-right font-bold text-sm">
                      Total: ₹{order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Action Bar */}
            {!isCompleted && (
              <div className="mt-6 pt-4 border-t border-border space-y-3">
                {session.status === 'BILL_REQUESTED' && (
                  <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
                    <span className="font-bold">Attention:</span> Customer requested the bill.
                  </div>
                )}
                {onOpenBilling && (
                  <button
                    onClick={() => onOpenBilling(session.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                  >
                    Manage Billing & Invoice
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  disabled={isUpdating}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Quick Complete (Skip Invoice)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
