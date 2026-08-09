'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Clock } from 'lucide-react'

interface OrderDetails {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  session: {
    table: {
      tableNumber: number
    }
  }
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
}

interface OrderDetailsModalProps {
  orderId: string | null
  onClose: () => void
  onUpdate: () => void
}

export function OrderDetailsModal({ orderId, onClose, onUpdate }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }

    const fetchOrder = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/owner/orders/${orderId}`)
        const data = await res.json()
        if (data.success) {
          setOrder(data.order)
        } else {
          setError(data.message)
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (!orderId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="h-full w-full max-w-md border-l border-border bg-card p-6 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <h2 className="text-xl font-bold">Order Details</h2>
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
        ) : order ? (
          <div>
            {/* Header Info */}
            <div className="mb-8 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Order Number</p>
                <p className="font-bold text-foreground">#{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Table</p>
                <p className="font-bold text-foreground">T-{order.session.table.tableNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <Clock className="h-3 w-3" />
                  {order.status}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-semibold text-foreground">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <h3 className="mb-4 text-sm font-bold text-muted-foreground uppercase tracking-wider">Items</h3>
            
            <ul className="space-y-4">
              {order.orderItems.map((item) => (
                <li key={item.id} className="flex justify-between border-b border-border pb-4 last:border-0">
                  <div className="flex gap-3">
                    <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold">
                      {item.quantity}x
                    </span>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        {item.menuItem.itemName}
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${item.menuItem.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                      </p>
                      <p className="text-xs text-muted-foreground">${item.priceAtPurchase.toFixed(2)} each</p>
                    </div>
                  </div>
                  <p className="font-bold text-foreground">${item.subtotal.toFixed(2)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8 border-t border-border pt-4 flex justify-between items-center text-lg font-bold">
              <span>Grand Total</span>
              <span className="text-primary">${order.totalAmount.toFixed(2)}</span>
            </div>

            {/* Action Bar */}
            <ActionBar order={order} onUpdate={onUpdate} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ActionBar({ order, onUpdate }: { order: OrderDetails, onUpdate: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remarks, setRemarks] = useState('')
  const [showCancel, setShowCancel] = useState(false)

  const handleAction = async (action: string) => {
    setIsUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/owner/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarks: action === 'CANCEL' ? remarks : undefined }),
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

  // Determine valid actions based on current status
  const actions: { label: string; action: string; color: string }[] = []
  if (order.status === 'PLACED') {
    actions.push({ label: 'Accept Order', action: 'ACCEPT', color: 'bg-primary text-primary-foreground hover:bg-primary/90' })
  } else if (order.status === 'ACCEPTED') {
    actions.push({ label: 'Start Preparing', action: 'START_PREPARING', color: 'bg-primary text-primary-foreground hover:bg-primary/90' })
  } else if (order.status === 'PREPARING') {
    actions.push({ label: 'Mark Ready', action: 'MARK_READY', color: 'bg-green-600 text-white hover:bg-green-700' })
  } else if (order.status === 'READY') {
    actions.push({ label: 'Mark Served', action: 'MARK_SERVED', color: 'bg-green-600 text-white hover:bg-green-700' })
  }

  const canCancel = order.status === 'PLACED' || order.status === 'ACCEPTED'

  if (actions.length === 0 && !canCancel) {
    return null
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {showCancel ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Cancel Order</p>
          <textarea
            placeholder="Reason for cancellation (Required)"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowCancel(false)}
              disabled={isUpdating}
              className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Back
            </button>
            <button
              onClick={() => handleAction('CANCEL')}
              disabled={isUpdating || !remarks.trim()}
              className="flex-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((btn) => (
            <button
              key={btn.action}
              onClick={() => handleAction(btn.action)}
              disabled={isUpdating}
              className={`flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-bold transition-colors disabled:opacity-50 ${btn.color}`}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : btn.label}
            </button>
          ))}
          
          {canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              disabled={isUpdating}
              className="mt-2 flex w-full items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Cancel Order
            </button>
          )}
        </div>
      )}
    </div>
  )
}
