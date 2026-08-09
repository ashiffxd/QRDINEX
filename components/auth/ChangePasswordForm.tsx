'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type ChangePasswordData = z.infer<typeof changePasswordSchema>

export function ChangePasswordForm() {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (data: ChangePasswordData) => {
    setGlobalError(null)
    setSuccessMsg(null)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change password')
      }

      setSuccessMsg(result.message)
      reset()
      
      // Wait briefly so user reads the success message, then redirect to login
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }

  if (successMsg) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900/30 dark:bg-green-900/20">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 dark:text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-green-900 dark:text-green-100">Password Changed</h3>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">{successMsg}</p>
        <p className="mt-4 text-xs text-green-600 dark:text-green-400 font-medium">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {globalError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p>{globalError}</p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Current Password</label>
        <input
          type="password"
          {...register('currentPassword')}
          className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {errors.currentPassword && <p className="text-xs text-destructive mt-1">{errors.currentPassword.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">New Password</label>
        <input
          type="password"
          {...register('newPassword')}
          className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {errors.newPassword && <p className="text-xs text-destructive mt-1">{errors.newPassword.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Confirm New Password</label>
        <input
          type="password"
          {...register('confirmPassword')}
          className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSubmitting ? 'Updating Password...' : 'Update Password'}
      </button>
    </form>
  )
}
