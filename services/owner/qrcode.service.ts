import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import QRCode from 'qrcode'
import { TableQuery } from '@/schemas/owner/table-query'

export interface PaginatedQrTablesResult {
  data: Awaited<ReturnType<typeof getQrTablesQuery>>
  metadata: {
    currentPage: number
    totalPages: number
    totalRecords: number
    pageSize: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

async function getQrTablesQuery(where: Prisma.DiningTableWhereInput, skip: number, take: number) {
  // We sort tables by their tableNumber for logical ordering by default.
  return prisma.diningTable.findMany({
    where,
    orderBy: { tableNumber: 'asc' },
    skip,
    take,
    select: {
      id: true,
      tableNumber: true,
      capacity: true,
      status: true,
      qrCodes: {
        where: { isActive: true },
        select: {
          id: true,
          token: true,
          createdAt: true,
        },
        take: 1,
      },
    },
  })
}

/**
 * Gets paginated tables with their active QR codes.
 */
export async function getPaginatedTableQRs(restaurantId: string, query: TableQuery): Promise<PaginatedQrTablesResult> {
  const { search, page, limit } = query
  const skip = (page - 1) * limit
  const take = limit

  const where: Prisma.DiningTableWhereInput = { restaurantId }
  
  if (search) {
    const searchNum = parseInt(search, 10)
    if (!isNaN(searchNum)) {
      where.tableNumber = searchNum
    }
  }

  const [totalRecords, data] = await Promise.all([
    prisma.diningTable.count({ where }),
    getQrTablesQuery(where, skip, take)
  ])

  const totalPages = Math.ceil(totalRecords / limit)

  return {
    data,
    metadata: {
      currentPage: page,
      totalPages,
      totalRecords,
      pageSize: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  }
}

/**
 * Gets the historical QR codes generated for a table.
 */
export async function getQrHistory(restaurantId: string, tableId: string) {
  // First verify the table belongs to the owner
  const table = await prisma.diningTable.findUnique({
    where: { id: tableId }
  })

  if (!table || table.restaurantId !== restaurantId) {
    return { success: false, code: 'NOT_FOUND', message: 'Table not found' }
  }

  const history = await prisma.qrCode.findMany({
    where: { tableId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      token: true,
      isActive: true,
      createdAt: true,
    }
  })

  return { success: true, data: history }
}

/**
 * Generates a new cryptographically secure QR code for a table.
 * Deactivates any existing QR code inside a transaction.
 */
export async function generateQrCode(restaurantId: string, tableId: string) {
  // 1. Verify ownership
  const table = await prisma.diningTable.findUnique({
    where: { id: tableId }
  })

  if (!table || table.restaurantId !== restaurantId) {
    return { success: false, code: 'NOT_FOUND', message: 'Table not found' }
  }

  // 2. Generate secure token
  // Using nanoid(10) gives ~62^10 entropy, extremely safe for short URLs.
  // We check for uniqueness just in case.
  let token = nanoid(10)
  let isUnique = false
  while (!isUnique) {
    const existing = await prisma.qrCode.findUnique({ where: { token } })
    if (!existing) {
      isUnique = true
    } else {
      token = nanoid(10)
    }
  }

  // 3. Prisma Transaction
  try {
    const newQr = await prisma.$transaction(async (tx) => {
      // Deactivate existing
      await tx.qrCode.updateMany({
        where: {
          tableId,
          isActive: true,
        },
        data: {
          isActive: false,
        }
      })

      // Create new
      return await tx.qrCode.create({
        data: {
          tableId,
          token,
          isActive: true,
        },
        select: {
          id: true,
          token: true,
          createdAt: true,
        }
      })
    })

    return { success: true, data: newQr }
  } catch (error) {
    console.error('[QR Generation Error]', error)
    return { success: false, code: 'INTERNAL_ERROR', message: 'Failed to generate QR code' }
  }
}

/**
 * Helper: Validates ownership of a specific QR code by ID.
 * Returns the QR code if valid, null otherwise.
 */
export async function getQrCodeForDownload(restaurantId: string, qrId: string) {
  return prisma.qrCode.findFirst({
    where: {
      id: qrId,
      table: {
        restaurantId,
      }
    },
    select: {
      token: true,
      table: {
        select: { tableNumber: true }
      }
    }
  })
}

/**
 * Generates a high-quality PNG buffer of the QR code.
 */
export async function generateQrImageBuffer(token: string): Promise<Buffer> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/s/${token}`
  
  return new Promise((resolve, reject) => {
    QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 1024,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }, (err, buffer) => {
      if (err) reject(err)
      else resolve(buffer)
    })
  })
}
