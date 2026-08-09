'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X, Filter } from 'lucide-react'

export function ItemFilters({ categories }: { categories: any[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [isVeg, setIsVeg] = useState(searchParams.get('isVeg') || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (search) params.set('search', search)
      else params.delete('search')

      if (category) params.set('category', category)
      else params.delete('category')

      if (status) params.set('status', status)
      else params.delete('status')

      if (isVeg) params.set('isVeg', isVeg)
      else params.delete('isVeg')

      if ((searchParams.get('search') !== search || 
           searchParams.get('category') !== category || 
           searchParams.get('status') !== status || 
           searchParams.get('isVeg') !== isVeg) && 
          searchParams.has('page')) {
         params.set('page', '1')
      }

      router.push(`${pathname}?${params.toString()}`)
    }, 400)
    
    return () => clearTimeout(timer)
  }, [search, category, status, isVeg, pathname, router, searchParams])

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
      <div className="relative flex-1 md:max-w-xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <select
          value={isVeg}
          onChange={(e) => setIsVeg(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Types</option>
          <option value="true">Veg</option>
          <option value="false">Non-Veg</option>
        </select>
      </div>
    </div>
  )
}
