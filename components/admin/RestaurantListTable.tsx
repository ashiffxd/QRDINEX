'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight, ArrowDown, ArrowUp, ArrowUpDown, Building2 } from 'lucide-react'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { PaginatedRestaurantsResult } from '@/services/admin/restaurant.service'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface RestaurantListTableProps {
  data: PaginatedRestaurantsResult['data']
  sortBy: string
  sortOrder: string
}

export function RestaurantListTable({ data, sortBy, sortOrder }: RestaurantListTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (sortBy === field) {
      // Toggle order
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to asc
      params.set('sortBy', field)
      params.set('sortOrder', 'asc')
    }
    
    // Changing sort shouldn't necessarily reset page, but some UX patterns prefer it. 
    // We will keep the current page for a better experience.
    router.push(`${pathname}?${params.toString()}`)
  }

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
    if (sortOrder === 'asc') return <ArrowUp className="ml-1 h-3.5 w-3.5 text-foreground" />
    return <ArrowDown className="ml-1 h-3.5 w-3.5 text-foreground" />
  }

  const Th = ({ field, children, align = 'left' }: { field: string; children: React.ReactNode; align?: 'left' | 'right' }) => (
    <th 
      className={`px-4 py-3 text-${align} text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none group hover:bg-muted/80 transition-colors whitespace-nowrap`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {children}
        {renderSortIcon(field)}
      </div>
    </th>
  )

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No matching restaurants found</h3>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <Th field="restaurantCode">Code</Th>
              <Th field="restaurantName">Restaurant</Th>
              {/* Note: sorting by nested relation 'owner' is complex in Prisma orderBy without specialized syntax, 
                  we skip sorting on owner for simplicity and safety, but it's technically possible with relation sorting.
                  We won't make it sortable to keep to the requested whitelist (restaurantName, restaurantCode, city, status, createdAt, updatedAt)
              */}
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner / Contact</th>
              <Th field="city">City</Th>
              <Th field="status">Status</Th>
              <Th field="createdAt">Registered</Th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((restaurant) => (
              <tr key={restaurant.id} className="transition-colors hover:bg-muted/40">
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="font-mono text-xs font-medium text-muted-foreground">{restaurant.restaurantCode}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 font-medium text-foreground">
                  {restaurant.restaurantName}
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-medium text-foreground">{restaurant.owner.fullName}</p>
                  <p className="text-xs text-muted-foreground">{restaurant.owner.email}</p>
                  <p className="text-xs text-muted-foreground">{restaurant.owner.phoneNumber}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                  {restaurant.city}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <StatusBadge status={restaurant.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                  {format(new Date(restaurant.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                  <Link 
                    href={`/admin/restaurants/${restaurant.id}`}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    Manage
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
