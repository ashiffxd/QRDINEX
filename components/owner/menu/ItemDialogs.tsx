'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateMenuItemSchema, CreateMenuItemInput, UpdateMenuItemSchema, UpdateMenuItemInput } from '@/schemas/owner/menu-item'
import { Loader2, X, AlertTriangle } from 'lucide-react'
import { ImageUpload } from './ImageUpload'

// ---------------------------------------------------------------------------
// CREATE ITEM DIALOG
// ---------------------------------------------------------------------------
export function CreateItemDialog({ isOpen, onClose, categories }: { isOpen: boolean; onClose: () => void; categories: any[] }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateMenuItemInput>({
    resolver: zodResolver(CreateMenuItemSchema),
    defaultValues: {
      isVeg: false,
      status: 'ACTIVE',
    }
  })

  const imageUrl = watch('imageUrl')

  const onSubmit = async (data: CreateMenuItemInput) => {
    setGlobalError(null)
    try {
      const res = await fetch('/api/owner/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to create item')
      
      reset()
      onClose()
      router.refresh()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (!isOpen) return null

  return (
    <DialogWrapper title="Create Menu Item" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        {globalError && <ErrorAlert message={globalError} />}
        
        <div className="flex gap-4">
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Item Name *</label>
              <input type="text" {...register('itemName')} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
              {errors.itemName && <p className="text-xs text-destructive mt-1">{errors.itemName.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Category *</label>
              <select {...register('categoryId')} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>}
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Price *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input type="number" step="0.01" {...register('price')} className="w-full rounded-lg border border-input bg-background p-2.5 pl-7 text-sm focus:ring-2 focus:ring-primary/50" />
                </div>
                {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Prep Time (min)</label>
                <input type="number" {...register('prepTimeMinutes')} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Image</label>
            <ImageUpload value={imageUrl} onChange={(url) => setValue('imageUrl', url)} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea {...register('description')} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
            <input type="checkbox" {...register('isVeg')} className="rounded border-input text-green-600 focus:ring-green-600" />
            Vegetarian
          </label>
          
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mr-2">Status</label>
            <select {...register('status')} className="rounded-lg border border-input bg-background p-2 text-sm focus:ring-2 focus:ring-primary/50">
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Item
          </button>
        </div>
      </form>
    </DialogWrapper>
  )
}

// ---------------------------------------------------------------------------
// EDIT ITEM DIALOG
// ---------------------------------------------------------------------------
export function EditItemDialog({ isOpen, onClose, item, categories }: { isOpen: boolean; onClose: () => void; item: any; categories: any[] }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<UpdateMenuItemInput>({
    resolver: zodResolver(UpdateMenuItemSchema),
    defaultValues: {
      categoryId: item?.categoryId,
      itemName: item?.itemName,
      description: item?.description,
      price: item?.price,
      prepTimeMinutes: item?.prepTimeMinutes,
      isVeg: item?.isVeg,
      status: item?.status,
      imageUrl: item?.imageUrl,
    }
  })

  const imageUrl = watch('imageUrl')

  const onSubmit = async (data: UpdateMenuItemInput) => {
    setGlobalError(null)
    try {
      const res = await fetch(`/api/owner/menu/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to update item')
      
      onClose()
      router.refresh()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (!isOpen || !item) return null

  return (
    <DialogWrapper title="Edit Menu Item" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        {globalError && <ErrorAlert message={globalError} />}
        
        <div className="flex gap-4">
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Item Name *</label>
              <input type="text" {...register('itemName')} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
              {errors.itemName && <p className="text-xs text-destructive mt-1">{errors.itemName.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Category *</label>
              <select {...register('categoryId')} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Price *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <input type="number" step="0.01" {...register('price')} className="w-full rounded-lg border border-input bg-background p-2.5 pl-7 text-sm focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground">Prep Time (min)</label>
                <input type="number" {...register('prepTimeMinutes')} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Image</label>
            <ImageUpload value={imageUrl} onChange={(url) => setValue('imageUrl', url)} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea {...register('description')} rows={3} className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
            <input type="checkbox" {...register('isVeg')} className="rounded border-input text-green-600 focus:ring-green-600" />
            Vegetarian
          </label>
          
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mr-2">Status</label>
            <select {...register('status')} className="rounded-lg border border-input bg-background p-2 text-sm focus:ring-2 focus:ring-primary/50">
              <option value="ACTIVE">Active</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
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
// SHARED UTILS
// ---------------------------------------------------------------------------
function DialogWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-lg sm:my-8 animate-in zoom-in-95 duration-200">
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
    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-4">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}
