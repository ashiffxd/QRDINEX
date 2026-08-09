import prisma from '@/lib/prisma'
import { MenuItemStatus } from '@prisma/client'

export interface CustomerMenuItem {
  id: string
  categoryId: string
  itemName: string
  description: string | null
  price: number // converted from Decimal for client consumption
  imageUrl: string | null
  status: MenuItemStatus
  prepTimeMinutes: number | null
  isVeg: boolean
  displayOrder: number
}

export interface CustomerMenuCategory {
  id: string
  name: string
  displayOrder: number
  items: CustomerMenuItem[]
}

/**
 * Fetches the active menu for a specific restaurant.
 * Includes only active categories and active/out-of-stock items.
 * Empty categories (those with 0 valid items) are filtered out.
 */
export async function getCustomerMenu(restaurantId: string): Promise<CustomerMenuCategory[]> {
  const categories = await prisma.menuCategory.findMany({
    where: {
      restaurantId,
      isActive: true,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' },
    ],
    include: {
      menuItems: {
        where: {
          status: {
            not: MenuItemStatus.INACTIVE,
          },
        },
        orderBy: [
          { displayOrder: 'asc' },
          { itemName: 'asc' },
        ],
      },
    },
  })

  // Transform and filter empty categories
  return categories
    .filter((cat) => cat.menuItems.length > 0)
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      displayOrder: cat.displayOrder,
      items: cat.menuItems.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        itemName: item.itemName,
        description: item.description,
        price: Number(item.price), // Decimal to JS Number
        imageUrl: item.imageUrl,
        status: item.status,
        prepTimeMinutes: item.prepTimeMinutes,
        isVeg: item.isVeg,
        displayOrder: item.displayOrder,
      })),
    }))
}
