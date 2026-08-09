import prisma from '@/lib/prisma'
import { OrderStatus, Prisma } from '@prisma/client'

export interface GetOrdersOptions {
  page?: number
  limit?: number
  status?: OrderStatus | 'ALL'
  tableNumber?: number
  sortBy?: 'createdAt' | 'tableNumber' | 'totalAmount'
  sortOrder?: 'asc' | 'desc'
}

export async function getOrders(restaurantId: string, options: GetOrdersOptions) {
  const {
    page = 1,
    limit = 20,
    status = 'ALL',
    tableNumber,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options

  const skip = (page - 1) * limit

  // Build the where clause
  const where: Prisma.OrderWhereInput = {
    restaurantId,
  }

  if (status !== 'ALL') {
    where.status = status as OrderStatus
  }

  if (tableNumber) {
    where.session = {
      table: {
        tableNumber: tableNumber,
      },
    }
  }

  // Build the orderBy clause
  let orderBy: Prisma.OrderOrderByWithRelationInput = {}
  
  if (sortBy === 'createdAt') {
    orderBy = { createdAt: sortOrder }
  } else if (sortBy === 'totalAmount') {
    orderBy = { totalAmount: sortOrder }
  } else if (sortBy === 'tableNumber') {
    orderBy = {
      session: {
        table: {
          tableNumber: sortOrder,
        },
      },
    }
  } else {
    orderBy = { createdAt: 'desc' }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        session: {
          include: {
            table: {
              select: { tableNumber: true },
            },
          },
        },
        _count: {
          select: { orderItems: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ])

  // Map to a friendlier frontend format
  const formattedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.id.split('-')[0].toUpperCase(),
    tableNumber: order.session.table.tableNumber,
    itemsCount: order._count.orderItems,
    totalAmount: Number(order.totalAmount),
    status: order.status,
    createdAt: order.createdAt,
  }))

  return {
    data: formattedOrders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getOrderDetails(restaurantId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId,
    },
    include: {
      session: {
        include: {
          table: {
            select: { tableNumber: true },
          },
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              itemName: true,
              isVeg: true,
            },
          },
        },
      },
    },
  })

  if (!order) return null

  return {
    ...order,
    orderNumber: order.id.split('-')[0].toUpperCase(),
    totalAmount: Number(order.totalAmount),
    orderItems: order.orderItems.map(item => ({
      ...item,
      priceAtPurchase: Number(item.priceAtPurchase),
      subtotal: Number(item.subtotal),
    }))
  }
}

/**
 * Retrieves active kitchen orders (PLACED, ACCEPTED, PREPARING, READY)
 * sorted oldest first for the KDS Kanban display.
 */
export async function getKitchenOrders(restaurantId: string) {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: {
        in: [
          OrderStatus.PLACED,
          OrderStatus.ACCEPTED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ],
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      session: {
        select: {
          id: true,
          table: {
            select: {
              tableNumber: true,
            },
          },
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              itemName: true,
              isVeg: true,
            },
          },
        },
      },
    },
  })

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.id.split('-')[0].toUpperCase(),
    sessionId: order.sessionId,
    tableNumber: order.session.table.tableNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.orderItems.map((item) => ({
      id: item.id,
      itemName: item.menuItem.itemName,
      quantity: item.quantity,
      isVeg: item.menuItem.isVeg,
    })),
  }))
}
