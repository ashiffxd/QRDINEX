'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, ReceiptText } from 'lucide-react'
import { useCustomerSocket } from '@/hooks/useCustomerSocket'
import { SESSION_EVENTS } from '@/lib/socket/events'

export function RequestBillButton({ sessionStatus }: { sessionStatus: string }) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [hasRequested, setHasRequested] = useState(sessionStatus === 'BILL_REQUESTED')
  const [error, setError] = useState<string | null>(null)

  const { on } = useCustomerSocket()

  useEffect(() => {
    const unsubBill = on(SESSION_EVENTS.BILL_REQUESTED, () => {
      setHasRequested(true)
    })
    return () => unsubBill()
  }, [on])

  const handleRequest = async () => {
    setIsRequesting(true)
    setError(null)
    try {
      const res = await fetch('/api/customer/session/request-bill', {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        setHasRequested(true)
      } else {
        setError(data.message || 'Failed to request bill')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setIsRequesting(false)
    }
  }

  if (
    hasRequested ||
    sessionStatus === 'BILL_REQUESTED' ||
    sessionStatus === 'INVOICE_GENERATED' ||
    sessionStatus === 'COMPLETED' ||
    sessionStatus === 'CLOSED'
  ) {
    return (
      <div className="mt-8 rounded-xl bg-orange-50 p-5 text-center border border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50">
        <ReceiptText className="mx-auto mb-2 h-6 w-6 text-orange-500" />
        <p className="font-semibold text-orange-700 dark:text-orange-400">Bill Requested</p>
        <p className="text-xs text-orange-600/80 mt-1 mb-4 dark:text-orange-400/80">
          Your server has been notified. View real-time invoice status below.
        </p>
        <Link
          href="/invoice"
          className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-orange-600 px-4 py-3 font-bold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-orange-700"
        >
          View Invoice & Bill Status →
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8">
      {error && <p className="mb-2 text-center text-xs text-destructive">{error}</p>}
      <button
        onClick={handleRequest}
        disabled={isRequesting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-4 font-bold text-background transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {isRequesting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <ReceiptText className="h-5 w-5" />
            Request Bill
          </>
        )}
      </button>
    </div>
  )
}
