'use client'

/**
 * JoinSessionClient
 * =================
 * Shown when Person B scans a QR code that already has an active session.
 *
 * Flow:
 *  1. NOT_REQUESTED → Name input → "Request to Join" button
 *  2. PENDING       → Waiting screen (socket listener for action_resolved)
 *  3. REJECTED      → Rejection screen with "Try Again" button
 *  4. APPROVED      → Redirect to /menu (handled by socket event)
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  AlertCircle,
  Clock,
  XCircle,
  UserPlus,
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface JoinSessionClientProps {
  token: string
  /** Pre-resolved state from server — if the device already has a PENDING/REJECTED record */
  initialStatus?: 'NOT_REQUESTED' | 'PENDING' | 'REJECTED'
}

type ViewState = 'name_input' | 'loading' | 'pending' | 'rejected'

export function JoinSessionClient({
  token,
  initialStatus = 'NOT_REQUESTED',
}: JoinSessionClientProps) {
  const [view, setView] = useState<ViewState>(
    initialStatus === 'PENDING'
      ? 'pending'
      : initialStatus === 'REJECTED'
      ? 'rejected'
      : 'name_input'
  )
  const [displayName, setDisplayName] = useState('')
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const router = useRouter()

  // ── Socket.io: listen for action_resolved while waiting ──────
  useEffect(() => {
    if (view !== 'pending') return

    const socket: Socket = io('/customer', {
      path: '/socket.io',
      transports: ['websocket'],
    })
    socketRef.current = socket

    socket.on(
      'participant:action_resolved',
      (payload: { sessionId: string; participantId: string; newStatus: 'APPROVED' | 'REJECTED' }) => {
        // Only react if this event is for our participant ID
        if (participantId && payload.participantId !== participantId) return

        if (payload.newStatus === 'APPROVED') {
          router.push('/menu')
        } else {
          setView('rejected')
          socket.disconnect()
        }
      }
    )

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [view, participantId, router])

  // ── Send join request ────────────────────────────────────────
  const handleRequestJoin = async () => {
    const trimmed = displayName.trim()
    if (!trimmed) {
      setError('Please enter your name so the table host knows who is joining.')
      return
    }

    setView('loading')
    setError(null)

    try {
      const res = await fetch('/api/customer/session/request-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, displayName: trimmed }),
      })
      const data = await res.json()

      if (data.success) {
        setParticipantId(data.participantId)
        setView('pending')
      } else {
        setError(data.message || 'Failed to send join request')
        setView('name_input')
      }
    } catch {
      setError('Network error. Please try again.')
      setView('name_input')
    }
  }

  // ── Waiting screen ───────────────────────────────────────────
  if (view === 'pending') {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-foreground">Waiting for approval</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The person who opened this table is reviewing your request.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Rejected screen ──────────────────────────────────────────
  if (view === 'rejected') {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>

        <div>
          <p className="text-base font-semibold text-foreground">Request Declined</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The table host declined your request. Please ask staff for assistance.
          </p>
        </div>

        <button
          id="retry-join-btn"
          onClick={() => {
            setError(null)
            setView('name_input')
          }}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Try Again
        </button>
      </div>
    )
  }

  // ── Name input + Request button ──────────────────────────────
  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      {/* Context badge */}
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This table already has an active session. Enter your name to request to join.</p>
      </div>

      {/* Name input */}
      <div className="w-full">
        <input
          id="join-display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRequestJoin()}
          placeholder="Your name (e.g. Sarah)"
          maxLength={40}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {error && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        )}
      </div>

      {/* Request button */}
      <button
        id="request-join-btn"
        onClick={handleRequestJoin}
        disabled={view === 'loading'}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {view === 'loading' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending Request...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Request to Join
          </>
        )}
      </button>
    </div>
  )
}
