'use client'

/**
 * JoinRequestToast
 * ================
 * Shows a floating toast notification to the HOST (Person A) when Person B
 * sends a join request. Person A can Accept or Reject directly from the toast.
 *
 * Listens to the participant:join_request socket event.
 * Calls /api/customer/session/action to approve or reject.
 */

import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Check, X, Loader2 } from 'lucide-react'
import { useCustomerSocket } from '@/hooks/useCustomerSocket'
import { PARTICIPANT_EVENTS } from '@/lib/socket/events'

interface PendingRequest {
  participantId: string
  displayName: string
  tableNumber: number
}

export function JoinRequestToast() {
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { on } = useCustomerSocket()

  // Listen for incoming join requests
  useEffect(() => {
    const unsub = on(
      PARTICIPANT_EVENTS.JOIN_REQUEST,
      (payload: { sessionId: string; participantId: string; tableNumber: number; displayName: string }) => {
        setRequests((prev) => {
          // Avoid duplicate entries for the same participantId
          if (prev.some((r) => r.participantId === payload.participantId)) return prev
          return [
            ...prev,
            {
              participantId: payload.participantId,
              displayName: payload.displayName,
              tableNumber: payload.tableNumber,
            },
          ]
        })
      }
    )
    return unsub
  }, [on])

  const handleAction = useCallback(
    async (participantId: string, action: 'APPROVE' | 'REJECT') => {
      setProcessingId(participantId)
      try {
        await fetch('/api/customer/session/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participantId, action }),
        })
      } catch {
        // ignore — action_resolved socket will still fire from server
      } finally {
        // Remove the request from the list regardless of outcome
        setRequests((prev) => prev.filter((r) => r.participantId !== participantId))
        setProcessingId(null)
      }
    },
    []
  )

  if (requests.length === 0) return null

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
    >
      {requests.map((req) => {
        const isProcessing = processingId === req.participantId
        return (
          <div
            key={req.participantId}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl"
          >
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {req.displayName}
              </p>
              <p className="text-xs text-muted-foreground">wants to join your table</p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                id={`reject-join-${req.participantId}`}
                onClick={() => handleAction(req.participantId, 'REJECT')}
                disabled={isProcessing}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                aria-label={`Reject ${req.displayName}`}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>

              <button
                id={`approve-join-${req.participantId}`}
                onClick={() => handleAction(req.participantId, 'APPROVE')}
                disabled={isProcessing}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label={`Accept ${req.displayName}`}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
