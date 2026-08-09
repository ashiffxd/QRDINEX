'use client'

/**
 * QRDineX — Signup Form Component
 * ==========================================================================
 * React Hook Form + Zod powered signup form for restaurant owner registration.
 * Manages all form state, validation, submission, and success/error display.
 * ==========================================================================
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Lock,
} from 'lucide-react'
import { signupSchema, type SignupFormValues } from '@/schemas/signup'

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

interface SignupSuccessResponse {
  success: true
  message: string
  restaurantCode: string
}

interface SignupErrorResponse {
  success: false
  code: string
  message: string
  field?: string
  errors?: Record<string, string[]>
}

type SignupApiResponse = SignupSuccessResponse | SignupErrorResponse

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successData, setSuccessData] = useState<SignupSuccessResponse | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  })

  // -------------------------------------------------------------------------
  // Form submission
  // -------------------------------------------------------------------------
  const onSubmit = async (data: SignupFormValues) => {
    setServerError(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName,
          restaurantName: data.restaurantName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          address: data.address,
          city: data.city,
          password: data.password,
          // confirmPassword is not sent — client-only validation
        }),
      })

      const result: SignupApiResponse = await response.json()

      if (!result.success) {
        // Field-level error from server (e.g. duplicate email)
        if (result.field) {
          setError(result.field as keyof SignupFormValues, {
            type: 'server',
            message: result.message,
          })
          return
        }

        // Multiple field-level errors from Zod server validation
        if ('errors' in result && result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            setError(field as keyof SignupFormValues, {
              type: 'server',
              message: messages[0] ?? 'Invalid value.',
            })
          })
          return
        }

        // Generic server error
        setServerError(result.message)
        return
      }

      setSuccessData(result)
    } catch {
      setServerError('Unable to connect to the server. Please check your connection and try again.')
    }
  }

  // -------------------------------------------------------------------------
  // Success State
  // -------------------------------------------------------------------------
  if (successData) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Registration Successful!</h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {successData.message}
          </p>
        </div>
        <div className="w-full rounded-xl border border-border bg-muted/40 p-4 text-left">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Your Restaurant Code</p>
          <p className="font-mono text-lg font-bold tracking-widest text-primary">
            {successData.restaurantCode}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep this code — you may need it for support queries.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Form State
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Server error banner */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* Row 1: Full Name + Restaurant Name */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="fullName"
          label="Full Name"
          placeholder="John Doe"
          icon={<User className="h-4 w-4" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Field
          id="restaurantName"
          label="Restaurant Name"
          placeholder="The Golden Fork"
          icon={<Building2 className="h-4 w-4" />}
          error={errors.restaurantName?.message}
          {...register('restaurantName')}
        />
      </div>

      {/* Row 2: Email + Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="email"
          label="Email Address"
          type="email"
          placeholder="john@restaurant.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Field
          id="phoneNumber"
          label="Phone Number"
          type="tel"
          placeholder="+1 555 000 0000"
          icon={<Phone className="h-4 w-4" />}
          error={errors.phoneNumber?.message}
          {...register('phoneNumber')}
        />
      </div>

      {/* Row 3: Address + City */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field
            id="address"
            label="Restaurant Address"
            placeholder="123 Main Street, Suite 4"
            icon={<MapPin className="h-4 w-4" />}
            error={errors.address?.message}
            {...register('address')}
          />
        </div>
        <Field
          id="city"
          label="City"
          placeholder="New York"
          icon={<Building2 className="h-4 w-4" />}
          error={errors.city?.message}
          {...register('city')}
        />
      </div>

      {/* Row 4: Password + Confirm Password */}
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          id="password"
          label="Password"
          placeholder="Create a strong password"
          show={showPassword}
          onToggle={() => setShowPassword((p) => !p)}
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm Password"
          placeholder="Repeat your password"
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((p) => !p)}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      {/* Password hint */}
      <p className="text-xs text-muted-foreground">
        Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registering your restaurant…
          </>
        ) : (
          'Register Restaurant'
        )}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  icon?: React.ReactNode
}

const Field = ({ id, label, error, icon, className, ...props }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
      )}
      <input
        id={id}
        className={`h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 ${
          icon ? 'pl-9' : 'pl-3'
        } ${error ? 'border-destructive focus:ring-destructive/40' : 'border-input hover:border-ring/60'} ${className ?? ''}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        {...props}
      />
    </div>
    {error && (
      <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
)

interface PasswordFieldProps extends Omit<FieldProps, 'type'> {
  show: boolean
  onToggle: () => void
}

const PasswordField = ({ id, label, error, show, onToggle, ...props }: PasswordFieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
    </label>
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Lock className="h-4 w-4" />
      </span>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className={`h-10 w-full rounded-lg border bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? 'border-destructive focus:ring-destructive/40' : 'border-input hover:border-ring/60'
        }`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
    {error && (
      <p id={`${id}-error`} role="alert" className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
)
