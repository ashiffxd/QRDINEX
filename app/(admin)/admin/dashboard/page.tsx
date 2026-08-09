import type { Metadata } from 'next'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Building2,
  Clock,
  CheckCircle2,
  MinusCircle,
  ArrowRight,
  Store,
} from 'lucide-react'
import {
  getDashboardStats,
  getRecentRestaurants,
  getPendingRestaurants,
} from '@/services/admin/dashboard.service'
import { StatsCard } from '@/components/admin/StatsCard'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { PendingApprovalsTable } from '@/components/admin/PendingApprovalsTable'

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Dashboard — QRDineX Admin',
  description: 'Super Admin dashboard overview for QRDineX platform management.',
}

// ---------------------------------------------------------------------------
// PAGE — Server Component (reads live DB data, no client fetch)
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  // Parallel data fetching — all three queries run simultaneously
  const [stats, recentRestaurants, pendingRestaurants] = await Promise.all([
    getDashboardStats(),
    getRecentRestaurants(8),
    getPendingRestaurants(),
  ])

  // Limit pending display on dashboard to top 5 (full list on /admin/pending)
  const pendingPreview = pendingRestaurants.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your QRDineX platform.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* STATS CARDS                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Restaurants"
          value={stats.totalRestaurants}
          icon={Building2}
          description="All registered restaurants"
          colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pendingRestaurants}
          icon={Clock}
          description="Awaiting admin review"
          colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatsCard
          title="Active Restaurants"
          value={stats.activeRestaurants}
          icon={CheckCircle2}
          description="Fully operational"
          colorClass="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatsCard
          title="Inactive Restaurants"
          value={stats.inactiveRestaurants}
          icon={MinusCircle}
          description="Suspended or deactivated"
          colorClass="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PENDING APPROVALS PREVIEW                                           */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Pending Approvals</h2>
            <p className="text-sm text-muted-foreground">
              Restaurants waiting for your review
            </p>
          </div>
          {pendingRestaurants.length > 5 && (
            <Link
              href="/admin/pending"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all {pendingRestaurants.length}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {pendingPreview.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No pending approvals"
            description="All restaurant registrations have been reviewed."
          />
        ) : (
          <PendingApprovalsTable restaurants={pendingPreview} />
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* RECENT RESTAURANTS TABLE                                            */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Recent Registrations</h2>
            <p className="text-sm text-muted-foreground">
              The latest restaurants to join QRDineX
            </p>
          </div>
          <Link
            href="/admin/restaurants"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentRestaurants.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No restaurants yet"
            description="Restaurants will appear here once owners start signing up."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Restaurant
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Owner
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      City
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentRestaurants.map((restaurant) => (
                    <tr
                      key={restaurant.id}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/restaurants/${restaurant.id}`}
                          className="group block"
                        >
                          <p className="font-medium text-foreground group-hover:text-primary">
                            {restaurant.restaurantName}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {restaurant.restaurantCode}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-foreground">
                          {restaurant.owner.fullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {restaurant.owner.email}
                        </p>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EMPTY STATE SUB-COMPONENT
// ---------------------------------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
