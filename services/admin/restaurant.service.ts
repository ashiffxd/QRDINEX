/**
 * QRDineX — Restaurant Service (Admin)
 * ==========================================================================
 * Data fetching service for the Super Admin restaurant management pages.
 * ==========================================================================
 */

import prisma from '@/lib/prisma'
import { RestaurantStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// GET ALL RESTAURANTS
// ---------------------------------------------------------------------------

export async function getAllRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      restaurantCode: true,
      restaurantName: true,
      city: true,
      status: true,
      createdAt: true,
      owner: {
        select: {
          fullName: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// GET RESTAURANT DETAILS
// ---------------------------------------------------------------------------

export async function getRestaurantDetails(restaurantId: string) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      restaurantCode: true,
      restaurantName: true,
      address: true,
      city: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      logoUrl: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
        },
      },
      verification: {
        select: {
          id: true,
          approvalStatus: true,
          submittedAt: true,
          contactedAt: true,
          verifiedAt: true,
          remarks: true,
          verifiedByAdmin: {
            select: { fullName: true }
          }
        },
      },
      statusLogs: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          oldStatus: true,
          newStatus: true,
          reason: true,
          createdAt: true,
          changedByAdmin: {
            select: { fullName: true }
          }
        },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// GET RESTAURANT STATS
// ---------------------------------------------------------------------------

export interface RestaurantStats {
  totalTables: number
  totalQrCodes: number
  totalMenuCategories: number
  totalMenuItems: number
  totalSessions: number
  totalOrders: number
}

export async function getRestaurantStats(restaurantId: string): Promise<RestaurantStats> {
  const [
    totalTables,
    totalQrCodes,
    totalMenuCategories,
    totalMenuItems,
    totalSessions,
    totalOrders,
  ] = await Promise.all([
    prisma.diningTable.count({ where: { restaurantId } }),
    prisma.qrCode.count({ where: { table: { restaurantId } } }),
    prisma.menuCategory.count({ where: { restaurantId } }),
    prisma.menuItem.count({ where: { restaurantId } }),
    prisma.diningSession.count({ where: { restaurantId } }),
    prisma.order.count({ where: { restaurantId } }),
  ])

  return {
    totalTables,
    totalQrCodes,
    totalMenuCategories,
    totalMenuItems,
    totalSessions,
    totalOrders,
  }
}

// ---------------------------------------------------------------------------
// GET PAGINATED RESTAURANTS (SEARCH, FILTER, SORT)
// ---------------------------------------------------------------------------

import { RestaurantQuery } from '@/schemas/admin/restaurant-query'
import { Prisma } from '@prisma/client'

export interface PaginatedRestaurantsResult {
  data: Awaited<ReturnType<typeof getPaginatedRestaurantsQuery>>
  metadata: {
    currentPage: number
    totalPages: number
    totalRecords: number
    pageSize: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

async function getPaginatedRestaurantsQuery(where: Prisma.RestaurantWhereInput, orderBy: Prisma.RestaurantOrderByWithRelationInput, skip: number, take: number) {
  return prisma.restaurant.findMany({
    where,
    orderBy,
    skip,
    take,
    select: {
      id: true,
      restaurantCode: true,
      restaurantName: true,
      city: true,
      status: true,
      createdAt: true,
      owner: {
        select: {
          fullName: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  })
}

export async function getPaginatedRestaurants(query: RestaurantQuery): Promise<PaginatedRestaurantsResult> {
  const { search, status, city, sortBy, sortOrder, page, limit } = query

  // 1. Build WHERE clause
  const where: Prisma.RestaurantWhereInput = {}

  if (status) {
    where.status = status
  }

  if (city) {
    where.city = { contains: city, mode: 'insensitive' }
  }

  if (search) {
    where.OR = [
      { restaurantName: { contains: search, mode: 'insensitive' } },
      { restaurantCode: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
      {
        owner: {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ]
  }

  // 2. Build ORDER BY clause
  const orderBy: Prisma.RestaurantOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  // 3. Calculate Pagination
  const skip = (page - 1) * limit
  const take = limit

  // 4. Execute Queries efficiently (parallel)
  const [totalRecords, data] = await Promise.all([
    prisma.restaurant.count({ where }),
    getPaginatedRestaurantsQuery(where, orderBy, skip, take)
  ])

  // 5. Calculate Metadata
  const totalPages = Math.ceil(totalRecords / limit)
  const hasNextPage = page < totalPages
  const hasPreviousPage = page > 1

  return {
    data,
    metadata: {
      currentPage: page,
      totalPages,
      totalRecords,
      pageSize: limit,
      hasNextPage,
      hasPreviousPage,
    }
  }
}
