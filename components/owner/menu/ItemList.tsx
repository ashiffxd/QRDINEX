'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { MoreHorizontal, Edit, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react'
import { EditItemDialog } from './ItemDialogs'

export function ItemList({ items, categories }: { items: any[]; categories: any[] }) {
  const router = useRouter()
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  
  // Dialog States
  const [editingItem, setEditingItem] = useState<any | null>(null)

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/owner/menu/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to update status. Please try again.')
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (isReordering) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    setIsReordering(true)
    
    // We only swap items if they belong to the SAME category
    const currentItem = items[index]
    const targetItem = direction === 'up' ? items[index - 1] : items[index + 1]

    if (currentItem.categoryId !== targetItem.categoryId) {
      alert('You can only reorder items within the same category.')
      setIsReordering(false)
      return
    }
    
    const updates = [
      { id: currentItem.id, displayOrder: targetItem.displayOrder },
      { id: targetItem.id, displayOrder: currentItem.displayOrder }
    ]

    try {
      const res = await fetch('/api/owner/menu/items/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      if (!res.ok) throw new Error('Failed to reorder')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to reorder items. Please try again.')
    } finally {
      setIsReordering(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No menu items found</h3>
        <p className="mt-1 text-sm text-muted-foreground">Adjust your filters or add a new item.</p>
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/40 relative">
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0 || isReordering || items[index - 1]?.categoryId !== item.categoryId}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === items.length - 1 || isReordering || items[index + 1]?.categoryId !== item.categoryId}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.itemName} className="h-10 w-10 rounded-md object-cover border border-border" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center border border-border">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{item.itemName}</p>
                        {item.prepTimeMinutes && <p className="text-xs text-muted-foreground">{item.prepTimeMinutes} mins</p>}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    {item.category.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-foreground">
                    ₹{Number(item.price).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        item.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50' :
                        item.status === 'OUT_OF_STOCK' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500 dark:border-yellow-800/50' :
                        'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700'
                      }`}
                    >
                      <option value="ACTIVE" className="text-black dark:text-white bg-background">ACTIVE</option>
                      <option value="OUT_OF_STOCK" className="text-black dark:text-white bg-background">OUT OF STOCK</option>
                      <option value="INACTIVE" className="text-black dark:text-white bg-background">INACTIVE</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {item.isVeg ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-500">
                        <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-500"></span> Veg
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-500">
                        <span className="h-2 w-2 rounded-full border border-red-600 dark:border-red-500"></span> Non-Veg
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right relative">
                    <button 
                      onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {/* Action Dropdown */}
                    {openDropdownId === item.id && (
                      <div className="absolute right-8 top-10 z-10 w-32 rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95">
                        <button
                          onClick={() => { setEditingItem(item); setOpenDropdownId(null) }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                          Edit Item
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

      <EditItemDialog 
        isOpen={!!editingItem} 
        onClose={() => setEditingItem(null)} 
        item={editingItem}
        categories={categories}
      />
    </>
  )
}
