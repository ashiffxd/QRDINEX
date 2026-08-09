import { z } from 'zod'
import { RestaurantStatus } from '@prisma/client'

export const RestaurantSortFields = [
  'restaurantName',
  'restaurantCode',
  'city',
  'status',
  'createdAt',
  'updatedAt',
] as const

export const RestaurantQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(RestaurantStatus).optional(),
  city: z.string().optional(),
  
  sortBy: z.enum(RestaurantSortFields).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().refine((val) => [10, 25, 50].includes(val), {
    message: 'Limit must be one of: 10, 25, 50',
  }).optional().default(10),
})

export type RestaurantQueryInput = z.input<typeof RestaurantQuerySchema>
export type RestaurantQuery = z.infer<typeof RestaurantQuerySchema>
