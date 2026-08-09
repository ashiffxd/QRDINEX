import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getCategories } from '@/services/owner/menu-category.service'
import { CategoryList } from '@/components/owner/menu/CategoryList'
import { CreateCategoryButton } from '@/components/owner/menu/CreateCategoryButton'

export const metadata: Metadata = {
  title: 'Menu Categories — QRDineX',
}

export default async function MenuCategoriesPage() {
  const sessionResult = await requireRole('OWNER')
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    redirect('/login')
  }

  const { data } = await getCategories(sessionResult.data.restaurantId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Menu Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your menu into logical sections (e.g. Starters, Mains, Desserts).
          </p>
        </div>
        <CreateCategoryButton />
      </div>

      <CategoryList categories={data} />
    </div>
  )
}
