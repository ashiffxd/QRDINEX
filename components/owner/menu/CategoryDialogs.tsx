'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateCategorySchema, CreateCategoryInput, UpdateCategorySchema, UpdateCategoryInput } from '@/schemas/owner/menu-category'
import { Loader2, X, AlertTriangle } from 'lucide-react'

// ---------------------------------------------------------------------------
// CREATE CATEGORY DIALOG
// ---------------------------------------------------------------------------
export function CreateCategoryDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
  })

  const onSubmit = async (data: CreateCategoryInput) => {
    setGlobalError(null)
    try {
      const res = await fetch('/api/owner/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to create category')
      
      reset()
      onClose()
      router.refresh()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (!isOpen) return null

  return (
    <DialogWrapper title="Create Menu Category" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {globalError && <ErrorAlert message={globalError} />}
        <div>
          <label className="text-sm font-medium text-foreground">Category Name</label>
          <input
            type="text"
            placeholder="e.g. Starters, Main Course, Desserts"
            {...register('name')}
            className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Category
          </button>
        </div>
      </form>
    </DialogWrapper>
  )
}

// ---------------------------------------------------------------------------
// EDIT CATEGORY DIALOG
// ---------------------------------------------------------------------------
export function EditCategoryDialog({ isOpen, onClose, category }: { isOpen: boolean; onClose: () => void; category: any }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UpdateCategoryInput>({
    resolver: zodResolver(UpdateCategorySchema),
    defaultValues: {
      name: category?.name,
    }
  })

  const onSubmit = async (data: UpdateCategoryInput) => {
    setGlobalError(null)
    try {
      const res = await fetch(`/api/owner/menu/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to update category')
      
      onClose()
      router.refresh()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (!isOpen || !category) return null

  return (
    <DialogWrapper title="Edit Category" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {globalError && <ErrorAlert message={globalError} />}
        <div>
          <label className="text-sm font-medium text-foreground">Category Name</label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </DialogWrapper>
  )
}

// ---------------------------------------------------------------------------
// STATUS TOGGLE DIALOG
// ---------------------------------------------------------------------------
export function StatusToggleDialog({ isOpen, onClose, category }: { isOpen: boolean; onClose: () => void; category: any }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !category) return null

  const targetStatus = !category.isActive
  
  const handleToggle = async () => {
    setGlobalError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/owner/menu/categories/${category.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: targetStatus }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to update status')
      
      onClose()
      router.refresh()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogWrapper title="Confirm Status Change" onClose={onClose}>
      <div className="space-y-4">
        {globalError && <ErrorAlert message={globalError} />}
        
        {targetStatus ? (
          <p className="text-sm text-muted-foreground">
            Are you sure you want to enable <strong className="text-foreground">{category.name}</strong>? 
            It will immediately become visible to customers again.
          </p>
        ) : (
          <div className="rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
            <h4 className="font-semibold mb-1">Disable Category?</h4>
            <p>
              Are you sure you want to disable <strong className="text-foreground">{category.name}</strong>? 
              It will be hidden from the customer menu immediately. Existing items in this category will not be deleted.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleToggle} disabled={isSubmitting} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground rounded-lg disabled:opacity-50 transition-colors ${targetStatus ? 'bg-primary hover:bg-primary/90' : 'bg-destructive hover:bg-destructive/90'}`}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {targetStatus ? 'Enable Category' : 'Disable Category'}
          </button>
        </div>
      </div>
    </DialogWrapper>
  )
}

// ---------------------------------------------------------------------------
// SHARED UTILS
// ---------------------------------------------------------------------------
function DialogWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg sm:my-8 animate-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}
