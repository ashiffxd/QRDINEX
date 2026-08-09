'use client'

import { useState, useCallback } from 'react'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  UtensilsCrossed,
  ChefHat,
  Building2,
  Calendar,
  Filter,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react'
import { formatCurrency } from '@/lib/currency'

interface AnalyticsDashboardClientProps {
  currency: string
  initialOverview: any
  initialRevenue: any
  initialOrders: any
  initialMenu: any
  initialTables: any
  initialKitchen: any
  initialSessions: any
}

export function AnalyticsDashboardClient({
  currency,
  initialOverview,
  initialRevenue,
  initialOrders,
  initialMenu,
  initialTables,
  initialKitchen,
  initialSessions,
}: AnalyticsDashboardClientProps) {
  const [range, setRange] = useState<'today' | 'yesterday' | '7days' | '30days' | 'custom'>('7days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [overview, setOverview] = useState(initialOverview)
  const [revenue, setRevenue] = useState(initialRevenue)
  const [orders, setOrders] = useState(initialOrders)
  const [menu, setMenu] = useState(initialMenu)
  const [tables, setTables] = useState(initialTables)
  const [kitchen, setKitchen] = useState(initialKitchen)
  const [sessions, setSessions] = useState(initialSessions)

  const fetchAnalytics = useCallback(
    async (selectedRange: string, customStart?: string, customEnd?: string) => {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams()
        queryParams.set('range', selectedRange)
        if (selectedRange === 'custom' && customStart && customEnd) {
          queryParams.set('startDate', customStart)
          queryParams.set('endDate', customEnd)
        }

        const [
          resOverview,
          resRev,
          resOrd,
          resMenu,
          resTables,
          resKitchen,
          resSessions,
        ] = await Promise.all([
          fetch(`/api/owner/analytics/overview?${queryParams.toString()}`),
          fetch(`/api/owner/analytics/revenue?${queryParams.toString()}`),
          fetch(`/api/owner/analytics/orders?${queryParams.toString()}`),
          fetch(`/api/owner/analytics/menu?${queryParams.toString()}`),
          fetch(`/api/owner/analytics/tables?${queryParams.toString()}`),
          fetch(`/api/owner/analytics/kitchen?${queryParams.toString()}`),
          fetch(`/api/owner/analytics/sessions?${queryParams.toString()}`),
        ])

        const [dOverview, dRev, dOrd, dMenu, dTables, dKitchen, dSessions] = await Promise.all([
          resOverview.json(),
          resRev.json(),
          resOrd.json(),
          resMenu.json(),
          resTables.json(),
          resKitchen.json(),
          resSessions.json(),
        ])

        if (dOverview.success) setOverview(dOverview.overview)
        if (dRev.success) setRevenue(dRev.revenue)
        if (dOrd.success) setOrders(dOrd.orders)
        if (dMenu.success) setMenu(dMenu.menu)
        if (dTables.success) setTables(dTables.tables)
        if (dKitchen.success) setKitchen(dKitchen.kitchen)
        if (dSessions.success) setSessions(dSessions.sessions)
      } catch (err) {
        console.error('[Analytics] Fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const handleRangeChange = (newRange: 'today' | 'yesterday' | '7days' | '30days' | 'custom') => {
    setRange(newRange)
    if (newRange !== 'custom') {
      fetchAnalytics(newRange)
    }
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (startDate && endDate) {
      fetchAnalytics('custom', startDate, endDate)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Date Filter Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-foreground">Date Range Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'custom', label: 'Custom Range' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleRangeChange(item.id as any)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                range === item.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Form */}
      {range === 'custom' && (
        <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">End Date</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              Apply Filter
            </button>
          </div>
        </form>
      )}

      {/* 1. OVERVIEW KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-foreground">
            {formatCurrency(overview.totalRevenue, currency)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Paid Invoices Only</p>
        </div>

        {/* Total Orders */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-foreground">{overview.totalOrders}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            AOV: {formatCurrency(overview.averageOrderValue, currency)}
          </p>
        </div>

        {/* Completed Sessions */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Completed Sessions
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-foreground">
            {overview.completedSessions}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Active Now: {overview.activeSessions}
          </p>
        </div>

        {/* Avg Session Duration */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Avg Dining Duration
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-foreground">
            {overview.avgSessionDurationMins} mins
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Per Table Visit</p>
        </div>
      </div>

      {/* 2. REVENUE ANALYTICS */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Revenue Performance
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Based exclusively on verified paid invoices.
            </p>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-center">
            <span className="text-[11px] font-bold text-muted-foreground">Today</span>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrency(revenue.todayRevenue, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-center">
            <span className="text-[11px] font-bold text-muted-foreground">Yesterday</span>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrency(revenue.yesterdayRevenue, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-center">
            <span className="text-[11px] font-bold text-muted-foreground">Last 7 Days</span>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrency(revenue.last7DaysRevenue, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-center">
            <span className="text-[11px] font-bold text-muted-foreground">Last 30 Days</span>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatCurrency(revenue.last30DaysRevenue, currency)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 text-center">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">All-Time Revenue</span>
            <p className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-400">
              {formatCurrency(revenue.totalRevenue, currency)}
            </p>
          </div>
        </div>

        {/* Revenue Trend Line Chart (SVG) */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Daily Revenue Trend
          </h4>
          {revenue.trendData && revenue.trendData.length > 0 ? (
            <SimpleLineChart data={revenue.trendData} currency={currency} />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              No revenue trend data available for this range.
            </div>
          )}
        </div>
      </div>

      {/* 3. ORDERS & MENU ANALYTICS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-500" />
              Order Volume & Status
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Order status distribution for selected range.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
              <span className="text-[10px] font-bold text-muted-foreground">Completed</span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{orders.completedOrders}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
              <span className="text-[10px] font-bold text-muted-foreground">Preparing</span>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400">{orders.preparingOrders}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
              <span className="text-[10px] font-bold text-muted-foreground">Ready</span>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">{orders.readyOrders}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
              <span className="text-[10px] font-bold text-muted-foreground">Cancelled</span>
              <p className="text-base font-bold text-red-600 dark:text-red-400">{orders.cancelledOrders}</p>
            </div>
          </div>

          {/* Daily Orders Bar Chart */}
          {orders.trendData && orders.trendData.length > 0 ? (
            <SimpleBarChart data={orders.trendData} />
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              No order data for selected range.
            </div>
          )}
        </div>

        {/* Top Selling Menu Items */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-amber-500" />
              Top Selling Menu Items
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Most ordered items by quantity sold.
            </p>
          </div>

          {menu.topItems && menu.topItems.length > 0 ? (
            <div className="divide-y divide-border">
              {menu.topItems.map((item: any, idx: number) => (
                <div key={item.menuItemId} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                        {item.itemName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantitySold} orders sold
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(item.totalRevenue, currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              No menu items sold yet in this range.
            </div>
          )}
        </div>
      </div>

      {/* 4. KITCHEN & TABLE ANALYTICS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kitchen Analytics */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-amber-500" />
              Kitchen Performance (KDS)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preparation speed calculated from KDS timestamps.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
              <span className="text-xs font-bold text-muted-foreground">Avg Prep Time</span>
              <p className="mt-1 text-xl font-black text-amber-600 dark:text-amber-400">
                {kitchen.avgPrepTimeMins} mins
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
              <span className="text-xs font-bold text-muted-foreground">Fastest Prep</span>
              <p className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">
                {kitchen.fastestPrepTimeMins} mins
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
              <span className="text-xs font-bold text-muted-foreground">Slowest Prep</span>
              <p className="mt-1 text-xl font-black text-red-600 dark:text-red-400">
                {kitchen.slowestPrepTimeMins} mins
              </p>
            </div>
          </div>
        </div>

        {/* Table Analytics */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-500" />
              Table Utilization
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Most active tables and visit durations.
            </p>
          </div>

          {tables.tableStats && tables.tableStats.length > 0 ? (
            <div className="divide-y divide-border">
              {tables.tableStats.slice(0, 5).map((t: any) => (
                <div key={t.tableId} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-semibold text-foreground">Table {t.tableNumber}</span>
                  <div className="text-right">
                    <span className="font-bold text-primary">{t.totalSessions} sessions</span>
                    <span className="ml-3 text-xs text-muted-foreground">
                      ~{t.avgDurationMins} min avg visit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              No table activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SVG LINE CHART (Revenue Trend)
// ---------------------------------------------------------------------------
function SimpleLineChart({ data, currency }: { data: { date: string; revenue: number }[]; currency: string }) {
  if (!data || data.length === 0) return null

  const maxVal = Math.max(...data.map((d) => d.revenue), 1)
  const height = 140
  const width = 600

  const points = data
    .map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width
      const y = height - (d.revenue / maxVal) * (height - 20) - 10
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="w-full overflow-x-auto pt-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
        {/* Background Grid Lines */}
        <line x1="0" y1="10" x2={width} y2="10" stroke="currentColor" className="text-border/40" strokeDasharray="4" />
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" className="text-border/40" strokeDasharray="4" />
        <line x1="0" y1={height - 10} x2={width} y2={height - 10} stroke="currentColor" className="text-border/40" />

        {/* Polylines for Revenue curve */}
        <polyline fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500" points={points} />

        {/* Point markers */}
        {data.map((d, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * width
          const y = height - (d.revenue / maxVal) * (height - 20) - 10
          return (
            <g key={i} className="group">
              <circle cx={x} cy={y} r="4" className="fill-emerald-500 stroke-background stroke-2" />
              <title>{`${d.date}: ${formatCurrency(d.revenue, currency)}`}</title>
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SVG BAR CHART (Orders Trend)
// ---------------------------------------------------------------------------
function SimpleBarChart({ data }: { data: { date: string; totalOrders: number }[] }) {
  if (!data || data.length === 0) return null

  const maxVal = Math.max(...data.map((d) => d.totalOrders), 1)

  return (
    <div className="w-full space-y-2 pt-2">
      <div className="flex items-end justify-between gap-1 h-32 pt-4">
        {data.map((d, idx) => {
          const heightPct = Math.max(8, (d.totalOrders / maxVal) * 100)
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[10px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {d.totalOrders}
              </span>
              <div
                style={{ height: `${heightPct}%` }}
                className="w-full max-w-[28px] rounded-t-md bg-blue-500/80 hover:bg-blue-500 transition-colors"
                title={`${d.date}: ${d.totalOrders} orders`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/60">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}
