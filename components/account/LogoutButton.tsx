'use client'

/**
 * QRDineX — Logout Button Component
 * ==========================================================================
 * Calls POST /api/auth/logout then redirects to /login.
 * Can be used anywhere in authenticated layouts.
 *
 * Props:
 *  - variant: 'button' | 'menuItem' — controls visual style
 *  - className: optional additional Tailwind classes
 * ==========================================================================
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'

interface LogoutButtonProps {
  /** Visual variant — full button or compact menu item */
  variant?: 'button' | 'menuItem'
  /** Additional Tailwind classes */
  className?: string
}

export function LogoutButton({ variant = 'button', className = '' }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Even if the request fails, redirect — the cookie may still be cleared
      // by a subsequent request, and the middleware will block re-entry anyway.
    } finally {
      // Always redirect regardless of network state
      router.push('/login')
      router.refresh()
    }
  }

  if (variant === 'menuItem') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 ${className}`}
      >
        {isLoggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {isLoggingOut ? 'Signing out…' : 'Sign Out'}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex h-10 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {isLoggingOut ? 'Signing out…' : 'Sign Out'}
    </button>
  )
}
