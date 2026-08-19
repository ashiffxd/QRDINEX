'use client'

import { useState } from 'react'
import { Bell, X, Loader2 } from 'lucide-react'

export function FloatingWaiterCallButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [loadingType, setLoadingType] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const options = [
    { label: 'Request Water', type: 'WATER', icon: '💧' },
    { label: 'Request Tissues', type: 'TISSUE', icon: '🧻' },
    { label: 'Table Cleaning', type: 'CLEANING', icon: '🧹' },
    { label: 'Other Assistance', type: 'ASSISTANCE', icon: '🛎️' },
  ]

  const handleCall = async (type: string, label: string) => {
    setLoadingType(type)
    try {
      const res = await fetch('/api/customer/waiter-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(`Requested ${label}. Staff has been notified!`)
        setTimeout(() => {
          setSuccessMsg(null)
          setIsOpen(false)
        }, 3000)
      } else {
        alert(data.message || 'Failed to contact waiter.')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 hover:scale-105 transition-all duration-200"
        aria-label="Call Waiter"
      >
        <Bell className="h-6 w-6 animate-pulse" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          {/* Modal Card */}
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛎️</span>
                <h3 className="font-display text-lg font-bold text-foreground">Call Waiter</h3>
              </div>
              <button
                onClick={() => {
                  if (!loadingType && !successMsg) setIsOpen(false)
                }}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                disabled={!!loadingType || !!successMsg}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="py-8 text-center animate-in fade-in duration-300">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-xl font-bold">
                  ✓
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">{successMsg}</p>
                <p className="mt-1 text-xs text-muted-foreground">Staff is on their way to your table.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Select what you need, and the waiter will bring it to your table in real-time.
                </p>
                <div className="grid gap-2">
                  {options.map((opt) => {
                    const isSelectedLoading = loadingType === opt.type
                    return (
                      <button
                        key={opt.type}
                        onClick={() => handleCall(opt.type, opt.label)}
                        disabled={!!loadingType}
                        className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm font-medium hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{opt.icon}</span>
                          <span className="text-foreground">{opt.label}</span>
                        </div>
                        {isSelectedLoading && (
                          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
