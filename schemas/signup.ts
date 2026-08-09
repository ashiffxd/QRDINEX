/**
 * QRDineX — Signup Zod Schema
 * ==========================================================================
 * Validation schema for the restaurant owner signup form.
 * Used by both:
 *  - React Hook Form (client-side validation + type inference)
 *  - The API Route Handler (server-side re-validation — never trust client)
 *
 * Rules:
 *  - All validation messages are user-friendly and specific.
 *  - Password rules match the constants in constants/auth.ts exactly.
 *  - confirmPassword is validated with .superRefine to give a field-level error.
 *  - Phone number accepts international formats (+XX XXXXXXXXXX).
 * ==========================================================================
 */

import { z } from 'zod'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '@/constants/auth'

// ---------------------------------------------------------------------------
// FIELD VALIDATORS (reusable, composable)
// ---------------------------------------------------------------------------

const fullNameSchema = z
  .string({ required_error: 'Full name is required.' })
  .trim()
  .min(2, 'Full name must be at least 2 characters.')
  .max(100, 'Full name must not exceed 100 characters.')

const restaurantNameSchema = z
  .string({ required_error: 'Restaurant name is required.' })
  .trim()
  .min(2, 'Restaurant name must be at least 2 characters.')
  .max(120, 'Restaurant name must not exceed 120 characters.')

const emailSchema = z
  .string({ required_error: 'Email address is required.' })
  .trim()
  .toLowerCase()
  .min(1, 'Email address is required.')
  .email('Please enter a valid email address.')
  .max(254, 'Email address is too long.')

const phoneSchema = z
  .string({ required_error: 'Phone number is required.' })
  .trim()
  .min(7, 'Phone number must be at least 7 digits.')
  .max(20, 'Phone number must not exceed 20 characters.')
  .regex(
    /^\+?[0-9\s\-().]{7,20}$/,
    'Please enter a valid phone number (digits, spaces, +, -, () allowed).',
  )

const addressSchema = z
  .string({ required_error: 'Restaurant address is required.' })
  .trim()
  .min(5, 'Address must be at least 5 characters.')
  .max(300, 'Address must not exceed 300 characters.')

const citySchema = z
  .string({ required_error: 'City is required.' })
  .trim()
  .min(2, 'City name must be at least 2 characters.')
  .max(100, 'City name must not exceed 100 characters.')

const passwordSchema = z
  .string({ required_error: 'Password is required.' })
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
  .string({ required_error: 'Please confirm your password.' })
  .min(1, 'Please confirm your password.')

// ---------------------------------------------------------------------------
// SIGNUP FORM SCHEMA
// ---------------------------------------------------------------------------

export const signupSchema = z
  .object({
    fullName: fullNameSchema,
    restaurantName: restaurantNameSchema,
    email: emailSchema,
    phoneNumber: phoneSchema,
    address: addressSchema,
    city: citySchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      })
    }
  })

// ---------------------------------------------------------------------------
// INFERRED TYPES
// ---------------------------------------------------------------------------

/** Full form values including confirmPassword — used by React Hook Form */
export type SignupFormValues = z.infer<typeof signupSchema>

/** Input to the service layer — confirmPassword stripped after validation */
export type SignupInput = Omit<SignupFormValues, 'confirmPassword'>

// ---------------------------------------------------------------------------
// SERVER-SIDE SCHEMA (no confirmPassword — API receives pre-validated input)
// ---------------------------------------------------------------------------

/**
 * Used for server-side validation in the API Route Handler.
 * confirmPassword is not sent to the server — it is only a client-side UX check.
 */
export const signupServerSchema = z.object({
  fullName: fullNameSchema,
  restaurantName: restaurantNameSchema,
  email: emailSchema,
  phoneNumber: phoneSchema,
  address: addressSchema,
  city: citySchema,
  password: passwordSchema,
})

export type SignupServerInput = z.infer<typeof signupServerSchema>
