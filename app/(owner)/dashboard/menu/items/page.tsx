import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { MenuItemQuerySchema } from '@/schemas/owner/menu-item-query'
import { getPaginatedMenuItems } from '@/services/owner/menu-item.service'
import { getCategories } from '@/services/owner/menu-category.service'
import { ItemFilters } from '@/components/owner/menu/ItemFilters'
import { ItemList } from '@/components/owner/menu/ItemList'
import { CreateItemButton } from '@/components/owner/menu/CreateItemButton'
import { Pagination } from '@/components/admin/Pagination'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Menu Items — QRDineX',
}

export default async function MenuItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sessionResult = await requireRole('OWNER')
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    redirect('/login')
  }

  const restaurantId = sessionResult.data.restaurantId

  const resolvedSearchParams = await searchParams
  
  const queryMap: Record<string, string> = {}
  Object.keys(resolvedSearchParams).forEach((key) => {
    const val = resolvedSearchParams[key]
    if (Array.isArray(val)) {
      queryMap[key] = val[0]
    } else if (val !== undefined) {
      queryMap[key] = val
    }
  })

  const parsed = MenuItemQuerySchema.safeParse(queryMap)
  
  let validQuery = MenuItemQuerySchema.parse({})
  let validationError = false

  if (parsed.success) {
    validQuery = parsed.data
  } else {
    validationError = true
  }

  // Fetch paginated items and raw categories (for filters/forms)
  const [itemsResult, categoriesResult] = await Promise.all([
    getPaginatedMenuItems(restaurantId, validQuery),
    getCategories(restaurantId)
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Menu Items</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your food offerings, prices, and availability.
          </p>
        </div>
        <CreateItemButton categories={categoriesResult.success ? categoriesResult.data : []} />
      </div>

      {validationError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>Some filters in the URL were invalid and have been ignored.</p>
        </div>
      )}

      <ItemFilters categories={categoriesResult.success ? categoriesResult.data : []} />

      <div className="flex flex-col gap-0 rounded-xl border border-border bg-card shadow-sm">
        <ItemList 
          items={itemsResult.data} 
          categories={categoriesResult.success ? categoriesResult.data : []} 
        />
        
        <Pagination 
          currentPage={itemsResult.metadata.currentPage}
          totalPages={itemsResult.metadata.totalPages}
          totalRecords={itemsResult.metadata.totalRecords}
          pageSize={itemsResult.metadata.pageSize}
          hasNextPage={itemsResult.metadata.hasNextPage}
          hasPreviousPage={itemsResult.metadata.hasPreviousPage}
        />
      </div>
    </div>
  )
}
