'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Check, X, Loader2 } from 'lucide-react'
import { useCustomerSocket } from '@/hooks/useCustomerSocket'
import { PARTICIPANT_EVENTS } from '@/lib/socket/events'

interface Participant {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  joinedAt: string
  isMe: boolean
  displayName: string
}

export function ParticipantsManager() {
  const [isOpen, setIsOpen] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { on } = useCustomerSocket()

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/customer/session/participants')
      if (res.ok) {
        const data = await res.json()
        setParticipants(data.participants || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  useEffect(() => {
    if (isOpen) {
      fetchParticipants()
    }
  }, [isOpen, fetchParticipants])

  // Real-time socket event subscriptions
  useEffect(() => {
    const unsubReq = on(PARTICIPANT_EVENTS.JOIN_REQUEST, () => {
      fetchParticipants()
    })
    const unsubRes = on(PARTICIPANT_EVENTS.ACTION_RESOLVED, () => {
      fetchParticipants()
    })

    return () => {
      unsubReq()
      unsubRes()
    }
  }, [on, fetchParticipants])

  const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/customer/session/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: id, action }),
      })
      if (res.ok) {
        fetchParticipants()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const pendingCount = participants.filter((p) => p.status === 'PENDING').length

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative rounded-full p-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      >
        <Users className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Table Participants</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No participants found.</p>
            ) : (
              <div className="space-y-4">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div>
                      <p className="font-medium">
                        {p.displayName} {p.isMe && <span className="text-xs font-normal text-muted-foreground">(You)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: <span className="font-medium">{p.status}</span>
                      </p>
                    </div>

                    {p.status === 'PENDING' && !p.isMe && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(p.id, 'APPROVE')}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAction(p.id, 'REJECT')}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
