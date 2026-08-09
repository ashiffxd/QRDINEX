'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X, Filter } from 'lucide-react'
import { RestaurantStatus } from '@prisma/client'

export function RestaurantListFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState<string>(searchParams.get('status') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (search) {
        params.set('search', search)
      } else {
        params.delete('search')
      }

      // Reset page to 1 on new search
      if (searchParams.get('search') !== search && searchParams.has('page')) {
         params.set('page', '1')
      }

      router.push(`${pathname}?${params.toString()}`)
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [search, pathname, router, searchParams])

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setStatus(val)
    
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set('status', val)
    } else {
      params.delete('status')
    }
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCity(val)
  }

  const applyCityFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (city) {
      params.set('city', city)
    } else {
      params.delete('city')
    }
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') applyCityFilter()
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus('')
    setCity('')
    router.push(pathname) // clears all search parameters
  }

  const hasActiveFilters = search || status || city || searchParams.toString().length > 0

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code, city, owner..."
          className="block w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <select
          value={status}
          onChange={handleStatusChange}
          className="rounded-lg border border-input bg-background py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All Statuses</option>
          {Object.values(RestaurantStatus).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={city}
            onChange={handleCityChange}
            onKeyDown={handleCityKeyDown}
            placeholder="Filter by City"
            className="w-32 rounded-lg border border-input bg-background py-2 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={applyCityFilter}
            className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Apply
          </button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Filter className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
