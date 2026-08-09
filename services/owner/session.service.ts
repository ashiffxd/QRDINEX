import prisma from '@/lib/prisma'
import { Prisma, SessionStatus, DiningTableStatus } from '@prisma/client'

export interface GetSessionsOptions {
  page?: number
  limit?: number
  status?: SessionStatus | 'ALL'
  tableNumber?: number
  sortBy?: 'startedAt' | 'duration' | 'tableNumber'
  sortOrder?: 'asc' | 'desc'
}

export async function getSessions(restaurantId: string, options: GetSessionsOptions) {
  const {
    page = 1,
    limit = 20,
    status = 'ALL',
    tableNumber,
    sortBy = 'startedAt',
    sortOrder = 'desc',
  } = options

  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.DiningSessionWhereInput = {
    restaurantId,
  }

  if (status !== 'ALL') {
    where.status = status as SessionStatus
  } else {
    // By default, ALL usually means 'don't filter by status'
  }

  if (tableNumber) {
    where.table = {
      tableNumber,
    }
  }

  // Build orderBy clause
  let orderBy: Prisma.DiningSessionOrderByWithRelationInput = {}
  
  if (sortBy === 'startedAt' || sortBy === 'duration') {
    orderBy = { startedAt: sortOrder }
  } else if (sortBy === 'tableNumber') {
    orderBy = {
      table: {
        tableNumber: sortOrder,
      },
    }
  } else {
    orderBy = { startedAt: 'desc' }
  }

  const [sessions, total] = await Promise.all([
    prisma.diningSession.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        table: {
          select: { tableNumber: true },
        },
        _count: {
          select: { orders: true },
        },
      },
    }),
    prisma.diningSession.count({ where }),
  ])

  // Map to frontend friendly format
  const formattedSessions = sessions.map((session) => ({
    id: session.id,
    shortId: session.id.split('-')[0].toUpperCase(),
    tableNumber: session.table.tableNumber,
    participantsCount: (session as any).participants?.length || 0,
    ordersCount: session._count.orders,
    status: session.status,
    startedAt: session.startedAt,
    // Calculate duration in minutes
    durationMins: session.startedAt
      ? Math.floor((new Date().getTime() - session.startedAt.getTime()) / 60000)
      : Math.floor((new Date().getTime() - session.createdAt.getTime()) / 60000),
  }))

  return {
    data: formattedSessions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getSessionDetails(restaurantId: string, sessionId: string) {
  const session = await prisma.diningSession.findFirst({
    where: {
      id: sessionId,
      restaurantId,
    },
    include: {
      table: {
        select: { tableNumber: true },
      },
      orders: {
        include: {
          orderItems: {
            include: {
              menuItem: {
                select: { itemName: true, isVeg: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      statusLogs: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!session) return null

  // Calculate totals
  const totalAmount = session.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)

  return {
    ...session,
    shortId: session.id.split('-')[0].toUpperCase(),
    totalAmount,
    participantsCount: (session as any).participants?.length || 0,
    orders: session.orders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      orderItems: order.orderItems.map(item => ({
        ...item,
        priceAtPurchase: Number(item.priceAtPurchase),
        subtotal: Number(item.subtotal),
      }))
    }))
  }
}

export async function completeSession(restaurantId: string, sessionId: string, changedBy: string) {
  return await prisma.$transaction(async (tx) => {
    const session = await tx.diningSession.findFirst({
      where: { id: sessionId, restaurantId },
      select: { id: true, status: true, tableId: true },
    })

    if (!session) {
      throw new Error('SESSION_NOT_FOUND')
    }

    if (session.status === 'CLOSED' || session.status === 'EXPIRED') {
      throw new Error('SESSION_ALREADY_COMPLETED')
    }

    // 1. Update session to CLOSED
    const updatedSession = await tx.diningSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED' },
    })

    // 2. Mark table as AVAILABLE
    await tx.diningTable.update({
      where: { id: session.tableId },
      data: { status: 'AVAILABLE' },
    })

    // 3. Create Status Log
    await tx.diningSessionStatusLog.create({
      data: {
        sessionId,
        oldStatus: session.status,
        newStatus: 'CLOSED',
        changedBy,
        remarks: 'Session completed by owner',
      },
    })

    return updatedSession
  })
}
