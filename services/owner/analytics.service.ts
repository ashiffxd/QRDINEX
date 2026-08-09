import prisma from '@/lib/prisma'
import { OrderStatus, PaymentStatus, SessionStatus } from '@prisma/client'

export interface DateFilterOptions {
  range?: 'today' | 'yesterday' | '7days' | '30days' | 'custom' | 'all'
  startDate?: string
  endDate?: string
}

export function getDateBounds(options: DateFilterOptions = {}): { gte?: Date; lte?: Date } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const range = options.range || '7days'

  if (range === 'today') {
    return { gte: todayStart, lte: todayEnd }
  }

  if (range === 'yesterday') {
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayEnd = new Date(todayEnd)
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)
    return { gte: yesterdayStart, lte: yesterdayEnd }
  }

  if (range === '7days') {
    const start7 = new Date(todayStart)
    start7.setDate(start7.getDate() - 6)
    return { gte: start7, lte: todayEnd }
  }

  if (range === '30days') {
    const start30 = new Date(todayStart)
    start30.setDate(start30.getDate() - 29)
    return { gte: start30, lte: todayEnd }
  }

  if (range === 'custom' && options.startDate && options.endDate) {
    return { gte: new Date(options.startDate), lte: new Date(options.endDate) }
  }

  if (range === 'all') {
    return {}
  }

  const startDefault = new Date(todayStart)
  startDefault.setDate(startDefault.getDate() - 6)
  return { gte: startDefault, lte: todayEnd }
}

