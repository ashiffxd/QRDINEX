export default function RestaurantDetailsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 h-4 w-32 rounded bg-muted" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-64 rounded-lg bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
          <div className="mt-1 h-4 w-32 rounded bg-muted" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 rounded-lg bg-muted" />
          <div className="h-10 w-32 rounded-lg bg-muted" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info Cards Skeleton */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4">
              <div className="h-5 w-5 rounded bg-muted" />
              <div className="h-5 w-32 rounded bg-muted" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-start gap-3 px-5 py-4">
                  <div className="mt-0.5 h-4 w-4 rounded bg-muted" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="h-4 w-40 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Future modules skeleton */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 h-28" />
        ))}
      </div>
    </div>
  )
}
