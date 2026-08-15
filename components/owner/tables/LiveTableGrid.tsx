'use client'

/**
 * LiveTableGrid Component
 * ============================================================
 * The primary real-time workspace for the restaurant owner.
 * Displays all tables as cards in a responsive grid.
 *
 * Real-time features:
 *  - Listen to `/owner` namespace socket events:
 *    - 'session:pending_approval' → changes table card to PENDING state (flashing ring)
 *    - 'session:new' → opens table card (green ring, active session status)
 *    - 'session:closed' → closes table card (gray dotted, toggle OFF)
 *    - 'participant:join_request' → adds a guest request to the card
 *    - 'participant:action_resolved' → updates participant status (APPROVED/REJECTED)
 *
 * Interactions:
 *  - Toggle ON/OFF manually (Open/Close sessions)
 *  - Accept / Reject pending approvals
 */

import { useState, useEffect } from 'react'
import { useOwnerSocket } from '@/hooks/useOwnerSocket'
import {
  Users,
  CheckCircle2,
  Clock,
  UserPlus,
  Loader2,
  XCircle,
  Plus,
  Building,
  Bell,
  Check,
  X,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { SESSION_EVENTS, PARTICIPANT_EVENTS } from '@/lib/socket/events'

interface Participant {
  id: string
  deviceIdentifier: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  role: 'HOST' | 'GUEST'
  displayName: string | null
}

interface ActiveSession {
  id: string
  status: 'PENDING' | 'OPEN' | 'BILL_REQUESTED' | 'INVOICE_GENERATED' | 'COMPLETED' | 'CLOSED' | 'EXPIRED'
  ownerApproval: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  ordersCount: number
  participants: Participant[]
}

interface TableData {
  id: string
  tableNumber: number
  capacity: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_SERVICE'
  activeSession: ActiveSession | null
}

export function LiveTableGrid() {
  const [tables, setTables] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const { isConnected, on } = useOwnerSocket()

  // ── Fetch Initial Table Data ────────────────────────────────
  const fetchLiveTables = async () => {
    try {
      const res = await fetch('/api/owner/tables/live')
      const data = await res.json()
      if (data.success) {
        setTables(data.data)
      } else {
        setError(data.message || 'Failed to load tables.')
      }
    } catch {
      setError('Network error loading tables.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveTables()
  }, [])

  // ── Socket.io Real-Time Synchronization ─────────────────────
  useEffect(() => {
    // 1. Listen for new pending session requests (APPROVAL mode)
    const unsubPendingApproval = on(SESSION_EVENTS.PENDING_APPROVAL, (payload) => {
      setTables((prev) =>
        prev.map((t) =>
          t.id === payload.tableId
            ? {
                ...t,
                status: 'OCCUPIED',
                activeSession: {
                  id: payload.sessionId,
                  status: 'PENDING',
                  ownerApproval: 'PENDING',
                  createdAt: payload.createdAt,
                  ordersCount: 0,
                  participants: [],
                },
              }
            : t
        )
      )
    })

    // 2. Listen for new active sessions (manual open or approved)
    const unsubNewSession = on(SESSION_EVENTS.NEW, (payload) => {
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === payload.tableNumber
            ? {
                ...t,
                status: 'OCCUPIED',
                activeSession: t.activeSession
                  ? {
                      ...t.activeSession,
                      id: payload.sessionId,
                      status: 'OPEN',
                      ownerApproval: 'APPROVED',
                      createdAt: payload.startedAt,
                    }
                  : {
                      id: payload.sessionId,
                      status: 'OPEN',
                      ownerApproval: 'APPROVED',
                      createdAt: payload.startedAt,
                      ordersCount: 0,
                      participants: [],
                    },
              }
            : t
        )
      )
    })

    // 3. Listen for closed sessions
    const unsubClosedSession = on(SESSION_EVENTS.CLOSED, (payload) => {
      setTables((prev) =>
        prev.map((t) =>
          t.tableNumber === payload.tableNumber
            ? {
                ...t,
                status: 'AVAILABLE',
                activeSession: null,
              }
            : t
        )
      )
    })

    // 4. Listen for join requests
    const unsubJoinRequest = on(PARTICIPANT_EVENTS.JOIN_REQUEST, (payload) => {
      setTables((prev) =>
        prev.map((t) =>
          t.activeSession && t.activeSession.id === payload.sessionId
            ? {
                ...t,
                activeSession: {
                  ...t.activeSession,
                  participants: [
                    ...t.activeSession.participants.filter(
                      (p) => p.id !== payload.participantId
                    ),
                    {
                      id: payload.participantId,
                      deviceIdentifier: '',
                      status: 'PENDING',
                      role: 'GUEST',
                      displayName: payload.displayName,
                    },
                  ],
                },
              }
            : t
        )
      )
    })

    // 5. Listen for host join actions resolved
    const unsubActionResolved = on(PARTICIPANT_EVENTS.ACTION_RESOLVED, (payload) => {
      setTables((prev) =>
        prev.map((t) =>
          t.activeSession && t.activeSession.id === payload.sessionId
            ? {
                ...t,
                activeSession: {
                  ...t.activeSession,
                  participants: t.activeSession.participants.map((p) =>
                    p.id === payload.participantId
                      ? { ...p, status: payload.newStatus }
                      : p
                  ),
                },
              }
            : t
        )
      )
    })

    return () => {
      unsubPendingApproval()
      unsubNewSession()
      unsubClosedSession()
      unsubJoinRequest()
      unsubActionResolved()
    }
  }, [on])

  // ── Toggle Actions ──────────────────────────────────────────
  const handleToggleSession = async (table: TableData) => {
    const isActive = !!table.activeSession
    setActioningId(table.id)

    try {
      if (isActive) {
        // Toggle OFF → Close active session
        const res = await fetch(`/api/owner/tables/${table.id}/session`, {
          method: 'DELETE',
        })
        const data = await res.json()
        if (!data.success) {
          alert(data.message || 'Failed to close session.')
        }
      } else {
        // Toggle ON → Manually open session
        const res = await fetch(`/api/owner/tables/${table.id}/session`, {
          method: 'POST',
        })
        const data = await res.json()
        if (!data.success) {
          alert(data.message || 'Failed to open session.')
        }
      }
    } catch {
      alert('A network error occurred. Please try again.')
    } finally {
      setActioningId(null)
    }
  }

  // ── Pending Approvals Actions ────────────────────────────────
  const handleApprovePending = async (tableId: string) => {
    setActioningId(tableId)
    try {
      const res = await fetch(`/api/owner/tables/${tableId}/approve`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.message || 'Failed to approve session.')
      }
    } catch {
      alert('Network error approving session.')
    } finally {
      setActioningId(null)
    }
  }

  const handleRejectPending = async (tableId: string) => {
    if (!confirm('Are you sure you want to decline this request?')) return
    setActioningId(tableId)
    try {
      const res = await fetch(`/api/owner/tables/${tableId}/approve`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.message || 'Failed to decline request.')
      }
    } catch {
      alert('Network error rejecting session.')
    } finally {
      setActioningId(null)
    }
  }

  // ── UI Render States ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading Live Monitor...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchLiveTables}
          className="mt-4 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium hover:bg-destructive/20"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Real-time Indicator Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isConnected ? 'Real-Time Connection Active' : 'Connecting to live updates...'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {tables.filter((t) => t.activeSession).length} of {tables.length} tables active
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((table) => {
          const session = table.activeSession
          const isPending = session?.status === 'PENDING'
          const isOpen = session && session.status !== 'PENDING'
          const isActioning = actioningId === table.id

          // Count guests (participants that are approved)
          const approvedGuests = session?.participants.filter((p) => p.status === 'APPROVED') || []
          const pendingGuests = session?.participants.filter((p) => p.status === 'PENDING') || []

          return (
            <div
              key={table.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 ${
                isPending
                  ? 'border-amber-400/60 ring-2 ring-amber-400/20 bg-amber-500/[0.01]'
                  : isOpen
                  ? 'border-emerald-500/30 shadow-emerald-500/[0.01] bg-emerald-500/[0.01]'
                  : 'border-border/60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Table {table.tableNumber}</h3>
                  <p className="text-xs text-muted-foreground">Capacity: {table.capacity} diners</p>
                </div>

                {/* State Badges or Notification Bell */}
                {isPending ? (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 animate-pulse dark:bg-amber-900/30 dark:text-amber-400">
                    <Bell className="h-4 w-4" />
                  </span>
                ) : isOpen ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Closed
                  </span>
                )}
              </div>

              {/* Dynamic Card Content Area */}
              <div className="my-6 min-h-[90px] border-t border-b border-border/40 py-4">
                {isPending ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                      <Clock className="h-4 w-4 animate-spin" />
                      Pending Approval
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Guests scanned the QR code and are waiting to unlock the menu.
                    </p>
                  </div>
                ) : isOpen ? (
                  <div className="space-y-3">
                    {/* Session Statistics */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="h-3.5 w-3.5" />
                        {approvedGuests.length + 1} Seated
                      </span>
                      <span>•</span>
                      <span className="font-medium">
                        {session.ordersCount} Order{session.ordersCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Dynamic Participants list */}
                    {approvedGuests.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {approvedGuests.map((p) => (
                          <span
                            key={p.id}
                            className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground max-w-[100px] truncate"
                            title={p.displayName || 'Guest'}
                          >
                            {p.displayName || 'Guest'}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pending join requests inside the active session */}
                    {pendingGuests.length > 0 && (
                      <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-2 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <UserPlus className="h-3 w-3 animate-bounce" />
                        <span>
                          {pendingGuests.length} join request{pendingGuests.length === 1 ? '' : 's'} pending host
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground/70 italic">Table is currently empty</p>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between gap-3 pt-2">
                {isPending ? (
                  /* Pending decision buttons */
                  <div className="flex w-full gap-2">
                    <button
                      id={`reject-session-${table.id}`}
                      disabled={isActioning}
                      onClick={() => handleRejectPending(table.id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-destructive/20 bg-destructive/5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </button>
                    <button
                      id={`approve-session-${table.id}`}
                      disabled={isActioning}
                      onClick={() => handleApprovePending(table.id)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Accept
                    </button>
                  </div>
                ) : (
                  /* Standard Toggle control */
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {isOpen ? 'Close Table Session' : 'Quick Open Table'}
                    </span>
                    <button
                      id={`toggle-table-${table.id}`}
                      disabled={isActioning}
                      onClick={() => handleToggleSession(table)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                        isOpen ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                          isOpen ? 'translate-x-5' : 'translate-x-0'
                        } flex items-center justify-center`}
                      >
                        {isActioning ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : null}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