// ---------------------------------------------------------------------------
// 1. OVERVIEW ANALYTICS
// ---------------------------------------------------------------------------
export async function getOverviewAnalytics(restaurantId: string, filterOptions: DateFilterOptions = {}) {
  const bounds = getDateBounds(filterOptions)

  const dateWhere = bounds.gte || bounds.lte ? { createdAt: { gte: bounds.gte, lte: bounds.lte } } : {}
  const paidInvoiceDateWhere = bounds.gte || bounds.lte ? { paidAt: { gte: bounds.gte, lte: bounds.lte } } : {}

  const [
    revenueAgg,
    totalOrdersCount,
    activeSessionsCount,
    completedSessionsCount,
    ordersAgg,
    sessions,
  ] = await Promise.all([
    // Revenue from PAID invoices only
    prisma.invoice.aggregate({
      where: {
        restaurantId,
        paymentStatus: PaymentStatus.PAID,
        ...paidInvoiceDateWhere,
      },
      _sum: { grandTotal: true },
      _count: { id: true },
    }),

    // Total Orders count
    prisma.order.count({
      where: {
        restaurantId,
        status: { not: OrderStatus.CANCELLED },
        ...dateWhere,
      },
    }),

    // Active Sessions count
    prisma.diningSession.count({
      where: {
        restaurantId,
        status: { in: [SessionStatus.OPEN, SessionStatus.BILL_REQUESTED, SessionStatus.INVOICE_GENERATED] },
      },
    }),

    // Completed Sessions count
    prisma.diningSession.count({
      where: {
        restaurantId,
        status: { in: [SessionStatus.COMPLETED, SessionStatus.CLOSED] },
        ...dateWhere,
      },
    }),

    // Total order amount for Average Order Value (AOV)
    prisma.order.aggregate({
      where: {
        restaurantId,
        status: { not: OrderStatus.CANCELLED },
        ...dateWhere,
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    // Completed sessions for Average Session Duration
    prisma.diningSession.findMany({
      where: {
        restaurantId,
        status: { in: [SessionStatus.COMPLETED, SessionStatus.CLOSED] },
        ...dateWhere,
      },
      select: {
        startedAt: true,
        updatedAt: true,
      },
      take: 100,
    }),
  ])

  const totalRevenue = Number(revenueAgg._sum.grandTotal || 0)
  const totalOrders = ordersAgg._count.id || 0
  const totalOrderSum = Number(ordersAgg._sum.totalAmount || 0)
  const averageOrderValue = totalOrders > 0 ? totalOrderSum / totalOrders : 0

  // Calculate average session duration in minutes
  let avgSessionDurationMins = 0
  if (sessions.length > 0) {
    const totalMins = sessions.reduce((acc, s) => {
      const start = new Date(s.startedAt).getTime()
      const end = new Date(s.updatedAt).getTime()
      return acc + Math.max(1, (end - start) / (1000 * 60))
    }, 0)
    avgSessionDurationMins = Math.round(totalMins / sessions.length)
  }

  return {
    totalRevenue,
    totalOrders: totalOrdersCount,
    activeSessions: activeSessionsCount,
    completedSessions: completedSessionsCount,
    averageOrderValue,
    avgSessionDurationMins,
  }
}

// ---------------------------------------------------------------------------
// 2. REVENUE ANALYTICS
// ---------------------------------------------------------------------------
export async function getRevenueAnalytics(restaurantId: string, filterOptions: DateFilterOptions = {}) {
  const bounds = getDateBounds(filterOptions)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const yesterdayEnd = new Date(todayEnd)
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)

  const start7 = new Date(todayStart)
  start7.setDate(start7.getDate() - 6)

  const start30 = new Date(todayStart)
  start30.setDate(start30.getDate() - 29)

  const [
    todayAgg,
    yesterdayAgg,
    last7Agg,
    last30Agg,
    totalAgg,
    paidInvoicesTrend,
  ] = await Promise.all([
    // Today
    prisma.invoice.aggregate({
      where: { restaurantId, paymentStatus: PaymentStatus.PAID, paidAt: { gte: todayStart, lte: todayEnd } },
      _sum: { grandTotal: true },
    }),
    // Yesterday
    prisma.invoice.aggregate({
      where: { restaurantId, paymentStatus: PaymentStatus.PAID, paidAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      _sum: { grandTotal: true },
    }),
    // Last 7 Days
    prisma.invoice.aggregate({
      where: { restaurantId, paymentStatus: PaymentStatus.PAID, paidAt: { gte: start7, lte: todayEnd } },
      _sum: { grandTotal: true },
    }),
    // Last 30 Days
    prisma.invoice.aggregate({
      where: { restaurantId, paymentStatus: PaymentStatus.PAID, paidAt: { gte: start30, lte: todayEnd } },
      _sum: { grandTotal: true },
    }),
    // All-time Total Revenue
    prisma.invoice.aggregate({
      where: { restaurantId, paymentStatus: PaymentStatus.PAID },
      _sum: { grandTotal: true },
    }),
    // Invoices for trend line within selected bounds
    prisma.invoice.findMany({
      where: {
        restaurantId,
        paymentStatus: PaymentStatus.PAID,
        ...(bounds.gte || bounds.lte ? { paidAt: { gte: bounds.gte, lte: bounds.lte } } : {}),
      },
      select: {
        grandTotal: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'asc' },
    }),
  ])

  // Group trend invoices by date string YYYY-MM-DD
  const trendMap: Record<string, number> = {}
  paidInvoicesTrend.forEach((inv) => {
    if (inv.paidAt) {
      const dateKey = new Date(inv.paidAt).toISOString().slice(0, 10)
      trendMap[dateKey] = (trendMap[dateKey] || 0) + Number(inv.grandTotal)
    }
  })

  const trendData = Object.entries(trendMap).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }))

  return {
    todayRevenue: Number(todayAgg._sum.grandTotal || 0),
    yesterdayRevenue: Number(yesterdayAgg._sum.grandTotal || 0),
    last7DaysRevenue: Number(last7Agg._sum.grandTotal || 0),
    last30DaysRevenue: Number(last30Agg._sum.grandTotal || 0),
    totalRevenue: Number(totalAgg._sum.grandTotal || 0),
    trendData,
  }
}

