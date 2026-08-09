import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { getPendingRestaurants } from '@/services/admin/dashboard.service'
import { PendingApprovalsTable } from '@/components/admin/PendingApprovalsTable'

export const metadata: Metadata = {
  title: 'Pending Approvals — QRDineX Admin',
  description: 'Review and approve or reject pending restaurant registrations.',
}

export default async function PendingApprovalsPage() {
  const pendingRestaurants = await getPendingRestaurants()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pending Approvals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingRestaurants.length === 0
              ? 'All restaurant registrations have been reviewed.'
              : `${pendingRestaurants.length} restaurant${pendingRestaurants.length === 1 ? '' : 's'} awaiting your review — oldest first.`}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-800 dark:bg-amber-900/20">
          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {pendingRestaurants.length} pending
          </span>
        </div>
      </div>

      {/* Interactive table — client component handles approve/reject */}
      <PendingApprovalsTable restaurants={pendingRestaurants} />
    </div>
  )
}
