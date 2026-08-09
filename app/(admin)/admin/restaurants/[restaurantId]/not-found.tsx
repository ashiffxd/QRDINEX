import Link from 'next/link'
import { Building2, ArrowLeft } from 'lucide-react'

export default function RestaurantNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Restaurant Not Found</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        We couldn't find the restaurant you were looking for. It may have been removed, or the ID in the URL is incorrect.
      </p>
      <Link
        href="/admin/restaurants"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Restaurants
      </Link>
    </div>
  )
}
