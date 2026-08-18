import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { LiveTableGrid } from '@/components/owner/tables/LiveTableGrid'

export const metadata: Metadata = {
  title: 'Live Table Monitor',
  description: 'Monitor active table sessions, manage guest entries, and accept table scan requests in real-time.',
}

export default async function LiveTablesPage() {
  // 1. Enforce OWNER role
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Table Monitor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your dining tables in real-time, approve session entries, and close tables when guests leave.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <LiveTableGrid />
      </div>
    </div>
  )
}
