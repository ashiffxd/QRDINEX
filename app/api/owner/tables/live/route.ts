/**
 * GET /api/owner/tables/live
 *
 * Retrieves all tables for the owner's restaurant, including active dining sessions,
 * pending requests, and participant/order counts for the Live Table Monitor.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import { SessionStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json(
      { success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { restaurantId } = sessionResult.data

  try {
    const tables = await prisma.diningTable.findMany({
      where: { restaurantId },
      orderBy: { tableNumber: 'asc' },
      include: {
        diningSessions: {
          where: {
            status: {
              in: [
                SessionStatus.PENDING,
                SessionStatus.OPEN,
                SessionStatus.BILL_REQUESTED,
                SessionStatus.INVOICE_GENERATED,
              ],
            },
          },
          include: {
            participants: {
              select: {
                id: true,
                deviceIdentifier: true,
                status: true,
                role: true,
                displayName: true,
              },
            },
            _count: {
              select: {
                orders: true,
              },
            },
          },
        },
      },
    })

    // Format the response to be easy to consume by the front-end Table Grid
    const formattedTables = tables.map((table) => {
      const activeSession = table.diningSessions[0] || null

      return {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
        activeSession: activeSession
          ? {
              id: activeSession.id,
              status: activeSession.status,
              ownerApproval: activeSession.ownerApproval,
              createdAt: activeSession.createdAt,
              ordersCount: activeSession._count.orders,
              participants: activeSession.participants,
            }
          : null,
      }
    })

    return NextResponse.json({ success: true, data: formattedTables })
  } catch (error) {
    console.error('[GET /api/owner/tables/live] Error:', error)
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'Failed to fetch live tables.' },
      { status: 500 }
    )
  }
}
