'use client'

import { useState, useMemo, useEffect } from 'react'
import { CustomerMenuCategory, CustomerMenuItem } from '@/services/customer/menu.service'
import { MenuCategoryNav } from './MenuCategoryNav'
import { MenuItemCard } from './MenuItemCard'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'

interface CustomerMenuClientProps {
  initialCategories: CustomerMenuCategory[]
}

type SortOption = 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'ALPHA'
type VegOption = 'ALL' | 'VEG' | 'NON_VEG'

export function CustomerMenuClient({ initialCategories }: CustomerMenuClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [vegFilter, setVegFilter] = useState<VegOption>('ALL')
  const [hideOutOfStock, setHideOutOfStock] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT')

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    initialCategories[0]?.id || ''
  )

  // ---------------------------------------------------------------------------
  // Filtering & Sorting Logic
  // ---------------------------------------------------------------------------
  const filteredCategories = useMemo(() => {
    let result = initialCategories.map((cat) => {
      // 1. Filter Items
      let filteredItems = cat.items.filter((item) => {
        // Search
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          if (!item.itemName.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) {
            return false
          }
        }
        // Veg/Non-Veg
        if (vegFilter === 'VEG' && !item.isVeg) return false
        if (vegFilter === 'NON_VEG' && item.isVeg) return false
        // Out of Stock
        if (hideOutOfStock && item.status === 'OUT_OF_STOCK') return false

        return true
      })

      // 2. Sort Items
      filteredItems.sort((a, b) => {
        switch (sortBy) {
          case 'PRICE_ASC':
            return a.price - b.price
          case 'PRICE_DESC':
            return b.price - a.price
          case 'ALPHA':
            return a.itemName.localeCompare(b.itemName)
          case 'DEFAULT':
          default:
            return a.displayOrder - b.displayOrder
        }
      })

      return { ...cat, items: filteredItems }
    })

    // 3. Filter empty categories
    return result.filter((cat) => cat.items.length > 0)
  }, [initialCategories, searchQuery, vegFilter, hideOutOfStock, sortBy])

  // ---------------------------------------------------------------------------
  // Scroll Spy (Intersection Observer)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting category header
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategoryId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px' }
    )

    filteredCategories.forEach((cat) => {
      const element = document.getElementById(cat.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [filteredCategories])

  const scrollToCategory = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      // Offset for sticky header and nav
      const y = element.getBoundingClientRect().top + window.scrollY - 180
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveCategoryId(id)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Filters & Search */}
      <div className="sticky top-0 z-30 mb-6 bg-background pt-4 pb-2">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full border border-border bg-muted/30 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Veg Toggle */}
          <div className="inline-flex rounded-full border border-border bg-muted/30 p-1">
            {(['ALL', 'VEG', 'NON_VEG'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setVegFilter(type)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  vegFilter === type
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {type === 'ALL' ? 'All' : type === 'VEG' ? 'Veg' : 'Non-Veg'}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-8 rounded-full border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="DEFAULT">Recommended</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
            <option value="ALPHA">Alphabetical</option>
          </select>

          {/* Out of stock toggle */}
          <button
            onClick={() => setHideOutOfStock(!hideOutOfStock)}
            className={`h-8 rounded-full border px-3 text-xs font-medium transition-colors ${
              hideOutOfStock
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            Available Only
          </button>
        </div>
      </div>

      <MenuCategoryNav
        categories={filteredCategories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={scrollToCategory}
      />

      {filteredCategories.length === 0 ? (
        <div className="mt-12 text-center text-muted-foreground">
          <p>No items found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {filteredCategories.map((cat) => (
            <div key={cat.id} id={cat.id} className="scroll-mt-[180px]">
              <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">
                {cat.name}
              </h2>
              <div className="grid gap-4">
                {cat.items.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
