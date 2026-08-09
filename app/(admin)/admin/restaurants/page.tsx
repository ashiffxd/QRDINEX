import type { Metadata } from 'next'
import { getPaginatedRestaurants } from '@/services/admin/restaurant.service'
import { RestaurantQuerySchema } from '@/schemas/admin/restaurant-query'
import { RestaurantListFilters } from '@/components/admin/RestaurantListFilters'
import { RestaurantListTable } from '@/components/admin/RestaurantListTable'
import { Pagination } from '@/components/admin/Pagination'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Restaurants — QRDineX Admin',
}

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // 1. Resolve and parse searchParams (Next.js 15 asynchronous searchParams)
  const resolvedSearchParams = await searchParams
  
  // Convert any array params to string (taking first element) to simplify for Zod
  const queryMap: Record<string, string> = {}
  Object.keys(resolvedSearchParams).forEach((key) => {
    const val = resolvedSearchParams[key]
    if (Array.isArray(val)) {
      queryMap[key] = val[0]
    } else if (val !== undefined) {
      queryMap[key] = val
    }
  })

  // 2. Validate params safely. 
  // If parsing fails (e.g., negative page number), we fall back to defaults rather than crashing the page entirely.
  // The API endpoint would return a strict 400, but for Server Components, graceful degradation is better UX.
  const parsed = RestaurantQuerySchema.safeParse(queryMap)
  
  let validQuery = RestaurantQuerySchema.parse({}) // default values
  let validationError = false

  if (parsed.success) {
    validQuery = parsed.data
  } else {
    validationError = true
  }

  // 3. Fetch data from service
  const { data, metadata } = await getPaginatedRestaurants(validQuery)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Restaurants</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage all restaurants on the platform.
        </p>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>Some filters in the URL were invalid and have been ignored.</p>
        </div>
      )}

      {/* Client-side Filtering Controls */}
      <RestaurantListFilters />

      <div className="flex flex-col gap-0 rounded-xl border border-border bg-card shadow-sm">
        {/* Client-side Table with Sorting */}
        <RestaurantListTable 
          data={data} 
          sortBy={validQuery.sortBy} 
          sortOrder={validQuery.sortOrder} 
        />
        
        {/* Client-side Pagination */}
        <Pagination 
          currentPage={metadata.currentPage}
          totalPages={metadata.totalPages}
          totalRecords={metadata.totalRecords}
          pageSize={metadata.pageSize}
          hasNextPage={metadata.hasNextPage}
          hasPreviousPage={metadata.hasPreviousPage}
        />
      </div>
    </div>
  )
}
