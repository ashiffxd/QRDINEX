'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Flame,
  Clock,
  CheckCircle2,
  Bell,
  Search,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Loader2,
  Utensils,
  ChefHat,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react'
import { useOwnerSocket } from '@/hooks/useOwnerSocket'
import { ORDER_EVENTS } from '@/lib/socket/events'

export interface KitchenOrderItem {
  id: string
  itemName: string
  quantity: number
  isVeg?: boolean
}

export interface KitchenOrder {
  id: string
  orderNumber: string
  sessionId: string
  tableNumber: number
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  items: KitchenOrderItem[]
}

interface KitchenDisplayClientProps {
  initialOrders: KitchenOrder[]
}

// Utility to calculate human-readable elapsed time from ISO timestamp
function getElapsedTime(createdAtISO: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(createdAtISO).getTime())
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const hours = Math.floor(diffMins / 60)
  const remMins = diffMins % 60
  return `${hours}h ${remMins}m ago`
}

// Get badge color based on elapsed minutes
function getElapsedSeverity(createdAtISO: string): { bg: string; text: string } {
  const diffMins = Math.floor((Date.now() - new Date(createdAtISO).getTime()) / (1000 * 60))
  if (diffMins >= 15) return { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-600 dark:text-red-400 font-bold' }
  if (diffMins >= 8) return { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-600 dark:text-amber-400 font-semibold' }
  return { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-600 dark:text-emerald-400' }
}

export function KitchenDisplayClient({ initialOrders }: KitchenDisplayClientProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders)
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'PREPARING' | 'READY'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  // KDS Settings & Sound Preferences (persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('qrd_kds_sound') !== 'false'
    }
    return true
  })

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [, setTick] = useState(0) // Tick to re-render elapsed timers

  const router = useRouter()

  // Highlighted Order IDs set for 3-second visual pulse
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<Set<string>>(new Set())

  // Tracker for known order IDs to strictly prevent duplicate sounds on reload/refetch/reconnect
  const knownOrderIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id))
  )

  // Web Audio Context reference for zero-latency kitchen chime
  const audioContextRef = useRef<AudioContext | null>(null)

  const { on } = useOwnerSocket()

  // Initialize or resume Web Audio Context on first user interaction
  const initOrResumeAudio = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass()
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
    } catch (err) {
      console.error('[KDS Audio] Error initializing audio context:', err)
    }
  }, [])

  // Unlock audio on any pointer/click interaction on page
  useEffect(() => {
    const handleUserInteraction = () => {
      initOrResumeAudio()
    }
    window.addEventListener('pointerdown', handleUserInteraction, { once: true })
    window.addEventListener('click', handleUserInteraction, { once: true })
    return () => {
      window.removeEventListener('pointerdown', handleUserInteraction)
      window.removeEventListener('click', handleUserInteraction)
    }
  }, [initOrResumeAudio])

  // Play kitchen notification sound (short, crisp 0.8s dual-tone bell chime)
  const playNewOrderChime = useCallback(() => {
    if (!soundEnabled) return
    try {
      initOrResumeAudio()
      const ctx = audioContextRef.current
      if (!ctx) return

      const now = ctx.currentTime

      // Tone 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(659.25, now)
      gain1.gain.setValueAtTime(0.3, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.5)

      // Tone 2: A5 (880.00 Hz) - staggered 0.15s later
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(880.00, now + 0.15)
      gain2.gain.setValueAtTime(0.35, now + 0.15)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.15)
      osc2.stop(now + 0.75)
    } catch (err) {
      console.error('[KDS Audio] Play chime error:', err)
    }
  }, [soundEnabled, initOrResumeAudio])

  // Toggle sound enabled setting
  const toggleSound = () => {
    const nextState = !soundEnabled
    setSoundEnabled(nextState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('qrd_kds_sound', nextState ? 'true' : 'false')
    }
    if (nextState) {
      // Play brief test chime on enable
      playNewOrderChime()
    }
  }

  // Re-calculate elapsed time every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  // Fetch updated kitchen orders from API
  const fetchKitchenOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/kitchen/orders')
      const data = await res.json()
      if (data.success && data.orders) {
        setOrders(data.orders)
        // Sync known order IDs without triggering sound
        data.orders.forEach((o: KitchenOrder) => {
          knownOrderIdsRef.current.add(o.id)
        })
      }
    } catch (e) {
      console.error('[KitchenDisplayClient] Error fetching orders:', e)
    }
  }, [])

  // Real-time socket event handlers with duplicate prevention
  useEffect(() => {
    // 1. Brand new order arrived
    const unsubNew = on(ORDER_EVENTS.NEW, (payload: any) => {
      const orderId = payload?.orderId || payload?.id

      // Strictly check duplicate prevention:
      // If we already know about this order, DO NOT play sound or highlight
      if (orderId && knownOrderIdsRef.current.has(orderId)) {
        fetchKitchenOrders()
        return
      }

      if (orderId) {
        knownOrderIdsRef.current.add(orderId)

        // Highlight card briefly for 3 seconds
        setHighlightedOrderIds((prev) => new Set(prev).add(orderId))
        setTimeout(() => {
          setHighlightedOrderIds((prev) => {
            const next = new Set(prev)
            next.delete(orderId)
            return next
          })
        }, 3000)
      }

      // Play sound ONLY for genuine new orders
      playNewOrderChime()
      fetchKitchenOrders()
    })

    // 2. Existing order status updated (No sound, just update board)
    const unsubStatus = on(ORDER_EVENTS.STATUS_UPDATED, () => {
      fetchKitchenOrders()
    })

    return () => {
      unsubNew()
      unsubStatus()
    }
  }, [on, fetchKitchenOrders, playNewOrderChime])

  // Advance Order Status Action
  const handleAction = async (orderId: string, action: 'START_PREPARING' | 'MARK_READY' | 'MARK_SERVED') => {
    setUpdatingOrderId(orderId)
    try {
      const res = await fetch(`/api/owner/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchKitchenOrders()
      } else {
        alert(data.message || 'Failed to update order status')
      }
    } catch (err) {
      alert('Network error')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        searchQuery === '' ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.tableNumber.toString().includes(searchQuery)

      if (!matchesSearch) return false

      if (filter === 'NEW') return o.status === 'PLACED' || o.status === 'ACCEPTED'
      if (filter === 'PREPARING') return o.status === 'PREPARING'
      if (filter === 'READY') return o.status === 'READY'
      return true
    })
  }, [orders, filter, searchQuery])

  // Column grouping
  const newOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'PLACED' || o.status === 'ACCEPTED'),
    [filteredOrders]
  )
  const preparingOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'PREPARING'),
    [filteredOrders]
  )
  const readyOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'READY'),
    [filteredOrders]
  )

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)] bg-zinc-950 text-zinc-100 rounded-2xl p-4 sm:p-6 shadow-2xl border border-zinc-800">
      {/* Top KDS Control Bar */}
      <div className="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Kitchen Display System (KDS)
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </h1>
            <p className="text-xs text-zinc-400">
              Live Order Queue • {orders.length} Active Orders
            </p>
          </div>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Table or Order #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-4 py-2 text-xs font-medium text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            {(['ALL', 'NEW', 'PREPARING', 'READY'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  filter === f
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {f === 'ALL' ? 'ALL' : f === 'NEW' ? `NEW (${newOrders.length})` : f === 'PREPARING' ? `PREP (${preparingOrders.length})` : `READY (${readyOrders.length})`}
              </button>
            ))}
          </div>

          {/* Sound Notification Toggle Button */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
              soundEnabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            }`}
            title={soundEnabled ? 'Disable Sound Notifications' : 'Enable Sound Notifications'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span>Sound ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-zinc-500" />
                <span>Sound OFF</span>
              </>
            )}
          </button>

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* Close KDS — back to dashboard */}
          <button
            onClick={() => router.push('/dashboard/overview')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
            title="Exit Kitchen Display"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid flex-1 gap-6 md:grid-cols-3">
        {/* COLUMN 1: NEW ORDERS */}
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                NEW ORDERS
              </h2>
            </div>
            <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-400 border border-blue-500/30">
              {newOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {newOrders.length === 0 ? (
              <EmptyColumnState message="No new orders" />
            ) : (
              newOrders.map((order) => (
                <KdsCard
                  key={order.id}
                  order={order}
                  isHighlighted={highlightedOrderIds.has(order.id)}
                  updatingOrderId={updatingOrderId}
                  onAction={() => handleAction(order.id, 'START_PREPARING')}
                  actionLabel="Start Preparing"
                  actionColor="bg-amber-500 hover:bg-amber-600 text-zinc-950"
                  icon={Flame}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: PREPARING */}
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                PREPARING
              </h2>
            </div>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-400 border border-amber-500/30">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <EmptyColumnState message="No orders in preparation" />
            ) : (
              preparingOrders.map((order) => (
                <KdsCard
                  key={order.id}
                  order={order}
                  isHighlighted={highlightedOrderIds.has(order.id)}
                  updatingOrderId={updatingOrderId}
                  onAction={() => handleAction(order.id, 'MARK_READY')}
                  actionLabel="Mark Ready"
                  actionColor="bg-emerald-500 hover:bg-emerald-600 text-zinc-950"
                  icon={CheckCircle2}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: READY */}
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="mb-4 flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                READY FOR SERVING
              </h2>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400 border border-emerald-500/30">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {readyOrders.length === 0 ? (
              <EmptyColumnState message="No ready orders" />
            ) : (
              readyOrders.map((order) => (
                <KdsCard
                  key={order.id}
                  order={order}
                  isHighlighted={highlightedOrderIds.has(order.id)}
                  updatingOrderId={updatingOrderId}
                  onAction={() => handleAction(order.id, 'MARK_SERVED')}
                  actionLabel="Mark Served"
                  actionColor="bg-zinc-700 hover:bg-zinc-600 text-white"
                  icon={ArrowRight}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyColumnState({ message }: { message: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 p-4 text-center">
      <Utensils className="mb-2 h-8 w-8 text-zinc-700" />
      <p className="text-xs font-medium text-zinc-500">{message}</p>
    </div>
  )
}

interface KdsCardProps {
  order: KitchenOrder
  isHighlighted?: boolean
  updatingOrderId: string | null
  onAction: () => void
  actionLabel: string
  actionColor: string
  icon: React.ComponentType<{ className?: string }>
}

function KdsCard({
  order,
  isHighlighted = false,
  updatingOrderId,
  onAction,
  actionLabel,
  actionColor,
  icon: Icon,
}: KdsCardProps) {
  const isUpdating = updatingOrderId === order.id
  const severity = getElapsedSeverity(order.createdAt)

  return (
    <div
      className={`overflow-hidden rounded-xl p-4 shadow-md transition-all duration-300 ${
        isHighlighted
          ? 'border-2 border-amber-400 bg-amber-500/10 ring-4 ring-amber-500/20 shadow-amber-500/30 animate-pulse'
          : 'border border-zinc-800 bg-zinc-900 hover:border-zinc-700'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-tight text-white font-mono">
              #{order.orderNumber}
            </span>
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
              Table {order.tableNumber}
            </span>
            {isHighlighted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase text-zinc-950 shadow">
                <Sparkles className="h-3 w-3" /> NEW
              </span>
            )}
          </div>
        </div>

        {/* Elapsed Time Badge */}
        <div
          className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${severity.bg} ${severity.text}`}
        >
          <Clock className="h-3 w-3" />
          <span>{getElapsedTime(order.createdAt)}</span>
        </div>
      </div>

      {/* Item List */}
      <div className="py-3">
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 min-w-[24px] items-center justify-center rounded-md bg-amber-500/20 px-1 text-xs font-black text-amber-400 font-mono">
                  {item.quantity}x
                </span>
                <span className="font-semibold text-zinc-100">{item.itemName}</span>
              </div>
              {item.isVeg !== undefined && (
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.isVeg ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Footer */}
      <div className="mt-2 border-t border-zinc-800/80 pt-3">
        <button
          onClick={onAction}
          disabled={isUpdating}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${actionColor}`}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Icon className="h-4 w-4" />
              {actionLabel}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
