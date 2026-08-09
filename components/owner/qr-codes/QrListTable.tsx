'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { QrCode as QrIcon, MoreHorizontal, Download, Printer, History, RefreshCcw, PowerOff, Loader2, X, CheckCircle2 } from 'lucide-react'
import { PaginatedQrTablesResult } from '@/services/owner/qrcode.service'
import { GenerateConfirmDialog, QrHistoryDialog, QrPreviewDialog } from './QrDialogs'

export function QrListTable({ data }: { data: PaginatedQrTablesResult['data'] }) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  
  // Dialog States
  const [generatingTable, setGeneratingTable] = useState<any | null>(null)
  const [historyTable, setHistoryTable] = useState<any | null>(null)
  const [previewQr, setPreviewQr] = useState<any | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <QrIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-foreground">No tables found</h3>
        <p className="mt-1 text-sm text-muted-foreground">Create tables first to generate QR codes.</p>
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Table No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">QR Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Active Token</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Generated On</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((table) => {
                const activeQr = table.qrCodes[0]
                const hasActive = !!activeQr

                return (
                  <tr key={table.id} className="transition-colors hover:bg-muted/40 relative">
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium text-foreground">
                      Table {table.tableNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      {hasActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:border-green-800/50 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:border-yellow-800/50 dark:bg-yellow-900/30 dark:text-yellow-500">
                          <PowerOff className="h-3 w-3" />
                          No Active QR
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-muted-foreground">
                      {hasActive ? activeQr.token : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {hasActive ? format(new Date(activeQr.createdAt), 'MMM d, yyyy') : '—'}
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
                          {hasActive ? (
                            <>
                              <button
                                onClick={() => { setPreviewQr({ ...activeQr, tableNumber: table.tableNumber }); setOpenDropdownId(null) }}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                              >
                                <QrIcon className="h-4 w-4 text-muted-foreground" />
                                Preview & Print
                              </button>
                              <a
                                href={`/api/owner/qr-codes/${activeQr.id}/download`}
                                download
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                                onClick={() => setOpenDropdownId(null)}
                              >
                                <Download className="h-4 w-4 text-muted-foreground" />
                                Download PNG
                              </a>
                            </>
                          ) : (
                            <button
                              onClick={() => { setGeneratingTable(table); setOpenDropdownId(null) }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors text-primary"
                            >
                              <Plus className="h-4 w-4" />
                              Generate QR
                            </button>
                          )}
                          
                          <div className="my-1 h-px bg-border" />
                          
                          <button
                            onClick={() => { setHistoryTable(table); setOpenDropdownId(null) }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                          >
                            <History className="h-4 w-4 text-muted-foreground" />
                            View History
                          </button>

                          {hasActive && (
                            <button
                              onClick={() => { setGeneratingTable(table); setOpenDropdownId(null) }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                            >
                              <RefreshCcw className="h-4 w-4" />
                              Regenerate QR
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <GenerateConfirmDialog 
        isOpen={!!generatingTable} 
        onClose={() => setGeneratingTable(null)} 
        table={generatingTable} 
      />
      
      <QrHistoryDialog 
        isOpen={!!historyTable} 
        onClose={() => setHistoryTable(null)} 
        table={historyTable} 
      />

      <QrPreviewDialog 
        isOpen={!!previewQr} 
        onClose={() => setPreviewQr(null)} 
        qrCode={previewQr} 
      />
    </>
  )
}

function Plus({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"/>
      <path d="M12 5v14"/>
    </svg>
  )
}
