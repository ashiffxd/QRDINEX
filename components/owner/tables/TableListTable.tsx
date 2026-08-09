'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowUpDown, ArrowUp, ArrowDown, Building2, MoreHorizontal, Edit, PowerOff, Power, QrCode } from 'lucide-react'
import { DiningTableStatus } from '@prisma/client'
import { PaginatedTablesResult } from '@/services/owner/table.service'
import { EditTableDialog, StatusToggleDialog } from './TableDialogs'

interface TableListTableProps {
  data: PaginatedTablesResult['data']
  sortBy: string
  sortOrder: string
}

export function TableListTable({ data, sortBy, sortOrder }: TableListTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [editingTable, setEditingTable] = useState<any | null>(null)
  const [togglingTable, setTogglingTable] = useState<any | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sortBy === field) {
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      params.set('sortBy', field)
      params.set('sortOrder', 'asc')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
    if (sortOrder === 'asc') return <ArrowUp className="ml-1 h-3.5 w-3.5 text-foreground" />
    return <ArrowDown className="ml-1 h-3.5 w-3.5 text-foreground" />
  }

  const Th = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th 
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none group hover:bg-muted/80 transition-colors whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {renderSortIcon(field)}
      </div>
    </th>
  )

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No matching tables found</h3>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or create a new table.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm relative">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <Th field="tableNumber">Table No.</Th>
                <Th field="capacity">Capacity</Th>
                <Th field="status">Status</Th>
                <Th field="createdAt">Added On</Th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((table) => (
                <tr key={table.id} className="transition-colors hover:bg-muted/40 relative">
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-foreground">
                    Table {table.tableNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    {table.capacity} Guests
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <TableStatusBadge status={table.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                    {format(new Date(table.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right relative">
                    <button 
                      onClick={() => setOpenDropdownId(openDropdownId === table.id ? null : table.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {/* Action Dropdown */}
                    {openDropdownId === table.id && (
                      <div className="absolute right-8 top-10 z-10 w-48 rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in zoom-in-95">
                        <button
                          onClick={() => { setEditingTable(table); setOpenDropdownId(null) }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                          Edit Details
                        </button>
                        
                        {table.status !== DiningTableStatus.OCCUPIED && (
                          <button
                            onClick={() => { setTogglingTable(table); setOpenDropdownId(null) }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                          >
                            {table.status === DiningTableStatus.AVAILABLE ? (
                              <><PowerOff className="h-4 w-4 text-destructive" /><span className="text-destructive">Mark Out of Service</span></>
                            ) : (
                              <><Power className="h-4 w-4 text-green-500" /><span className="text-green-500">Activate Table</span></>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditTableDialog 
        isOpen={!!editingTable} 
        onClose={() => setEditingTable(null)} 
        table={editingTable} 
      />
      <StatusToggleDialog 
        isOpen={!!togglingTable} 
        onClose={() => setTogglingTable(null)} 
        table={togglingTable} 
      />
    </>
  )
}

function TableStatusBadge({ status }: { status: DiningTableStatus }) {
  const styles: Record<DiningTableStatus, string> = {
    AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    OCCUPIED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    OUT_OF_SERVICE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  }
  
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
