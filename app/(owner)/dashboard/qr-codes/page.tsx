import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { TableQuerySchema } from '@/schemas/owner/table-query'
import { getPaginatedTableQRs } from '@/services/owner/qrcode.service'
import { QrListFilters } from '@/components/owner/qr-codes/QrListFilters'
import { QrListTable } from '@/components/owner/qr-codes/QrListTable'
import { Pagination } from '@/components/admin/Pagination'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'QR Codes',
}

export default async function QrCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    redirect('/login')
  }

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

  // We reuse the TableQuerySchema since it handles pagination and search
  const parsed = TableQuerySchema.safeParse(queryMap)
  
  let validQuery = TableQuerySchema.parse({})
  let validationError = false

  if (parsed.success) {
    validQuery = parsed.data
  } else {
    validationError = true
  }

  const { data, metadata } = await getPaginatedTableQRs(sessionResult.data.restaurantId, validQuery)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">QR Codes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and manage physical QR codes for your dining tables.
          </p>
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>Some filters in the URL were invalid and have been ignored.</p>
        </div>
      )}

      <QrListFilters />

      <div className="flex flex-col gap-0 rounded-xl border border-border bg-card shadow-sm">
        <QrListTable data={data} />
        
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
