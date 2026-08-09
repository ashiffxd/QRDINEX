'use client'

/**
 * QRDineX — Change Password Form Component
 * ==========================================================================
 * React Hook Form + Zod powered password change form.
 * Calls POST /api/auth/change-password, then redirects to /login on success.
 * ==========================================================================
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { changePasswordSchema, type ChangePasswordFormValues } from '@/schemas/change-password'

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

interface ChangePasswordSuccessResponse {
  success: true
  message: string
}

interface ChangePasswordErrorResponse {
  success: false
  code: string
  message: string
  errors?: Record<string, string[]>
}

type ChangePasswordApiResponse =
  | ChangePasswordSuccessResponse
  | ChangePasswordErrorResponse

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function ChangePasswordForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setServerError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          // confirmPassword not sent to server
        }),
      })

      const result: ChangePasswordApiResponse = await response.json()

      if (!result.success) {
        // Map specific codes to field-level errors
        if (result.code === 'INCORRECT_CURRENT_PASSWORD') {
          setError('currentPassword', {
            type: 'server',
            message: result.message,
          })
          return
        }
        if (result.code === 'PASSWORD_SAME_AS_CURRENT') {
          setError('newPassword', {
            type: 'server',
            message: result.message,
          })
          return
        }
        // Server Zod validation errors
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            setError(field as keyof ChangePasswordFormValues, {
              type: 'server',
              message: messages[0] ?? 'Invalid value.',
            })
          })
          return
        }
        setServerError(result.message)
        return
      }

      // Success — show message briefly then redirect to login
      setSuccessMessage(result.message)
      reset()

      setTimeout(() => {
        router.push('/login')
      }, 2500)
    } catch {
      setServerError(
        'Unable to connect to the server. Please check your connection and try again.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Success banner */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800/50 dark:bg-green-900/20">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Password updated
            </p>
            <p className="text-xs text-green-700 dark:text-green-400">
              {successMessage} Redirecting to login…
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* Current Password */}
      <PasswordField
        id="currentPassword"
        label="Current Password"
        placeholder="Enter your current password"
        autoComplete="current-password"
        show={showCurrent}
        onToggle={() => setShowCurrent((p) => !p)}
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />

      {/* New Password */}
      <PasswordField
        id="newPassword"
        label="New Password"
        placeholder="Create a new strong password"
        autoComplete="new-password"
        show={showNew}
        onToggle={() => setShowNew((p) => !p)}
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />

      {/* Confirm New Password */}
      <PasswordField
        id="confirmPassword"
        label="Confirm New Password"
        placeholder="Repeat your new password"
        autoComplete="new-password"
        show={showConfirm}
        onToggle={() => setShowConfirm((p) => !p)}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {/* Password hint */}
      <p className="text-xs text-muted-foreground">
        Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !!successMessage}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating password…
          </>
        ) : (
          'Update Password'
        )}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// PASSWORD FIELD SUB-COMPONENT
// ---------------------------------------------------------------------------

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  show: boolean
  onToggle: () => void
}

function PasswordField({ id, label, error, show, onToggle, ...props }: PasswordFieldProps) {
  return (
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
            error
              ? 'border-destructive focus:ring-destructive/40'
              : 'border-input hover:border-ring/60'
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
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1 text-xs text-destructive"
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
