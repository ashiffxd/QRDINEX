'use client'

import { useState, useEffect, useCallback } from 'react'


import Link from 'next/link'
import {
  Users,
  Building2,
  ListOrdered,
  UtensilsCrossed,
  QrCode,
  Clock,
  Activity,
  Bell,
} from 'lucide-react'
import { useOwnerSocket } from '@/hooks/useOwnerSocket'
import {
  ORDER_EVENTS,
  SESSION_EVENTS,
  PARTICIPANT_EVENTS,
  WAITER_EVENTS,
} from '@/lib/socket/events'
import type { OwnerDashboardStats, DashboardActivity } from '@/services/owner/dashboard.service'

interface OverviewDashboardClientProps {
  initialStats: OwnerDashboardStats
}

export function OverviewDashboardClient({ initialStats }: OverviewDashboardClientProps) {
  const [stats, setStats] = useState<OwnerDashboardStats>(initialStats)
  const { isConnected, on } = useOwnerSocket()

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/stats')
      const data = await res.json()
      if (data.success && data.stats) {
        setStats(data.stats)
      }
    } catch (e) {
      console.error('[OverviewDashboard] Failed to refresh stats:', e)
    }
  }, [])

  // Real-time socket event subscriptions
  useEffect(() => {
    const unsubOrderNew = on(ORDER_EVENTS.NEW, refreshStats)
    const unsubOrderStatus = on(ORDER_EVENTS.STATUS_UPDATED, refreshStats)
    const unsubSessionNew = on(SESSION_EVENTS.NEW, refreshStats)
    const unsubSessionBill = on(SESSION_EVENTS.BILL_REQUESTED, refreshStats)
    const unsubSessionClosed = on(SESSION_EVENTS.CLOSED, refreshStats)
    const unsubJoinReq = on(PARTICIPANT_EVENTS.JOIN_REQUEST, refreshStats)

    // Play "ting" sound and refresh dashboard activities when a customer calls the waiter
    const handleWaiterCall = () => {
      const audio = new Audio('/ting.mp3')
      audio.play().catch((err) => console.log('[OverviewDashboard] Audio playback prevented:', err))
      refreshStats()
    }
    const unsubWaiterCall = on(WAITER_EVENTS.CALL, handleWaiterCall)

    return () => {
      unsubOrderNew()
      unsubOrderStatus()
      unsubSessionNew()
      unsubSessionBill()
      unsubSessionClosed()
      unsubJoinReq()
      unsubWaiterCall()
    }
  }, [on, refreshStats])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live snapshot of your restaurant operations today.
          </p>
        </div>
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
              }`}
            />
            {isConnected ? 'Live' : 'Polling'}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KEY METRICS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Active Sessions" value={stats.activeSessions} icon={Users} color="text-blue-500" />
        <StatCard title="Open Tables" value={stats.openTables} icon={Building2} color="text-indigo-500" />
        <StatCard title="Total Tables" value={stats.totalTables} icon={Building2} color="text-slate-500" />
        <StatCard title="Menu Items" value={stats.totalMenuItems} icon={UtensilsCrossed} color="text-emerald-500" />
        <StatCard title="QR Codes" value={stats.totalQrCodes} icon={QrCode} color="text-purple-500" />
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon={Clock} color="text-amber-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ------------------------------------------------------------------ */}
        {/* QUICK ACTIONS                                                      */}
        {/* ------------------------------------------------------------------ */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
            <h2 className="font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            <QuickActionCard title="Manage Tables" icon={Building2} href="/dashboard/tables" />
            <QuickActionCard title="Manage QRs" icon={QrCode} href="/dashboard/qr-codes" />
            <QuickActionCard title="Categories" icon={ListOrdered} href="/dashboard/menu/categories" />
            <QuickActionCard title="Menu Items" icon={UtensilsCrossed} href="/dashboard/menu/items" />
            <QuickActionCard title="View Orders" icon={ListOrdered} href="/dashboard/orders" />
            <QuickActionCard title="Sessions" icon={Users} href="/dashboard/sessions" />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* RECENT ACTIVITY                                                    */}
        {/* ------------------------------------------------------------------ */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm flex flex-col h-[320px]">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4 shrink-0">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {!stats.activities || stats.activities.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
                  <Clock className="h-6 w-6 text-muted-foreground/70" />
                </div>
                <p className="font-medium text-foreground">No recent activity</p>
                <p className="mt-1 max-w-xs mx-auto">
                  Operations feed will populate as customers scan QR codes and place orders.
                </p>
              </div>
            ) : (
              stats.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-muted/10 transition-colors">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    activity.type === 'ORDER' ? 'bg-amber-500/10 text-amber-500' :
                    activity.type === 'WAITER_CALL' ? 'bg-orange-500/10 text-orange-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {activity.type === 'WAITER_CALL' ? (
                      <Bell className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.desc}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                    {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border bg-card px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground leading-tight max-w-[70%]">{title}</p>
        <Icon className={`h-5 w-5 ${color} opacity-80`} />
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  )
}

function QuickActionCard({ title, icon: Icon, href }: { title: string; icon: any; href: string }) {
  return (
    <Link 
      href={href}
      className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-center text-xs font-medium text-foreground">{title}</span>
    </Link>
  )
}
