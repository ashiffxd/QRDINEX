/**
 * QRDineX — Admin Dashboard Database Queries
 * ==========================================================================
 * All Prisma queries used by the Super Admin dashboard.
 * Called exclusively from Server Components — never from client code.
 *
 * All functions return typed results with no raw DB errors exposed.
 * ==========================================================================
 */

import prisma from '@/lib/prisma'
import { RestaurantStatus } from '@prisma/client'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalRestaurants: number
  pendingRestaurants: number
  activeRestaurants: number
  inactiveRestaurants: number
}

export interface RecentRestaurant {
  id: string
  restaurantName: string
  restaurantCode: string
  city: string
  status: string
  createdAt: Date
  owner: {
    fullName: string
    email: string
  }
}

export interface PendingRestaurant {
  id: string
  restaurantName: string
  restaurantCode: string
  city: string
  createdAt: Date
  owner: {
    fullName: string
    email: string
    phoneNumber: string
  }
  verification: {
    submittedAt: Date
    approvalStatus: string
  } | null
}

// ---------------------------------------------------------------------------
// DASHBOARD STATS
// ---------------------------------------------------------------------------

/**
 * Fetches all dashboard stat counts in a single aggregation query.
 * Uses Promise.all for parallel execution — no sequential blocking.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [total, pending, active, inactive] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { status: RestaurantStatus.PENDING } }),
    prisma.restaurant.count({ where: { status: RestaurantStatus.ACTIVE } }),
    prisma.restaurant.count({ where: { status: RestaurantStatus.INACTIVE } }),
  ])

  return {
    totalRestaurants: total,
    pendingRestaurants: pending,
    activeRestaurants: active,
    inactiveRestaurants: inactive,
  }
}

// ---------------------------------------------------------------------------
// RECENT RESTAURANTS
// ---------------------------------------------------------------------------

/**
 * Fetches the 10 most recently registered restaurants.
 * Ordered by createdAt DESC — newest first.
 */
export async function getRecentRestaurants(
  limit = 10,
): Promise<RecentRestaurant[]> {
  const restaurants = await prisma.restaurant.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      restaurantName: true,
      restaurantCode: true,
      city: true,
      status: true,
      createdAt: true,
      owner: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  })

  return restaurants
}

// ---------------------------------------------------------------------------
// PENDING APPROVALS
// ---------------------------------------------------------------------------

/**
 * Fetches all restaurants with status = PENDING.
 * Includes owner contact details and verification submission date.
 * Ordered by createdAt ASC — oldest pending first (FIFO processing).
 */
export async function getPendingRestaurants(): Promise<PendingRestaurant[]> {
  const restaurants = await prisma.restaurant.findMany({
    where: { status: RestaurantStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      restaurantName: true,
      restaurantCode: true,
      city: true,
      createdAt: true,
      owner: {
        select: {
          fullName: true,
          email: true,
          phoneNumber: true,
        },
      },
      verification: {
        select: {
          submittedAt: true,
          approvalStatus: true,
        },
      },
    },
  })

  return restaurants
}

// ---------------------------------------------------------------------------
// GLOBAL QRDINEX SERVICE FEEDBACK
// ---------------------------------------------------------------------------
export async function getQrdinexFeedbackStats() {
  const feedbacks = await prisma.feedback.groupBy({
    by: ['qrdinexRating'],
    _count: {
      id: true
    }
  })

  const ratings: Record<string, number> = {
    BAD: 0,
    GOOD: 0,
    BEST: 0,
    EXCELLENT: 0
  }

  feedbacks.forEach((f) => {
    ratings[f.qrdinexRating] = f._count.id
  })

  return [
    { rating: 'BAD', label: 'Bad', count: ratings.BAD },
    { rating: 'GOOD', label: 'Good', count: ratings.GOOD },
    { rating: 'BEST', label: 'Best', count: ratings.BEST },
    { rating: 'EXCELLENT', label: 'Excellent', count: ratings.EXCELLENT }
  ]
}

