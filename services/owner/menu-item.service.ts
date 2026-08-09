import prisma from '@/lib/prisma'
import { Prisma, MenuItemStatus } from '@prisma/client'
import { MenuItemQuery } from '@/schemas/owner/menu-item-query'
import { CreateMenuItemInput, UpdateMenuItemInput, ReorderMenuItemsInput } from '@/schemas/owner/menu-item'

type RawMenuItem = Awaited<ReturnType<typeof getMenuItemsQuery>>[number]
export type SerializedMenuItem = Omit<RawMenuItem, 'price'> & { price: number }

export interface PaginatedMenuItemsResult {
  data: SerializedMenuItem[]
  metadata: {
    currentPage: number
    totalPages: number
    totalRecords: number
    pageSize: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

async function getMenuItemsQuery(where: Prisma.MenuItemWhereInput, orderBy: Prisma.MenuItemOrderByWithRelationInput, skip: number, take: number) {
  return prisma.menuItem.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  })
}

export async function getPaginatedMenuItems(restaurantId: string, query: MenuItemQuery): Promise<PaginatedMenuItemsResult> {
  const { search, category, status, isVeg, page, limit, sortBy, sortOrder } = query
  const skip = (page - 1) * limit
  const take = limit

  const where: Prisma.MenuItemWhereInput = { restaurantId }
  
  if (search) {
    where.itemName = { contains: search, mode: 'insensitive' }
  }
  if (category) {
    where.categoryId = category
  }
  if (status) {
    where.status = status
  }
  if (isVeg !== undefined) {
    where.isVeg = isVeg
  }

  let orderBy: Prisma.MenuItemOrderByWithRelationInput = { createdAt: 'desc' }
  switch (sortBy) {
    case 'itemName':
      orderBy = { itemName: sortOrder }
      break
    case 'price':
      orderBy = { price: sortOrder }
      break
    case 'category':
      orderBy = { category: { name: sortOrder } }
      break
    case 'prepTimeMinutes':
      orderBy = { prepTimeMinutes: { sort: sortOrder, nulls: 'last' } }
      break
    case 'createdAt':
      orderBy = { createdAt: sortOrder }
      break
  }

  // If sorting by category is not selected but they are filtering by category, it's useful to sort by displayOrder
  if (category && sortBy === 'createdAt') {
    orderBy = { displayOrder: 'asc' }
  }

  const [totalRecords, rawData] = await Promise.all([
    prisma.menuItem.count({ where }),
    getMenuItemsQuery(where, orderBy, skip, take)
  ])

  // Serialize Prisma Decimal → plain number so items can safely cross the
  // Server Component → Client Component boundary without a stringify error.
  const data: SerializedMenuItem[] = rawData.map((item) => ({
    ...item,
    price: item.price.toNumber(),
  }))

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

export async function createMenuItem(restaurantId: string, data: CreateMenuItemInput) {
  // 1. Verify category exists and belongs to restaurant
  const category = await prisma.menuCategory.findUnique({
    where: { id: data.categoryId }
  })

  if (!category || category.restaurantId !== restaurantId) {
    return { success: false, code: 'NOT_FOUND', message: 'Category not found or does not belong to this restaurant.' }
  }

  // 2. Prevent duplicates (case-insensitive) inside the same category
  const existing = await prisma.menuItem.findFirst({
    where: {
      categoryId: data.categoryId,
      itemName: { equals: data.itemName, mode: 'insensitive' }
    }
  })

  if (existing) {
    return { success: false, code: 'DUPLICATE_NAME', message: `An item named "${existing.itemName}" already exists in this category.` }
  }

  // 3. Get max displayOrder for this category to append
  const maxOrder = await prisma.menuItem.findFirst({
    where: { categoryId: data.categoryId },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true }
  })

  const newOrder = maxOrder ? maxOrder.displayOrder + 1 : 0

  // 4. Create
  const item = await prisma.menuItem.create({
    data: {
      restaurantId,
      categoryId: data.categoryId,
      itemName: data.itemName,
      description: data.description,
      price: data.price,
      prepTimeMinutes: data.prepTimeMinutes,
      isVeg: data.isVeg,
      status: data.status,
      imageUrl: data.imageUrl,
      displayOrder: newOrder,
    },
    include: {
      category: { select: { name: true } }
    }
  })

  return { success: true, data: item }
}

export async function updateMenuItem(restaurantId: string, itemId: string, data: UpdateMenuItemInput) {
  const current = await prisma.menuItem.findUnique({
    where: { id: itemId }
  })

  if (!current || current.restaurantId !== restaurantId) {
    return { success: false, code: 'NOT_FOUND', message: 'Menu item not found.' }
  }

  // If changing category, verify new category
  if (data.categoryId && data.categoryId !== current.categoryId) {
    const newCategory = await prisma.menuCategory.findUnique({
      where: { id: data.categoryId }
    })
    if (!newCategory || newCategory.restaurantId !== restaurantId) {
      return { success: false, code: 'NOT_FOUND', message: 'Target category not found.' }
    }
  }

  const targetCategoryId = data.categoryId || current.categoryId

  // Check duplicates if changing name or category
  if ((data.itemName && data.itemName.toLowerCase() !== current.itemName.toLowerCase()) || 
      (data.categoryId && data.categoryId !== current.categoryId)) {
    
    const checkName = data.itemName || current.itemName
    
    const existing = await prisma.menuItem.findFirst({
      where: {
        categoryId: targetCategoryId,
        id: { not: itemId },
        itemName: { equals: checkName, mode: 'insensitive' }
      }
    })

    if (existing) {
      return { success: false, code: 'DUPLICATE_NAME', message: `An item named "${existing.itemName}" already exists in the target category.` }
    }
  }

  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      categoryId: data.categoryId,
      itemName: data.itemName,
      description: data.description,
      price: data.price,
      prepTimeMinutes: data.prepTimeMinutes,
      isVeg: data.isVeg,
      status: data.status,
      imageUrl: data.imageUrl,
    },
    include: {
      category: { select: { name: true } }
    }
  })

  return { success: true, data: updated }
}

export async function updateMenuItemStatus(restaurantId: string, itemId: string, status: MenuItemStatus) {
  const current = await prisma.menuItem.findUnique({
    where: { id: itemId }
  })

  if (!current || current.restaurantId !== restaurantId) {
    return { success: false, code: 'NOT_FOUND', message: 'Menu item not found.' }
  }

  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: { status }
  })

  return { success: true, data: updated }
}

export async function reorderMenuItems(restaurantId: string, data: ReorderMenuItemsInput) {
  const providedIds = data.updates.map(u => u.id)
  
  const existing = await prisma.menuItem.findMany({
    where: {
      id: { in: providedIds },
      restaurantId,
    },
    select: { id: true }
  })

  if (existing.length !== providedIds.length) {
    return { success: false, code: 'UNAUTHORIZED', message: 'One or more items do not belong to this restaurant.' }
  }

  try {
    await prisma.$transaction(
      data.updates.map((update) => 
        prisma.menuItem.update({
          where: { id: update.id },
          data: { displayOrder: update.displayOrder }
        })
      )
    )

    return { success: true, message: 'Items reordered successfully.' }
  } catch (error) {
    console.error('[Reorder Menu Items Error]', error)
    return { success: false, code: 'INTERNAL_ERROR', message: 'Failed to reorder items.' }
  }
}
