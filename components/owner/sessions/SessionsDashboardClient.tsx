'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Search, Filter, Receipt } from 'lucide-react'
import { SessionDetailsModal } from './SessionDetailsModal'
import { BillingModal } from '@/components/owner/billing/BillingModal'
import { useOwnerSocket } from '@/hooks/useOwnerSocket'
import { SESSION_EVENTS, INVOICE_EVENTS } from '@/lib/socket/events'

const STATUS_TABS = [
  { label: 'Active', value: 'OPEN' },
  { label: 'Bill Requested', value: 'BILL_REQUESTED' },
  { label: 'Completed', value: 'CLOSED' },
]

export function SessionsDashboardClient() {
  const [sessions, setSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [billingSessionId, setBillingSessionId] = useState<string | null>(null)
  
  // Filtering & Pagination state
  const [status, setStatus] = useState('OPEN')
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

  const fetchSessions = useCallback(async () => {
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

      const res = await fetch(`/api/owner/sessions?${query.toString()}`)
      const data = await res.json()
      if (data.success) {
        setSessions(data.data)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, status, debouncedSearch])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Real-time Socket Event Subscriptions
  useEffect(() => {
    const unsubNew = on(SESSION_EVENTS.NEW, () => {
      fetchSessions()
    })
    const unsubBill = on(SESSION_EVENTS.BILL_REQUESTED, () => {
      fetchSessions()
    })
    const unsubClosed = on(SESSION_EVENTS.CLOSED, () => {
      fetchSessions()
    })
    const unsubInvGen = on(INVOICE_EVENTS.GENERATED, () => {
      fetchSessions()
    })
    const unsubInvPaid = on(INVOICE_EVENTS.PAID, () => {
      fetchSessions()
    })

    return () => {
      unsubNew()
      unsubBill()
      unsubClosed()
      unsubInvGen()
      unsubInvPaid()
    }
  }, [on, fetchSessions])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dining Sessions</h1>
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
            key={tab.value}
            onClick={() => {
              setStatus(tab.value)
              setPage(1)
            }}
            className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              status === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Session ID</th>
                <th className="px-6 py-4 font-semibold">Table</th>
                <th className="px-6 py-4 font-semibold">Guests</th>
                <th className="px-6 py-4 font-semibold">Orders</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-32 text-center text-muted-foreground">
                    No sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => setSelectedSession(session.id)}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-medium">#{session.shortId}</td>
                    <td className="whitespace-nowrap px-6 py-4">T-{session.tableNumber}</td>
                    <td className="whitespace-nowrap px-6 py-4">{session.participantsCount}</td>
                    <td className="whitespace-nowrap px-6 py-4">{session.ordersCount}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {session.status === 'CLOSED' || session.status === 'COMPLETED' ? 'Ended' : `${session.durationMins} mins`}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        session.status === 'BILL_REQUESTED' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        session.status === 'INVOICE_GENERATED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        session.status === 'COMPLETED' || session.status === 'CLOSED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {session.status !== 'CLOSED' && session.status !== 'COMPLETED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setBillingSessionId(session.id)
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Billing
                        </button>
                      )}
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

      <SessionDetailsModal 
        sessionId={selectedSession} 
        onClose={() => setSelectedSession(null)} 
        onUpdate={() => {
          setSelectedSession(null)
          fetchSessions()
        }}
        onOpenBilling={(sessionId) => {
          setSelectedSession(null)
          setBillingSessionId(sessionId)
        }}
      />

      <BillingModal
        sessionId={billingSessionId}
        onClose={() => setBillingSessionId(null)}
        onSuccess={() => {
          fetchSessions()
        }}
      />
    </div>
  )
}
