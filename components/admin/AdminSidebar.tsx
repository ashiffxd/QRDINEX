'use client'

/**
 * QRDineX — Admin Sidebar Component
 * ==========================================================================
 * Responsive collapsible sidebar for the Super Admin layout.
 * Uses usePathname for active link highlighting.
 * ==========================================================================
 */

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Clock,
  CheckCircle2,
  MinusCircle,
  Settings,
  User,
  X,
  Utensils,
} from 'lucide-react'
import { LogoutButton } from '@/components/account/LogoutButton'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// NAV ITEMS CONFIG
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Restaurants',
    items: [
      { label: 'All Restaurants',    href: '/admin/restaurants',              icon: Building2    },
      { label: 'Pending Approvals',  href: '/admin/pending',                  icon: Clock        },
      { label: 'Active',             href: '/admin/restaurants?status=ACTIVE',   icon: CheckCircle2 },
      { label: 'Inactive',           href: '/admin/restaurants?status=INACTIVE', icon: MinusCircle  },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: Settings },
      { label: 'Profile',  href: '/admin/profile',  icon: User     },
    ],
  },
] as const


// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = (href: string) => {
    if (href.includes('?')) {
      const [hrefPath, hrefSearch] = href.split('?')
      const hrefParams = new URLSearchParams(hrefSearch)
      // Check if all parameters from the href exist and match in the current searchParams
      const matchesAll = Array.from(hrefParams.entries()).every(([key, value]) => {
        return searchParams.get(key) === value
      })
      return pathname === hrefPath && matchesAll
    }
    // For non-query links, we make sure searchParams is empty or does not contain status
    // so that 'All Restaurants' (href: /admin/restaurants) isn't highlighted when we are on a filtered status
    if (href === '/admin/restaurants') {
      return pathname === href && !searchParams.has('status')
    }
    return pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
  }


  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 font-bold text-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Utensils className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base tracking-tight">QRDineX</span>
          </Link>

          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin badge */}
        <div className="mx-4 mt-4 rounded-lg bg-primary/10 px-3 py-1.5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Super Admin
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sidebar navigation">
          {NAV_ITEMS.map((group) => (
            <div key={group.group} className="mb-5">
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.group}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ label, href, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        isActive(href)
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                      aria-current={isActive(href) ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Logout at the bottom */}
        <div className="border-t border-border p-3">
          <LogoutButton variant="menuItem" className="w-full" />
        </div>
      </aside>
    </>
  )
}
