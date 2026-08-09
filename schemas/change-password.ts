/**
 * QRDineX — Change Password Zod Schema
 * ==========================================================================
 * Validation for the change-password form.
 * Used by:
 *  - React Hook Form (client-side real-time validation + type inference)
 *  - API Route Handler (server-side re-validation — always re-validate)
 *
 * Rules:
 *  - currentPassword: non-empty only (strength not re-checked — it's already stored)
 *  - newPassword: full strength requirements (mirrors signup schema)
 *  - confirmPassword: client-side only — must match newPassword
 * ==========================================================================
 */

import { z } from 'zod'
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@/constants/auth'

// ---------------------------------------------------------------------------
// FIELD SCHEMAS
// ---------------------------------------------------------------------------

const currentPasswordSchema = z
  .string({ required_error: 'Current password is required.' })
  .min(1, 'Current password is required.')

const newPasswordSchema = z
  .string({ required_error: 'New password is required.' })
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`,
  )
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.')

const confirmPasswordSchema = z
  .string({ required_error: 'Please confirm your new password.' })
  .min(1, 'Please confirm your new password.')

// ---------------------------------------------------------------------------
// CLIENT-SIDE SCHEMA (includes confirmPassword + match check)
// ---------------------------------------------------------------------------

export const changePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: newPasswordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      })
    }
    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New password must be different from your current password.',
        path: ['newPassword'],
      })
    }
  })

// ---------------------------------------------------------------------------
// SERVER-SIDE SCHEMA (no confirmPassword — verified by client before sending)
// ---------------------------------------------------------------------------

export const changePasswordServerSchema = z.object({
  currentPassword: currentPasswordSchema,
  newPassword: newPasswordSchema,
})

// ---------------------------------------------------------------------------
// INFERRED TYPES
// ---------------------------------------------------------------------------

/** Full form values — used by React Hook Form */
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

/** Input to the server and service layer */
export type ChangePasswordInput = z.infer<typeof changePasswordServerSchema>