// ---------------------------------------------------------------------------
// 3. ORDER ANALYTICS
// ---------------------------------------------------------------------------
export async function getOrderAnalytics(restaurantId: string, filterOptions: DateFilterOptions = {}) {
  const bounds = getDateBounds(filterOptions)
  const dateWhere = bounds.gte || bounds.lte ? { createdAt: { gte: bounds.gte, lte: bounds.lte } } : {}

  const [statusGroup, totalAgg, ordersList] = await Promise.all([
    prisma.order.groupBy({
      by: ['status'],
      where: { restaurantId, ...dateWhere },
      _count: { id: true },
    }),
    prisma.order.aggregate({
      where: { restaurantId, status: { not: OrderStatus.CANCELLED }, ...dateWhere },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.order.findMany({
      where: { restaurantId, ...dateWhere },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const statusCounts: Record<string, number> = {
    TOTAL: 0,
    PLACED: 0,
    ACCEPTED: 0,
    PREPARING: 0,
    READY: 0,
    SERVED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  }

  statusGroup.forEach((g) => {
    statusCounts[g.status] = g._count.id
    statusCounts.TOTAL += g._count.id
  })

  const totalSum = Number(totalAgg._sum.totalAmount || 0)
  const validCount = totalAgg._count.id || 0
  const averageOrderValue = validCount > 0 ? totalSum / validCount : 0

  // Group trend by date
  const trendMap: Record<string, { total: number; completed: number }> = {}
  ordersList.forEach((o) => {
    const dateKey = new Date(o.createdAt).toISOString().slice(0, 10)
    if (!trendMap[dateKey]) trendMap[dateKey] = { total: 0, completed: 0 }
    trendMap[dateKey].total += 1
    if (o.status === 'COMPLETED' || o.status === 'SERVED') {
      trendMap[dateKey].completed += 1
    }
  })

  const trendData = Object.entries(trendMap).map(([date, counts]) => ({
    date,
    totalOrders: counts.total,
    completedOrders: counts.completed,
  }))

  return {
    totalOrders: statusCounts.TOTAL,
    completedOrders: (statusCounts.COMPLETED || 0) + (statusCounts.SERVED || 0),
    preparingOrders: statusCounts.PREPARING || 0,
    readyOrders: statusCounts.READY || 0,
    cancelledOrders: statusCounts.CANCELLED || 0,
    averageOrderValue,
    trendData,
  }
}

// ---------------------------------------------------------------------------
// 4. MENU ANALYTICS
// ---------------------------------------------------------------------------
export async function getMenuAnalytics(restaurantId: string, filterOptions: DateFilterOptions = {}) {
  const bounds = getDateBounds(filterOptions)
  const dateWhere = bounds.gte || bounds.lte ? { order: { createdAt: { gte: bounds.gte, lte: bounds.lte } } } : {}

  const orderItemsGroup = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    where: {
      order: {
        restaurantId,
        status: { not: OrderStatus.CANCELLED },
        ...dateWhere.order,
      },
    },
    _sum: {
      quantity: true,
      subtotal: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 15,
  })

  const menuItemIds = orderItemsGroup.map((g) => g.menuItemId)

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true, itemName: true, isVeg: true },
  })

  const itemMap = new Map(menuItems.map((m) => [m.id, m]))

  const topItems = orderItemsGroup.map((g) => {
    const item = itemMap.get(g.menuItemId)
    return {
      menuItemId: g.menuItemId,
      itemName: item?.itemName || 'Unknown Item',
      isVeg: item?.isVeg ?? true,
      quantitySold: g._sum.quantity || 0,
      totalRevenue: Number(g._sum.subtotal || 0),
    }
  })

  return { topItems }
}

// ---------------------------------------------------------------------------
// 5. TABLE ANALYTICS
// ---------------------------------------------------------------------------
export async function getTableAnalytics(restaurantId: string, filterOptions: DateFilterOptions = {}) {
  const bounds = getDateBounds(filterOptions)
  const dateWhere = bounds.gte || bounds.lte ? { createdAt: { gte: bounds.gte, lte: bounds.lte } } : {}

  const sessionsGroup = await prisma.diningSession.groupBy({
    by: ['tableId'],
    where: {
      restaurantId,
      ...dateWhere,
    },
    _count: { id: true },
    orderBy: {
      _count: { id: 'desc' },
    },
  })

  const tableIds = sessionsGroup.map((g) => g.tableId)

  const tables = await prisma.diningTable.findMany({
    where: { id: { in: tableIds } },
    select: { id: true, tableNumber: true },
  })

  const tableMap = new Map(tables.map((t) => [t.id, t.tableNumber]))

  // Fetch session durations per table
  const completedSessions = await prisma.diningSession.findMany({
    where: {
      restaurantId,
      status: { in: [SessionStatus.COMPLETED, SessionStatus.CLOSED] },
      ...dateWhere,
    },
    select: {
      tableId: true,
      startedAt: true,
      updatedAt: true,
    },
  })

  const durationMap: Record<string, number[]> = {}
  completedSessions.forEach((s) => {
    const mins = Math.max(1, (new Date(s.updatedAt).getTime() - new Date(s.startedAt).getTime()) / (1000 * 60))
    if (!durationMap[s.tableId]) durationMap[s.tableId] = []
    durationMap[s.tableId].push(mins)
  })

  const tableStats = sessionsGroup.map((g) => {
    const tableNum = tableMap.get(g.tableId) || 0
    const durations = durationMap[g.tableId] || []
    const avgDurationMins =
      durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

    return {
      tableId: g.tableId,
      tableNumber: tableNum,
      totalSessions: g._count.id,
      avgDurationMins,
    }
  })

  return { tableStats }
}

// ---------------------------------------------------------------------------
// 6. KITCHEN ANALYTICS
// ---------------------------------------------------------------------------
export async function getKitchenAnalytics(restaurantId: string, filterOptions: DateFilterOptions = {}) {
  const bounds = getDateBounds(filterOptions)
  const dateWhere = bounds.gte || bounds.lte ? { createdAt: { gte: bounds.gte, lte: bounds.lte } } : {}

  const prepLogs = await prisma.orderStatusLog.findMany({
    where: {
      order: {
        restaurantId,
        ...dateWhere,
      },
      newStatus: { in: [OrderStatus.PREPARING, OrderStatus.READY] },
    },
    select: {
      orderId: true,
      newStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group log timestamps by orderId
  const orderPrepTimes: Record<string, { preparingAt?: Date; readyAt?: Date }> = {}
  prepLogs.forEach((log) => {
    if (!orderPrepTimes[log.orderId]) orderPrepTimes[log.orderId] = {}
    if (log.newStatus === 'PREPARING') orderPrepTimes[log.orderId].preparingAt = log.createdAt
    if (log.newStatus === 'READY') orderPrepTimes[log.orderId].readyAt = log.createdAt
  })

  const prepDurationsMins: number[] = []
  Object.values(orderPrepTimes).forEach((times) => {
    if (times.preparingAt && times.readyAt) {
      const mins = (times.readyAt.getTime() - times.preparingAt.getTime()) / (1000 * 60)
      if (mins >= 0 && mins < 300) {
        prepDurationsMins.push(mins)
      }
    }
  })

  let avgPrepTimeMins = 0
  let fastestPrepTimeMins = 0
  let slowestPrepTimeMins = 0

  if (prepDurationsMins.length > 0) {
    const sum = prepDurationsMins.reduce((a, b) => a + b, 0)
    avgPrepTimeMins = Math.round((sum / prepDurationsMins.length) * 10) / 10
    fastestPrepTimeMins = Math.round(Math.min(...prepDurationsMins) * 10) / 10
    slowestPrepTimeMins = Math.round(Math.max(...prepDurationsMins) * 10) / 10
  }

  // Calculate average prepared per day
  const uniqueDays = new Set(prepLogs.map((l) => l.createdAt.toISOString().slice(0, 10)))
  const preparedCount = prepDurationsMins.length
  const avgPreparedPerDay = uniqueDays.size > 0 ? Math.round(preparedCount / uniqueDays.size) : preparedCount

  return {
    avgPrepTimeMins,
    fastestPrepTimeMins,
    slowestPrepTimeMins,
    avgPreparedPerDay,
    totalPreparedOrders: preparedCount,
  }
}

// ---------------------------------------------------------------------------
// 7. SESSION ANALYTICS
// ---------------------------------------------------------------------------
export async function getSessionAnalytics(restaurantId: string, filterOptions: DateFilterOptions = {}) {
  const bounds = getDateBounds(filterOptions)
  const dateWhere = bounds.gte || bounds.lte ? { createdAt: { gte: bounds.gte, lte: bounds.lte } } : {}

  const [sessionGroup, completedSessions] = await Promise.all([
    prisma.diningSession.groupBy({
      by: ['status'],
      where: { restaurantId, ...dateWhere },
      _count: { id: true },
    }),
    prisma.diningSession.findMany({
      where: {
        restaurantId,
        status: { in: [SessionStatus.COMPLETED, SessionStatus.CLOSED] },
        ...dateWhere,
      },
      select: {
        startedAt: true,
        updatedAt: true,
      },
    }),
  ])

  const statusCounts: Record<string, number> = {
    TOTAL: 0,
    OPEN: 0,
    BILL_REQUESTED: 0,
    INVOICE_GENERATED: 0,
    COMPLETED: 0,
    CLOSED: 0,
    EXPIRED: 0,
  }

  sessionGroup.forEach((g) => {
    statusCounts[g.status] = g._count.id
    statusCounts.TOTAL += g._count.id
  })

  let avgDiningDurationMins = 0
  if (completedSessions.length > 0) {
    const totalMins = completedSessions.reduce((acc, s) => {
      const start = new Date(s.startedAt).getTime()
      const end = new Date(s.updatedAt).getTime()
      return acc + Math.max(1, (end - start) / (1000 * 60))
    }, 0)
    avgDiningDurationMins = Math.round(totalMins / completedSessions.length)
  }

  return {
    totalSessions: statusCounts.TOTAL,
    activeSessions: (statusCounts.OPEN || 0) + (statusCounts.BILL_REQUESTED || 0) + (statusCounts.INVOICE_GENERATED || 0),
    completedSessions: (statusCounts.COMPLETED || 0) + (statusCounts.CLOSED || 0),
    expiredSessions: statusCounts.EXPIRED || 0,
    avgDiningDurationMins,
  }
}
