import { z } from 'zod'
import { MenuItemStatus } from '@prisma/client'

export const CreateMenuItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  itemName: z.string().min(1, 'Item name is required').max(100, 'Name must not exceed 100 characters').trim(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  price: z.coerce.number().positive('Price must be greater than zero'),
  prepTimeMinutes: z.coerce.number().int().positive('Preparation time must be positive').optional().nullable(),
  isVeg: z.boolean().default(false),
  status: z.nativeEnum(MenuItemStatus).default('ACTIVE'),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
})

export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>

export const UpdateMenuItemSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID').optional(),
  itemName: z.string().min(1, 'Item name is required').max(100).trim().optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.coerce.number().positive().optional(),
  prepTimeMinutes: z.coerce.number().int().positive().optional().nullable(),
  isVeg: z.boolean().optional(),
  status: z.nativeEnum(MenuItemStatus).optional(),
  imageUrl: z.string().url().optional().nullable(),
})

export type UpdateMenuItemInput = z.infer<typeof UpdateMenuItemSchema>

export const UpdateMenuItemStatusSchema = z.object({
  status: z.nativeEnum(MenuItemStatus, {
    message: 'Status is required',
  }),
})

export type UpdateMenuItemStatusInput = z.infer<typeof UpdateMenuItemStatusSchema>

export const ReorderMenuItemsSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      displayOrder: z.number().int().min(0),
    })
  ).min(1, 'Must provide at least one item to reorder'),
})

export type ReorderMenuItemsInput = z.infer<typeof ReorderMenuItemsSchema>
