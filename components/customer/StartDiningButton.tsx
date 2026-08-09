'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

interface StartDiningButtonProps {
  token: string
}

export function StartDiningButton({ token }: StartDiningButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleStartSession = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/customer/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (data.code === 'TABLE_OCCUPIED') {
          setError('This table is currently occupied. Please ask staff for assistance.')
        } else {
          setError(data.message || 'Unable to start session.')
        }
        setIsLoading(false)
        return
      }

      // Success! The HTTP-only cookie is now set.
      // Redirect to the customer menu.
      router.push('/menu')
      
      // We purposefully don't set isLoading(false) here so the button
      // stays in a loading state while the page transitions to /menu
    } catch (err) {
      console.error('Failed to start dining session:', err)
      setError('A network error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center">
      <button
        onClick={handleStartSession}
        disabled={isLoading}
        className="flex h-12 w-full max-w-[240px] items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Menu...
          </>
        ) : (
          'Start Dining'
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
