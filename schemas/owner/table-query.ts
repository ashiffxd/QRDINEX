import { z } from 'zod'
import { DiningTableStatus } from '@prisma/client'

export const TableSortFields = [
  'tableNumber',
  'capacity',
  'status',
  'createdAt',
] as const

export const TableQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(DiningTableStatus).optional(),
  
  sortBy: z.enum(TableSortFields).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().refine((val) => [10, 25, 50].includes(val), {
    message: 'Limit must be one of: 10, 25, 50',
  }).optional().default(10),
})

export type TableQueryInput = z.input<typeof TableQuerySchema>
export type TableQuery = z.infer<typeof TableQuerySchema>
