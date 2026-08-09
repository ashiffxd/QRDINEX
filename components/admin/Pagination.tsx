'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalRecords: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  hasNextPage,
  hasPreviousPage,
}: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `${pathname}?${params.toString()}`
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    router.push(createPageUrl(page))
  }

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const limit = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    params.set('limit', limit)
    params.set('page', '1') // Reset to page 1 on limit change
    router.push(`${pathname}?${params.toString()}`)
  }

  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, totalRecords)

  if (totalRecords === 0) return null

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border px-6 py-4 sm:flex-row">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{startRecord}</span> to{' '}
        <span className="font-medium text-foreground">{endRecord}</span> of{' '}
        <span className="font-medium text-foreground">{totalRecords}</span> results
      </div>

      <div className="flex items-center gap-4">
        {/* Limit Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="limit" className="text-sm text-muted-foreground">Rows per page</label>
          <select
            id="limit"
            value={pageSize}
            onChange={handleLimitChange}
            className="rounded-lg border border-input bg-background py-1.5 pl-2 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <span className="sr-only">Previous Page</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="px-3 text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <span className="sr-only">Next Page</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
