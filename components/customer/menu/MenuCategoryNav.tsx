'use client'

import { CustomerMenuCategory } from '@/services/customer/menu.service'

interface MenuCategoryNavProps {
  categories: CustomerMenuCategory[]
  activeCategoryId: string
  onSelectCategory: (id: string) => void
}

export function MenuCategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
}: MenuCategoryNavProps) {
  if (!categories || categories.length === 0) return null

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:mx-0 sm:px-0">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
