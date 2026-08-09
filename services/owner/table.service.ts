import prisma from '@/lib/prisma'
import { Prisma, DiningTableStatus } from '@prisma/client'
import { TableQuery } from '@/schemas/owner/table-query'
import { CreateTableInput, UpdateTableInput, UpdateTableStatusInput } from '@/schemas/owner/table'

export interface PaginatedTablesResult {
  data: Awaited<ReturnType<typeof getTablesQuery>>
  metadata: {
    currentPage: number
    totalPages: number
    totalRecords: number
    pageSize: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

async function getTablesQuery(where: Prisma.DiningTableWhereInput, orderBy: Prisma.DiningTableOrderByWithRelationInput, skip: number, take: number) {
  return prisma.diningTable.findMany({
    where,
    orderBy,
    skip,
    take,
    select: {
      id: true,
      tableNumber: true,
      capacity: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      qrCodes: {
        where: { isActive: true },
        select: { id: true }
      }
    },
  })
}

export async function getPaginatedTables(restaurantId: string, query: TableQuery): Promise<PaginatedTablesResult> {
  const { search, status, sortBy, sortOrder, page, limit } = query

  // 1. Build WHERE clause — Strictly scoped to restaurantId
  const where: Prisma.DiningTableWhereInput = {
    restaurantId,
  }

  if (status) {
    where.status = status
  }

  if (search) {
    // Check if search is a valid number, if so, search by exact table number
    const searchNum = parseInt(search, 10)
    if (!isNaN(searchNum)) {
      where.tableNumber = searchNum
    }
  }

  // 2. Build ORDER BY clause
  const orderBy: Prisma.DiningTableOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  // 3. Calculate Pagination
  const skip = (page - 1) * limit
  const take = limit

  // 4. Execute Queries efficiently (parallel)
  const [totalRecords, data] = await Promise.all([
    prisma.diningTable.count({ where }),
    getTablesQuery(where, orderBy, skip, take)
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

export async function createTable(restaurantId: string, data: CreateTableInput) {
  // Check for duplicate table number within the same restaurant
  const existingTable = await prisma.diningTable.findUnique({
    where: {
      unique_table_per_restaurant: {
        restaurantId,
        tableNumber: data.tableNumber,
      }
    }
  })

  if (existingTable) {
    return { success: false, code: 'DUPLICATE_TABLE_NUMBER', message: `Table number ${data.tableNumber} already exists in this restaurant.` }
  }

  const table = await prisma.diningTable.create({
    data: {
      restaurantId,
      tableNumber: data.tableNumber,
      capacity: data.capacity,
      status: DiningTableStatus.AVAILABLE,
    }
  })

  return { success: true, data: table }
}

export async function updateTable(restaurantId: string, tableId: string, data: UpdateTableInput) {
  // Verify ownership
  const currentTable = await prisma.diningTable.findUnique({
    where: { id: tableId }
  })

  if (!currentTable || currentTable.restaurantId !== restaurantId) {
    return { success: false, code: 'NOT_FOUND', message: 'Table not found.' }
  }

  // If changing table number, check for duplicates
  if (data.tableNumber !== undefined && data.tableNumber !== currentTable.tableNumber) {
    const existingTable = await prisma.diningTable.findUnique({
      where: {
        unique_table_per_restaurant: {
          restaurantId,
          tableNumber: data.tableNumber,
        }
      }
    })

    if (existingTable) {
      return { success: false, code: 'DUPLICATE_TABLE_NUMBER', message: `Table number ${data.tableNumber} already exists in this restaurant.` }
    }
  }

  const updatedTable = await prisma.diningTable.update({
    where: { id: tableId },
    data: {
      tableNumber: data.tableNumber,
      capacity: data.capacity,
    }
  })

  return { success: true, data: updatedTable }
}

export async function updateTableStatus(restaurantId: string, tableId: string, data: UpdateTableStatusInput) {
  // Verify ownership
  const currentTable = await prisma.diningTable.findUnique({
    where: { id: tableId }
  })

  if (!currentTable || currentTable.restaurantId !== restaurantId) {
    return { success: false, code: 'NOT_FOUND', message: 'Table not found.' }
  }

  // Prevent manual transition to or from OCCUPIED
  if (currentTable.status === DiningTableStatus.OCCUPIED) {
    return { success: false, code: 'INVALID_STATUS_TRANSITION', message: 'Cannot manually change status of an occupied table. The dining session must be ended first.' }
  }

  if (data.status === DiningTableStatus.OCCUPIED) {
    return { success: false, code: 'INVALID_STATUS_TRANSITION', message: 'Cannot manually set status to OCCUPIED. This is controlled by dining sessions.' }
  }

  const updatedTable = await prisma.diningTable.update({
    where: { id: tableId },
    data: {
      status: data.status,
    }
  })

  return { success: true, data: updatedTable }
}
