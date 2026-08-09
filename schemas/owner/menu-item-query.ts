import { z } from 'zod'
import { MenuItemStatus } from '@prisma/client'

export const MenuItemQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().uuid().optional(),
  status: z.nativeEnum(MenuItemStatus).optional(),
  isVeg: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['itemName', 'price', 'category', 'prepTimeMinutes', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type MenuItemQuery = z.infer<typeof MenuItemQuerySchema>
