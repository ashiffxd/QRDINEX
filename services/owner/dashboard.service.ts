import prisma from '@/lib/prisma'

export interface DashboardActivity {
  id: string
  type: 'SESSION' | 'ORDER' | 'WAITER_CALL'
  title: string
  desc: string
  createdAt: string
  tableNumber: number
}

export interface OwnerDashboardStats {
  activeSessions: number
  openTables: number
  totalTables: number
  totalMenuItems: number
  totalQrCodes: number
  pendingOrders: number
  activities: DashboardActivity[]
}

/**
 * Fetches the 10 most recent logs of session, order status updates, and waiter calls mapped to a unified activity interface.
 */
export async function getRecentActivities(restaurantId: string): Promise<DashboardActivity[]> {
  const [sessionLogs, orderLogs, waiterCalls] = await Promise.all([
    prisma.diningSessionStatusLog.findMany({
      where: {
        session: {
          restaurantId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        session: {
          select: {
            table: {
              select: {
                tableNumber: true,
              },
            },
          },
        },
      },
    }),
    prisma.orderStatusLog.findMany({
      where: {
        order: {
          restaurantId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        order: {
          select: {
            id: true,
            session: {
              select: {
                table: {
                  select: {
                    tableNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.waiterCall.findMany({
      where: {
        session: {
          restaurantId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        session: {
          select: {
            table: {
              select: {
                tableNumber: true,
              },
            },
          },
        },
      },
    }),
  ])

  const activities: DashboardActivity[] = []

  // Map Session status changes
  sessionLogs.forEach((log) => {
    let title = 'Session Status Updated'
    const status = log.newStatus
    const tableNum = log.session.table.tableNumber

    if (status === 'PENDING') {
      title = `Table ${tableNum} scanned QR`
    } else if (status === 'OPEN') {
      title = `Table ${tableNum} dining started`
    } else if (status === 'BILL_REQUESTED') {
      title = `Table ${tableNum} requested bill`
    } else if (status === 'INVOICE_GENERATED') {
      title = `Table ${tableNum} invoice generated`
    } else if (status === 'COMPLETED') {
      title = `Table ${tableNum} invoice paid`
    } else if (status === 'CLOSED') {
      title = `Table ${tableNum} session closed`
    }

    activities.push({
      id: log.id,
      type: 'SESSION',
      title,
      desc: log.remarks || `Status changed from ${log.oldStatus} to ${log.newStatus}`,
      createdAt: log.createdAt.toISOString(),
      tableNumber: tableNum,
    })
  })

  // Map Order status changes
  orderLogs.forEach((log) => {
    const tableNum = log.order.session.table.tableNumber
    const orderNum = log.order.id.split('-')[0].toUpperCase()
    let title = `Order #${orderNum} status changed`
    const status = log.newStatus

    if (status === 'PLACED') {
      title = `New Order #${orderNum} placed`
    } else if (status === 'ACCEPTED') {
      title = `Order #${orderNum} accepted`
    } else if (status === 'PREPARING') {
      title = `Order #${orderNum} preparing`
    } else if (status === 'READY') {
      title = `Order #${orderNum} ready to serve`
    } else if (status === 'SERVED') {
      title = `Order #${orderNum} served`
    } else if (status === 'COMPLETED') {
      title = `Order #${orderNum} completed`
    } else if (status === 'CANCELLED') {
      title = `Order #${orderNum} cancelled`
    }

    activities.push({
      id: log.id,
      type: 'ORDER',
      title,
      desc: log.remarks || `Table ${tableNum} - Changed to ${log.newStatus} by ${log.changedBy}`,
      createdAt: log.createdAt.toISOString(),
      tableNumber: tableNum,
    })
  })

  // Map Waiter calls
  waiterCalls.forEach((call) => {
    let typeLabel = 'assistance'
    if (call.type === 'WATER') typeLabel = 'Water'
    if (call.type === 'TISSUE') typeLabel = 'Tissues'
    if (call.type === 'CLEANING') typeLabel = 'Table Cleaning'
    if (call.type === 'BILL') typeLabel = 'the Bill'

    activities.push({
      id: call.id,
      type: 'WAITER_CALL',
      title: `Table ${call.session.table.tableNumber} called Waiter`,
      desc: `Requested ${typeLabel} (${call.status})`,
      createdAt: call.createdAt.toISOString(),
      tableNumber: call.session.table.tableNumber,
    })
  })

  // Sort activities chronologically (descending) and return the top 10
  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
}

/**
 * Fetches high-level operational statistics for a specific restaurant.
 * Strictly scoped to `restaurantId` to ensure data isolation.
 */
export async function getDashboardStats(restaurantId: string): Promise<OwnerDashboardStats> {
  // Execute all queries in parallel to minimize database round trips
  const [
    activeSessions,
    openTables,
    totalTables,
    totalMenuItems,
    totalQrCodes,
    pendingOrders,
    activities,
  ] = await Promise.all([
    // Active Dining Sessions
    prisma.diningSession.count({
      where: {
        restaurantId,
        status: 'OPEN',
      },
    }),
    
    // Open Tables (Occupied)
    prisma.diningTable.count({
      where: {
        restaurantId,
        status: 'OCCUPIED',
      },
    }),

    // Total Dining Tables
    prisma.diningTable.count({
      where: {
        restaurantId,
      },
    }),

    // Total Menu Items
    prisma.menuItem.count({
      where: {
        category: {
          restaurantId,
        },
      },
    }),

    // Total QR Codes
    prisma.qrCode.count({
      where: {
        table: {
          restaurantId,
        },
      },
    }),

    // Pending Orders
    prisma.order.count({
      where: {
        restaurantId,
        status: 'PLACED',
      },
    }),

    // Recent Activities
    getRecentActivities(restaurantId),
  ])

  return {
    activeSessions,
    openTables,
    totalTables,
    totalMenuItems,
    totalQrCodes,
    pendingOrders,
    activities,
  }
}
