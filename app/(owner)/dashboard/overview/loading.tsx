export default function DashboardOverviewLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-64 rounded-md bg-muted" />
      </div>

      {/* Metrics Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col justify-between rounded-xl border border-border bg-card px-5 py-5 h-28">
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-5 w-5 rounded-full bg-muted" />
            </div>
            <div className="h-8 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions Skeleton */}
        <div className="rounded-xl border border-border bg-card h-72">
          <div className="border-b border-border bg-muted/30 px-5 py-4">
            <div className="h-5 w-32 rounded bg-muted" />
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border h-24" />
            ))}
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="rounded-xl border border-border bg-card h-72">
          <div className="border-b border-border bg-muted/30 px-5 py-4">
            <div className="h-5 w-32 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
