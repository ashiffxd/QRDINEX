import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must not exceed 50 characters')
    .trim(),
})

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>

export const UpdateCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must not exceed 50 characters')
    .trim()
    .optional(),
  displayOrder: z.number().int().min(0).optional(),
})

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>

export const UpdateCategoryStatusSchema = z.object({
  isActive: z.boolean({
    message: 'isActive is required',
  }),
})

export type UpdateCategoryStatusInput = z.infer<typeof UpdateCategoryStatusSchema>

export const ReorderCategoriesSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      displayOrder: z.number().int().min(0),
    })
  ).min(1, 'Must provide at least one category to reorder'),
})

export type ReorderCategoriesInput = z.infer<typeof ReorderCategoriesSchema>
