'use client'

/**
 * StartDiningButton
 * ================
 * Handles the "Start Dining" button on the QR entry page.
 *
 * OPEN mode:   → calls /api/customer/session/start → redirect to /menu
 * APPROVAL mode: → calls /api/customer/session/start → shows OwnerWaitingScreen
 *                  while listening to socket event session:owner_approved
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, UtensilsCrossed, Clock, XCircle } from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface StartDiningButtonProps {
  token: string
  initialState?: 'idle' | 'loading' | 'waiting_owner' | 'rejected'
  initialSessionId?: string | null
}

type ViewState = 'idle' | 'loading' | 'waiting_owner' | 'rejected'

export function StartDiningButton({
  token,
  initialState = 'idle',
  initialSessionId = null,
}: StartDiningButtonProps) {
  const [view, setView] = useState<ViewState>(initialState)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const router = useRouter()

  // Socket.io subscription — only active when waiting for owner approval
  useEffect(() => {
    if (view !== 'waiting_owner' || !sessionId) return

    const socket: Socket = io('/customer', {
      path: '/socket.io',
      transports: ['websocket'],
    })

    socket.on('session:owner_approved', (payload: { sessionId: string; sessionToken: string }) => {
      if (payload.sessionId === sessionId) {
        // Owner approved — redirect to menu
        router.push('/menu')
      }
    })

    socket.on('session:owner_rejected', (payload: { sessionId: string }) => {
      if (payload.sessionId === sessionId) {
        setView('rejected')
        socket.disconnect()
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [view, sessionId, router])

  const handleStartSession = async () => {
    setView('loading')
    setError(null)

    try {
      const response = await fetch('/api/customer/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.message || 'Unable to start session.')
        setView('idle')
        return
      }

      if (data.requiresOwnerApproval) {
        // APPROVAL mode — show waiting screen
        setSessionId(data.sessionId)
        setView('waiting_owner')
      } else {
        // OPEN mode — go straight to menu
        router.push('/menu')
      }
    } catch {
      setError('A network error occurred. Please try again.')
      setView('idle')
    }
  }

  // ── Waiting for owner approval ───────────────────────────────
  if (view === 'waiting_owner') {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        {/* Animated pulse ring */}
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-foreground">Waiting for staff to seat you</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The restaurant has been notified. You'll be let in shortly.
          </p>
        </div>

        {/* Animated dots */}
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

  // ── Owner rejected ────────────────────────────────────────────
  if (view === 'rejected') {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Table Not Available</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please speak to a staff member for assistance.
          </p>
        </div>
      </div>
    )
  }

  // ── Default: Start Dining button ─────────────────────────────
  return (
    <div className="mt-8 flex flex-col items-center">
      <button
        id="start-dining-btn"
        onClick={handleStartSession}
        disabled={view === 'loading'}
        className="flex h-12 w-full max-w-[240px] items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {view === 'loading' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <UtensilsCrossed className="h-4 w-4" />
            Start Dining
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-left text-sm text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
