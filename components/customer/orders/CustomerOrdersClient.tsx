'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Receipt } from 'lucide-react'
import { RequestBillButton } from '@/components/customer/RequestBillButton'
import { useCustomerSocket } from '@/hooks/useCustomerSocket'
import { ORDER_EVENTS } from '@/lib/socket/events'

interface CustomerOrdersClientProps {
  initialOrders: any[]
  initialSessionStatus: string
}

export function CustomerOrdersClient({ initialOrders, initialSessionStatus }: CustomerOrdersClientProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [sessionStatus, setSessionStatus] = useState<string>(initialSessionStatus)

  const { on } = useCustomerSocket()

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/customer/orders')
      const data = await res.json()
      if (data.success && data.orders) {
        setOrders(data.orders)
      }
    } catch (e) {
      console.error('[CustomerOrdersClient] Failed to fetch orders:', e)
    }
  }, [])

  // Real-time socket event subscriptions
  useEffect(() => {
    const unsubNew = on(ORDER_EVENTS.NEW, () => {
      fetchOrders()
    })
    const unsubStatus = on(ORDER_EVENTS.STATUS_UPDATED, () => {
      fetchOrders()
    })

    return () => {
      unsubNew()
      unsubStatus()
    }
  }, [on, fetchOrders])

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/menu"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Orders</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Session Total</p>
          <p className="text-lg font-bold text-primary">${totalSpent.toFixed(2)}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex h-[50vh] flex-col items-center justify-center text-center">
          <Receipt className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold text-foreground">No orders yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You haven't placed any orders in this session.
          </p>
          <Link
            href="/menu"
            className="mt-6 rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, idx) => (
            <div key={order.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold shadow-sm">
                    {orders.length - idx}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Order ID: {order.id.split('-')[0].toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Clock className="h-3.5 w-3.5" />
                  {order.status}
                </div>
              </div>
              
              <div className="p-4">
                <ul className="space-y-3">
                  {order.orderItems.map((item: any) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="flex items-start gap-3">
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-medium leading-tight text-foreground">{item.menuItem.itemName}</p>
                          <p className="text-xs text-muted-foreground">${Number(item.priceAtPurchase).toFixed(2)} each</p>
                        </div>
                      </div>
                      <p className="font-semibold text-foreground">${Number(item.subtotal).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-muted-foreground">Order Total</span>
                  <span className="font-bold text-foreground">${Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
          
          <RequestBillButton sessionStatus={sessionStatus} />
        </div>
      )}
    </div>
  )
}
