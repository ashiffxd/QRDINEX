import prisma from '@/lib/prisma'

export interface OwnerDashboardStats {
  activeSessions: number
  openTables: number
  totalTables: number
  totalMenuItems: number
  totalQrCodes: number
  pendingOrders: number
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
  ])

  return {
    activeSessions,
    openTables,
    totalTables,
    totalMenuItems,
    totalQrCodes,
    pendingOrders,
  }
}
