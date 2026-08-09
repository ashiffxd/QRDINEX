'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Clock, XCircle } from 'lucide-react'

interface JoinSessionClientProps {
  token: string
  initialStatus?: 'NOT_REQUESTED' | 'PENDING' | 'REJECTED'
}

export function JoinSessionClient({ token, initialStatus = 'NOT_REQUESTED' }: JoinSessionClientProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRequestJoin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/customer/session/request-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('PENDING')
      } else {
        setError(data.message || 'Failed to request join')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  // Check status helper
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/customer/session/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.status === 'APPROVED') {
          router.push('/menu')
        } else if (data.status === 'REJECTED') {
          setStatus('REJECTED')
        }
      }
    } catch (e) {
      // ignore check errors
    }
  }

  // Polling for status updates (fallback)
  useEffect(() => {
    if (status !== 'PENDING') return

    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [status, token, router])

  if (status === 'PENDING') {
    return (
      <div className="mt-8 flex flex-col items-center">
        <div className="flex h-12 w-full max-w-[240px] items-center justify-center gap-2 rounded-xl bg-muted text-base font-medium text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Waiting for approval...
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Someone at the table needs to approve your request.
        </p>
      </div>
    )
  }

  if (status === 'REJECTED') {
    return (
      <div className="mt-8 flex flex-col items-center">
        <div className="flex h-12 w-full max-w-[240px] items-center justify-center gap-2 rounded-xl bg-destructive/10 text-base font-medium text-destructive">
          <XCircle className="h-5 w-5" />
          Request Declined
        </div>
        <button
          onClick={handleRequestJoin}
          disabled={isLoading}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Request Again
        </button>
      </div>
    )
  }

  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="mb-4 flex items-start gap-2 text-left text-sm text-amber-600">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This table already has an active session.</p>
      </div>
      
      <button
        onClick={handleRequestJoin}
        disabled={isLoading}
        className="flex h-12 w-full max-w-[240px] items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Requesting...
          </>
        ) : (
          'Request to Join'
        )}
      </button>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
