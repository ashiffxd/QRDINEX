'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Loader2, X, AlertTriangle, Printer, Download, RefreshCcw } from 'lucide-react'

// ---------------------------------------------------------------------------
// GENERATE / REGENERATE CONFIRM DIALOG
// ---------------------------------------------------------------------------
export function GenerateConfirmDialog({ isOpen, onClose, table }: { isOpen: boolean; onClose: () => void; table: any }) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !table) return null

  const hasActive = table.qrCodes && table.qrCodes.length > 0

  const handleGenerate = async () => {
    setGlobalError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/owner/qr-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: table.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || 'Failed to generate QR code')
      
      onClose()
      router.refresh()
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogWrapper title={hasActive ? "Regenerate QR Code" : "Generate QR Code"} onClose={onClose}>
      <div className="space-y-4">
        {globalError && <ErrorAlert message={globalError} />}
        
        {hasActive ? (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <h4 className="font-semibold flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4" />
              Warning: Destructive Action
            </h4>
            <p>
              Generating a new QR code will immediately <strong>deactivate</strong> the current QR code for Table {table.tableNumber}. 
              Any physical stickers printed with the old QR will stop working immediately. 
              Are you sure you want to proceed?
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You are about to generate the first secure QR code for Table {table.tableNumber}.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleGenerate} disabled={isSubmitting} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground rounded-lg disabled:opacity-50 transition-colors ${hasActive ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {hasActive ? (
              <><RefreshCcw className="h-4 w-4" /> Yes, Regenerate</>
            ) : (
              'Generate QR'
            )}
          </button>
        </div>
      </div>
    </DialogWrapper>
  )
}

// ---------------------------------------------------------------------------
// QR HISTORY DIALOG
// ---------------------------------------------------------------------------
export function QrHistoryDialog({ isOpen, onClose, table }: { isOpen: boolean; onClose: () => void; table: any }) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && table) {
      setLoading(true)
      fetch(`/api/owner/qr-codes/table/${table.id}/history`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setHistory(data.data)
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, table])

  if (!isOpen || !table) return null

  return (
    <DialogWrapper title={`QR History - Table ${table.tableNumber}`} onClose={onClose}>
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No QR codes have been generated for this table yet.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
            {history.map((qr) => (
              <div key={qr.id} className={`flex items-center justify-between p-3 rounded-lg border ${qr.isActive ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30'}`}>
                <div>
                  <p className="font-mono text-sm font-medium text-foreground">{qr.token}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(qr.createdAt), 'MMM d, yyyy • h:mm a')}</p>
                </div>
                {qr.isActive ? (
                  <span className="text-xs font-semibold text-primary px-2 py-1 rounded bg-primary/10">ACTIVE</span>
                ) : (
                  <span className="text-xs font-semibold text-muted-foreground">INACTIVE</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DialogWrapper>
  )
}

// ---------------------------------------------------------------------------
// QR PREVIEW DIALOG
// ---------------------------------------------------------------------------
export function QrPreviewDialog({ isOpen, onClose, qrCode }: { isOpen: boolean; onClose: () => void; qrCode: any }) {
  if (!isOpen || !qrCode) return null

  const handlePrint = () => {
    // Open the image directly in a new window for easy printing
    const printWindow = window.open(`/api/owner/qr-codes/${qrCode.id}/download`, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  return (
    <DialogWrapper title={`Table ${qrCode.tableNumber} QR Code`} onClose={onClose}>
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
          {/* We fetch the image from our download endpoint */}
          {/* Using an img tag makes it visually display */}
          <img 
            src={`/api/owner/qr-codes/${qrCode.id}/download`} 
            alt={`QR Code for Table ${qrCode.tableNumber}`}
            className="w-48 h-48 object-contain"
          />
        </div>
        
        <div className="text-center">
          <p className="font-mono font-medium text-foreground text-lg">{qrCode.token}</p>
          <p className="text-xs text-muted-foreground mt-1">This token is unique and secure.</p>
        </div>

        <div className="flex w-full gap-3 pt-4 border-t border-border">
          <button 
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <a
            href={`/api/owner/qr-codes/${qrCode.id}/download`}
            download
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </a>
        </div>
      </div>
    </DialogWrapper>
  )
}

// ---------------------------------------------------------------------------
// SHARED UTILS
// ---------------------------------------------------------------------------
function DialogWrapper({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg sm:my-8 animate-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}
