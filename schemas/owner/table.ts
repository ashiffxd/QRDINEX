import { z } from 'zod'
import { DiningTableStatus } from '@prisma/client'

export const CreateTableSchema = z.object({
  tableNumber: z.coerce
    .number()
    .int('Table number must be an integer')
    .positive('Table number must be greater than 0'),
  capacity: z.coerce
    .number()
    .int('Capacity must be an integer')
    .positive('Capacity must be greater than 0'),
})

export type CreateTableInput = z.infer<typeof CreateTableSchema>

export const UpdateTableSchema = z.object({
  tableNumber: z.coerce
    .number()
    .int('Table number must be an integer')
    .positive('Table number must be greater than 0')
    .optional(),
  capacity: z.coerce
    .number()
    .int('Capacity must be an integer')
    .positive('Capacity must be greater than 0')
    .optional(),
})

export type UpdateTableInput = z.infer<typeof UpdateTableSchema>

export const UpdateTableStatusSchema = z.object({
  status: z.enum([DiningTableStatus.AVAILABLE, DiningTableStatus.OUT_OF_SERVICE], {
    errorMap: () => ({ message: 'Status must be AVAILABLE or OUT_OF_SERVICE' }),
  }),
})

export type UpdateTableStatusInput = z.infer<typeof UpdateTableStatusSchema>
