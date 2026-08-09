import prisma from '@/lib/prisma'
import { CreateCategoryInput, UpdateCategoryInput, ReorderCategoriesInput } from '@/schemas/owner/menu-category'

/**
 * Retrieves all menu categories for a restaurant.
 * No pagination needed as the list is used for reordering and typically < 50 items.
 */
export async function getCategories(restaurantId: string) {
  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      name: true,
      displayOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  return { success: true, data: categories }
}

/**
 * Creates a new category. Appends it to the bottom of the list.
 */
export async function createCategory(restaurantId: string, data: CreateCategoryInput) {
  // Check for case-insensitive duplicate name
  const existingCategory = await prisma.menuCategory.findFirst({
    where: {
      restaurantId,
      name: {
        equals: data.name,
        mode: 'insensitive',
      }
    }
  })

  if (existingCategory) {
    return { success: false, code: 'DUPLICATE_NAME', message: `A category named "${existingCategory.name}" already exists.` }
  }

  // Get max displayOrder to append to the end
  const maxOrderCategory = await prisma.menuCategory.findFirst({
    where: { restaurantId },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  })

  const newOrder = maxOrderCategory ? maxOrderCategory.displayOrder + 1 : 0

  const category = await prisma.menuCategory.create({
    data: {
      restaurantId,
      name: data.name,
      displayOrder: newOrder,
      isActive: true,
    }
  })

  return { success: true, data: category }
}

/**
 * Updates a category's name.
 */
export async function updateCategory(restaurantId: string, categoryId: string, data: UpdateCategoryInput) {
  const currentCategory = await prisma.menuCategory.findUnique({
    where: { id: categoryId }
  })

  if (!currentCategory || currentCategory.restaurantId !== restaurantId) {
    return { success: false, code: 'NOT_FOUND', message: 'Category not found.' }
  }

  if (data.name && data.name.toLowerCase() !== currentCategory.name.toLowerCase()) {
    const existingCategory = await prisma.menuCategory.findFirst({
      where: {
        restaurantId,
        name: {
          equals: data.name,
          mode: 'insensitive',
        }
      }
    })

    if (existingCategory) {
      return { success: false, code: 'DUPLICATE_NAME', message: `A category named "${existingCategory.name}" already exists.` }
    }
  }

  const updatedCategory = await prisma.menuCategory.update({
    where: { id: categoryId },
    data: {
      name: data.name,
    }
  })

  return { success: true, data: updatedCategory }
}

/**
 * Toggles a category's active status.
 */
export async function updateCategoryStatus(restaurantId: string, categoryId: string, isActive: boolean) {
  const currentCategory = await prisma.menuCategory.findUnique({
    where: { id: categoryId }
  })

  if (!currentCategory || currentCategory.restaurantId !== restaurantId) {
    return { success: false, code: 'NOT_FOUND', message: 'Category not found.' }
  }

  const updatedCategory = await prisma.menuCategory.update({
    where: { id: categoryId },
    data: { isActive },
  })

  return { success: true, data: updatedCategory }
}

/**
 * Reorders multiple categories using a Prisma Transaction.
 */
export async function reorderCategories(restaurantId: string, data: ReorderCategoriesInput) {
  // Security Check: Verify ALL provided IDs actually belong to this restaurant.
  const providedIds = data.updates.map(u => u.id)
  
  const existingCategories = await prisma.menuCategory.findMany({
    where: {
      id: { in: providedIds },
      restaurantId,
    },
    select: { id: true }
  })

  if (existingCategories.length !== providedIds.length) {
    return { success: false, code: 'UNAUTHORIZED', message: 'One or more categories do not belong to this restaurant.' }
  }

  try {
    // Execute multiple updates inside a single transaction
    await prisma.$transaction(
      data.updates.map((update) => 
        prisma.menuCategory.update({
          where: { id: update.id },
          data: { displayOrder: update.displayOrder }
        })
      )
    )

    return { success: true, message: 'Categories reordered successfully.' }
  } catch (error) {
    console.error('[Reorder Categories Error]', error)
    return { success: false, code: 'INTERNAL_ERROR', message: 'Failed to reorder categories.' }
  }
}
