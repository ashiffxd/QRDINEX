'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateTableSchema, CreateTableInput, UpdateTableSchema, UpdateTableInput } from '@/schemas/owner/table'
import { DiningTableStatus } from '@prisma/client'
import { Loader2, X, AlertTriangle } from 'lucide-react'

// ---------------------------------------------------------------------------
// CREATE TABLE DIALOG
// ---------------------------------------------------------------------------
export function CreateTableDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateTableInput>({
    resolver: zodResolver(CreateTableSchema),
  })

  const onSubmit = async (data: CreateTableInput) => {
    setGlobalError(null)
    try {
      const res = await fetch('/api/owner/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to create table')
      
      reset()
      onClose()
      router.refresh()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (!isOpen) return null

  return (
    <DialogWrapper title="Create New Table" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {globalError && <ErrorAlert message={globalError} />}
        <div>
          <label className="text-sm font-medium text-foreground">Table Number</label>
          <input
            type="number"
            {...register('tableNumber')}
            className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50"
          />
          {errors.tableNumber && <p className="text-xs text-destructive mt-1">{errors.tableNumber.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Capacity (Guests)</label>
          <input
            type="number"
            {...register('capacity')}
            className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50"
          />
          {errors.capacity && <p className="text-xs text-destructive mt-1">{errors.capacity.message}</p>}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Table
          </button>
        </div>
      </form>
    </DialogWrapper>
  )
}

// ---------------------------------------------------------------------------
// EDIT TABLE DIALOG
// ---------------------------------------------------------------------------
export function EditTableDialog({ isOpen, onClose, table }: { isOpen: boolean; onClose: () => void; table: any }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UpdateTableInput>({
    resolver: zodResolver(UpdateTableSchema),
    defaultValues: {
      tableNumber: table?.tableNumber,
      capacity: table?.capacity,
    }
  })

  const onSubmit = async (data: UpdateTableInput) => {
    setGlobalError(null)
    try {
      const res = await fetch(`/api/owner/tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to update table')
      
      onClose()
      router.refresh()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (!isOpen || !table) return null

  return (
    <DialogWrapper title="Edit Table" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {globalError && <ErrorAlert message={globalError} />}
        <div>
          <label className="text-sm font-medium text-foreground">Table Number</label>
          <input
            type="number"
            {...register('tableNumber')}
            className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50"
          />
          {errors.tableNumber && <p className="text-xs text-destructive mt-1">{errors.tableNumber.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Capacity (Guests)</label>
          <input
            type="number"
            {...register('capacity')}
            className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50"
          />
          {errors.capacity && <p className="text-xs text-destructive mt-1">{errors.capacity.message}</p>}
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
export function StatusToggleDialog({ isOpen, onClose, table }: { isOpen: boolean; onClose: () => void; table: any }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !table) return null

  const targetStatus = table.status === DiningTableStatus.AVAILABLE ? DiningTableStatus.OUT_OF_SERVICE : DiningTableStatus.AVAILABLE
  
  const handleToggle = async () => {
    setGlobalError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/owner/tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
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
        <p className="text-sm text-muted-foreground">
          Are you sure you want to change Table {table.tableNumber} from 
          <span className="font-semibold text-foreground px-1">{table.status.replace('_', ' ')}</span> to 
          <span className="font-semibold text-foreground px-1">{targetStatus.replace('_', ' ')}</span>?
        </p>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleToggle} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm
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
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg sm:my-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
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
