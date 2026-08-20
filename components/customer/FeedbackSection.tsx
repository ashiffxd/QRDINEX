'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

type RatingOption = 'BAD' | 'GOOD' | 'BEST' | 'EXCELLENT'

const ratingDetails: Record<RatingOption, { label: string; emoji: string; colorClass: string; activeClass: string }> = {
  BAD: {
    label: 'Bad',
    emoji: '😞',
    colorClass: 'hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-900/50',
    activeClass: 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/20 dark:bg-red-650 dark:border-red-600'
  },
  GOOD: {
    label: 'Good',
    emoji: '😊',
    colorClass: 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 dark:hover:bg-orange-950/20 dark:hover:text-orange-400 dark:hover:border-orange-900/50',
    activeClass: 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20 dark:bg-orange-650 dark:border-orange-600'
  },
  BEST: {
    label: 'Best',
    emoji: '⭐',
    colorClass: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/20 dark:hover:text-blue-400 dark:hover:border-blue-900/50',
    activeClass: 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20 dark:bg-blue-650 dark:border-blue-600'
  },
  EXCELLENT: {
    label: 'Excellent',
    emoji: '👑',
    colorClass: 'hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-950/20 dark:hover:text-green-400 dark:hover:border-green-900/50',
    activeClass: 'bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/20 dark:bg-green-650 dark:border-green-600'
  }
}

export function FeedbackSection() {
  const [restaurantRating, setRestaurantRating] = useState<RatingOption | null>(null)
  const [qrdinexRating, setQrdinexRating] = useState<RatingOption | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!restaurantRating || !qrdinexRating) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/customer/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantRating, qrdinexRating })
      })
      const data = await res.json()

      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.message || 'Something went wrong.')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 dark:border-emerald-950/50 bg-emerald-50/25 dark:bg-emerald-950/5 p-6 shadow-sm text-center animate-fade-in">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thank You!</h3>
        <p className="mt-1.5 text-xs text-slate-550 dark:text-slate-455">
          Your feedback has been saved. We appreciate you taking the time to share your experience!
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm text-left">
      <h3 className="text-lg font-bold text-foreground mb-1">Share Your Experience</h3>
      <p className="text-xs text-muted-foreground mb-6">Help us serve you better next time.</p>

      {/* Restaurant Review */}
      <div className="mb-6 space-y-3">
        <label className="text-sm font-semibold text-foreground">
          How was the Restaurant service?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(ratingDetails) as RatingOption[]).map((option) => {
            const detail = ratingDetails[option]
            const isActive = restaurantRating === option
            return (
              <button
                key={option}
                onClick={() => setRestaurantRating(option)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold transition-all ${
                  isActive ? detail.activeClass : `bg-background text-foreground ${detail.colorClass}`
                }`}
              >
                <span className="text-lg">{detail.emoji}</span>
                <span>{detail.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* QRDineX Review */}
      <div className="mb-6 space-y-3">
        <label className="text-sm font-semibold text-foreground">
          How was the QRDineX digital experience?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(ratingDetails) as RatingOption[]).map((option) => {
            const detail = ratingDetails[option]
            const isActive = qrdinexRating === option
            return (
              <button
                key={option}
                onClick={() => setQrdinexRating(option)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold transition-all ${
                  isActive ? detail.activeClass : `bg-background text-foreground ${detail.colorClass}`
                }`}
              >
                <span className="text-lg">{detail.emoji}</span>
                <span>{detail.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-500 mb-4 text-center">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!restaurantRating || !qrdinexRating || isSubmitting}
        className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  )
}
