/**
 * QRDineX — Admin Dashboard Loading State
 * Next.js automatically shows this while the dashboard page (async Server
 * Component) is fetching data from the database.
 */

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-36 rounded-lg bg-muted" />
        <div className="h-4 w-64 rounded-lg bg-muted" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start justify-between rounded-xl border border-border bg-card p-5"
          >
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-8 w-16 rounded bg-muted" />
              <div className="h-3 w-36 rounded bg-muted" />
            </div>
            <div className="h-11 w-11 rounded-xl bg-muted" />
          </div>
        ))}
      </div>

      {/* Table skeleton 1 */}
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-border px-4 py-4 last:border-0">
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton 2 */}
      <div className="space-y-3">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-border px-4 py-4 last:border-0">
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="h-3 w-28 rounded bg-muted" />
              </div>
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
