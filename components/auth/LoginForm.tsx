'use client'

/**
 * QRDineX — Login Form Component
 * ==========================================================================
 * React Hook Form + Zod powered login form.
 * Handles credential submission, server error mapping, and post-login redirect.
 * ==========================================================================
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock } from 'lucide-react'
import { loginSchema, type LoginFormValues } from '@/schemas/login'
import { AuthErrorCode } from '@/types/auth'
import { REDIRECT } from '@/lib/auth/rbac'

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

interface LoginSuccessResponse {
  success: true
  user: {
    id: string
    fullName: string
    role: 'SUPER_ADMIN' | 'OWNER'
    restaurantId: string | null
  }
}

interface LoginErrorResponse {
  success: false
  code: string
  message: string
  errors?: Record<string, string[]>
}

type LoginApiResponse = LoginSuccessResponse | LoginErrorResponse

// ---------------------------------------------------------------------------
// Status-specific message map
// Maps server error codes to user-facing messages shown in the form banner.
// These are more descriptive than the generic INVALID_CREDENTIALS message.
// ---------------------------------------------------------------------------

const STATUS_MESSAGES: Partial<Record<string, string>> = {
  [AuthErrorCode.ACCOUNT_PENDING]:
    'Your restaurant is currently under verification. You will receive access once approved by the QRDineX administrator.',
  [AuthErrorCode.ACCOUNT_INACTIVE]:
    'Your account is currently inactive. Please contact QRDineX support.',
  [AuthErrorCode.ACCOUNT_REJECTED]:
    'Your registration request was rejected. Please contact QRDineX.',
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [statusCode, setStatusCode] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null)
    setStatusCode(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result: LoginApiResponse = await response.json()

      if (!result.success) {
        setStatusCode(result.code)
        setServerError(
          STATUS_MESSAGES[result.code] ?? result.message,
        )
        return
      }

      // Redirect based on role
      if (result.user.role === 'SUPER_ADMIN') {
        router.push(REDIRECT.ADMIN_HOME)
      } else {
        router.push(REDIRECT.OWNER_HOME)
      }
      router.refresh()
    } catch {
      setServerError('Unable to connect to the server. Please check your connection and try again.')
    }
  }

  // Determine banner variant based on error type
  const isStatusError =
    statusCode === AuthErrorCode.ACCOUNT_PENDING ||
    statusCode === AuthErrorCode.ACCOUNT_INACTIVE ||
    statusCode === AuthErrorCode.ACCOUNT_REJECTED

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Server error / status banner */}
      {serverError && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 ${
            isStatusError
              ? 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20'
              : 'border-destructive/30 bg-destructive/10'
          }`}
          role="alert"
        >
          <AlertCircle
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              isStatusError ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'
            }`}
          />
          <p
            className={`text-sm leading-relaxed ${
              isStatusError
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-destructive'
            }`}
          >
            {serverError}
          </p>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-sm font-medium text-foreground">
          Email Address
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Mail className="h-4 w-4" />
          </span>
          <input
            id="login-email"
            type="email"
            placeholder="you@restaurant.com"
            autoComplete="email"
            className={`h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              errors.email
                ? 'border-destructive focus:ring-destructive/40'
                : 'border-input hover:border-ring/60'
            }`}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p id="login-email-error" role="alert" className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          {/* Placeholder for future forgot-password link */}
          <span className="text-xs text-muted-foreground/60">Forgot password?</span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Lock className="h-4 w-4" />
          </span>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            className={`h-10 w-full rounded-lg border bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              errors.password
                ? 'border-destructive focus:ring-destructive/40'
                : 'border-input hover:border-ring/60'
            }`}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" role="alert" className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Sign up link */}
      <p className="text-center text-sm text-muted-foreground">
        New to QRDineX?{' '}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline"
        >
          Register your restaurant
        </Link>
      </p>
    </form>
  )
}
