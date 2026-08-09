'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ListOrdered, MoreHorizontal, Edit, PowerOff, Power, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react'
import { EditCategoryDialog, StatusToggleDialog } from './CategoryDialogs'

export function CategoryList({ categories }: { categories: any[] }) {
  const router = useRouter()
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  
  // Dialog States
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [togglingCategory, setTogglingCategory] = useState<any | null>(null)

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (isReordering) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return

    setIsReordering(true)
    
    // Create a local copy to swap and calculate new displayOrders
    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap elements
    const temp = newCategories[index]
    newCategories[index] = newCategories[targetIndex]
    newCategories[targetIndex] = temp

    // Reassign displayOrder sequentially based on new array order
    const updates = newCategories.map((cat, i) => ({
      id: cat.id,
      displayOrder: i
    }))

    try {
      const res = await fetch('/api/owner/menu/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      if (!res.ok) throw new Error('Failed to reorder')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to reorder categories. Please try again.')
    } finally {
      setIsReordering(false)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ListOrdered className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No menu categories</h3>
        <p className="mt-1 text-sm text-muted-foreground">Get started by creating categories for your menu.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm relative">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Category Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Updated</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((category, index) => (
                <tr key={category.id} className="transition-colors hover:bg-muted/40 relative">
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0 || isReordering}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === categories.length - 1 || isReordering}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-foreground">
                    {category.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {category.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:border-gray-800/50 dark:bg-gray-800/50 dark:text-gray-400">
                        <PowerOff className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    {format(new Date(category.updatedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right relative">
                    <button 
                      onClick={() => setOpenDropdownId(openDropdownId === category.id ? null : category.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {/* Action Dropdown */}
                    {openDropdownId === category.id && (
                      <div className="absolute right-8 top-10 z-10 w-48 rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95">
                        <button
                          onClick={() => { setEditingCategory(category); setOpenDropdownId(null) }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                          Edit Category
                        </button>
                        
                        <button
                          onClick={() => { setTogglingCategory(category); setOpenDropdownId(null) }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                        >
                          {category.isActive ? (
                            <><PowerOff className="h-4 w-4 text-destructive" /><span className="text-destructive">Disable Category</span></>
                          ) : (
                            <><Power className="h-4 w-4 text-green-500" /><span className="text-green-500">Enable Category</span></>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditCategoryDialog 
        isOpen={!!editingCategory} 
        onClose={() => setEditingCategory(null)} 
        category={editingCategory} 
      />
      <StatusToggleDialog 
        isOpen={!!togglingCategory} 
        onClose={() => setTogglingCategory(null)} 
        category={togglingCategory} 
      />
    </>
  )
}
