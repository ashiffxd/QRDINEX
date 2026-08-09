/**
 * QRDineX — Login Zod Schema
 * ==========================================================================
 * Validation schema for the login form.
 * Used by:
 *  - React Hook Form (client-side real-time validation + type inference)
 *  - API Route Handler (server-side re-validation — always re-validate)
 *
 * Intentionally minimal — only email and password.
 * No role selector on the form: role is determined from the DB record.
 * ==========================================================================
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// LOGIN SCHEMA
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z
    .string({ message: 'Email address is required.' })
    .trim()
    .toLowerCase()
    .min(1, 'Email address is required.')
    .email('Please enter a valid email address.'),

  password: z
    .string({ message: 'Password is required.' })
    .min(1, 'Password is required.'),
})

// ---------------------------------------------------------------------------
// INFERRED TYPES
// ---------------------------------------------------------------------------

/** Full form values — used by React Hook Form */
export type LoginFormValues = z.infer<typeof loginSchema>

/** Input to the service layer — same shape as form values */
export type LoginInput = z.infer<typeof loginSchema>
