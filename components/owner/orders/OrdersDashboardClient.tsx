'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Search, Filter, Radio } from 'lucide-react'
import { OrderDetailsModal } from './OrderDetailsModal'
import { useOwnerSocket } from '@/hooks/useOwnerSocket'
import { ORDER_EVENTS } from '@/lib/socket/events'

const STATUS_TABS = ['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']

export function OrdersDashboardClient() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  
  // Filtering & Pagination state
  const [status, setStatus] = useState('ALL')
  const [searchTable, setSearchTable] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  const { isConnected, on } = useOwnerSocket()

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTable)
      setPage(1) // Reset page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTable])

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status,
      })
      if (debouncedSearch) {
        query.append('search', debouncedSearch)
      }

      const res = await fetch(`/api/owner/orders?${query.toString()}`)
      const data = await res.json()
      if (data.success) {
        setOrders(data.data)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, status, debouncedSearch])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Real-time Socket Event Subscriptions
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Incoming Orders</h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
              }`}
            />
            {isConnected ? 'Live' : 'Polling'}
          </span>
        </div>
        
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Table Number..."
            value={searchTable}
            onChange={(e) => setSearchTable(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="scrollbar-hide flex w-full overflow-x-auto border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatus(tab)
              setPage(1)
            }}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              status === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Order</th>
                <th className="px-6 py-4 font-semibold">Table</th>
                <th className="px-6 py-4 font-semibold">Items</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Time</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order.id)}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-foreground">#{order.orderNumber}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-foreground">T-{order.tableNumber}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{order.itemsCount} items</td>
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-foreground">₹{order.totalAmount.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="rounded border border-input bg-background p-1 text-xs"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded px-2 py-1 hover:bg-muted disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded px-2 py-1 hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <OrderDetailsModal 
        orderId={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onUpdate={() => {
          setSelectedOrder(null)
          fetchOrders()
        }}
      />
    </div>
  )
}
