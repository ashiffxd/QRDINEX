'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { useOwnerSocket } from '@/hooks/useOwnerSocket'
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Settings, 
  LogOut,
  X,
  User,
  ListOrdered,
  Building2,
  QrCode,
  Users,
  ChefHat,
  BarChart3,
  Monitor
} from 'lucide-react'

interface OwnerSidebarProps {
  onClose?: () => void
}

export function OwnerSidebar({ onClose }: OwnerSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const [counts, setCounts] = useState({
    pendingSessions: 0,
    newOrders: 0,
    pendingGuests: 0,
  })

  const { on } = useOwnerSocket()

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/notifications')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setCounts({
            pendingSessions: data.pendingSessions || 0,
            newOrders: data.newOrders || 0,
            pendingGuests: data.pendingGuests || 0,
          })
        }
      }
    } catch (e) {
      console.error('[OwnerSidebar] Error fetching notifications:', e)
    }
  }, [])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  useEffect(() => {
    // Refresh badge counts in real-time when operation events occur
    const unsubOrderNew = on('order:new', fetchCounts)
    const unsubOrderStatus = on('order:status_updated', fetchCounts)
    const unsubSessionNew = on('session:new', fetchCounts)
    const unsubSessionPending = on('session:pending_approval', fetchCounts)
    const unsubSessionClosed = on('session:closed', fetchCounts)
    const unsubJoinReq = on('participant:join_request', fetchCounts)
    const unsubActionRes = on('participant:action_resolved', fetchCounts)

    return () => {
      unsubOrderNew()
      unsubOrderStatus()
      unsubSessionNew()
      unsubSessionPending()
      unsubSessionClosed()
      unsubJoinReq()
      unsubActionRes()
    }
  }, [on, fetchCounts])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard/overview', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Live Table Monitor', href: '/dashboard/tables/live', icon: Monitor },
        { name: 'Dining Tables', href: '/dashboard/tables', icon: Building2 },
        { name: 'QR Codes', href: '/dashboard/qr-codes', icon: QrCode },
        { name: 'Menu Categories', href: '/dashboard/menu/categories', icon: ListOrdered },
        { name: 'Menu Items', href: '/dashboard/menu/items', icon: UtensilsCrossed },
        { name: 'Orders', href: '/dashboard/orders', icon: ListOrdered },
        { name: 'Kitchen Display', href: '/dashboard/kitchen', icon: ChefHat },
        { name: 'Dining Sessions', href: '/dashboard/sessions', icon: Users },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'Restaurant Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
      ]
    }
  ]

  return (
    <div className="flex h-full w-full flex-col bg-card border-r border-border shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="QRDineX Logo" className="h-8 w-auto object-contain shadow-sm" />
          
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  
                  // Determine notification badge values
                  let badgeValue = 0
                  if (item.name === 'Live Table Monitor') {
                    badgeValue = counts.pendingSessions + counts.pendingGuests
                  } else if (item.name === 'Kitchen Display' || item.name === 'Orders') {
                    badgeValue = counts.newOrders
                  }

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span>{item.name}</span>
                        </div>
                        {badgeValue > 0 && (
                          <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                            item.name === 'Live Table Monitor' && counts.pendingSessions > 0
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {badgeValue}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
