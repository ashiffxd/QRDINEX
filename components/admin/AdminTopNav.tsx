'use client'

/**
 * QRDineX — Admin Top Navigation
 * ==========================================================================
 * Top bar for the Super Admin layout. Receives admin name as a prop
 * (resolved server-side from middleware headers) so no client-side fetch.
 * ==========================================================================
 */

import { useState } from 'react'
import Link from 'next/link'
import { Menu, User, Settings, ChevronDown, Bell } from 'lucide-react'
import { LogoutButton } from '@/components/account/LogoutButton'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

interface AdminTopNavProps {
  /** Admin's full name — passed from the Server layout */
  adminName: string
  /** Callback to toggle the mobile sidebar */
  onMenuClick: () => void
}

export function AdminTopNav({ adminName, onMenuClick }: AdminTopNavProps) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left — mobile menu + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="hidden text-sm font-medium text-muted-foreground sm:block">
          Super Admin Panel
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {/* Notification bell (placeholder — functionality in later phase) */}
        <button
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Unread indicator dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              profileOpen
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="Account menu"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="hidden max-w-[120px] truncate sm:block">{adminName}</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                profileOpen && 'rotate-180',
              )}
            />
          </button>

          {/* Dropdown menu */}
          {profileOpen && (
            <>
              {/* Click-away overlay */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                {/* User info header */}
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">{adminName}</p>
                  <p className="text-xs text-muted-foreground">Super Admin</p>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <Link
                    href="/admin/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-border p-1.5">
                  <LogoutButton variant="menuItem" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
