'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Loader2,
  Receipt,
  CheckCircle2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
} from 'lucide-react'

interface BillingModalProps {
  sessionId: string | null
  onClose: () => void
  onSuccess?: () => void
}

export function BillingModal({ sessionId, onClose, onSuccess }: BillingModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculation parameters
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [taxPercent, setTaxPercent] = useState<number>(5) // Default 5% GST
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(0)

  // State returned from API
  const [isGenerated, setIsGenerated] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [invoice, setInvoice] = useState<any>(null)

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('CASH')
  const [notes, setNotes] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)

  const fetchBillingData = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams({
        taxPercent: taxPercent.toString(),
        discountPercent: discountPercent.toString(),
        serviceChargePercent: serviceChargePercent.toString(),
      })
      const res = await fetch(`/api/owner/invoices/session/${sessionId}?${query.toString()}`)
      const data = await res.json()

      if (data.success) {
        setIsGenerated(data.isGenerated)
        if (data.isGenerated) {
          setInvoice(data.invoice)
        } else {
          setPreview(data.preview)
        }
      } else {
        setError(data.message || 'Failed to load billing details')
      }
    } catch (e) {
      setError('Network error loading billing data')
    } finally {
      setLoading(false)
    }
  }, [sessionId, taxPercent, discountPercent, serviceChargePercent])

  useEffect(() => {
    fetchBillingData()
  }, [fetchBillingData])

  const handleGenerateInvoice = async () => {
    if (!sessionId) return
    setIsActionLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/owner/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          discountPercent,
          taxPercent,
          serviceChargePercent,
          notes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setInvoice(data.invoice)
        setIsGenerated(true)
        onSuccess?.()
      } else {
        setError(data.message || 'Failed to generate invoice')
      }
    } catch (e) {
      setError('Network error generating invoice')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!invoice?.id) return
    setIsActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/owner/invoices/${invoice.id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          notes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setInvoice(data.invoice)
        onSuccess?.()
      } else {
        setError(data.message || 'Failed to record payment')
      }
    } catch (e) {
      setError('Network error recording payment')
    } finally {
      setIsActionLoading(false)
    }
  }

  if (!sessionId) return null

  const items = isGenerated ? invoice?.items || [] : preview?.items || []
  const tableNumber = isGenerated ? invoice?.session?.table?.tableNumber : preview?.tableNumber
  const subtotal = isGenerated ? Number(invoice?.subtotal) : preview?.subtotal || 0
  const discountAmount = isGenerated ? Number(invoice?.discountAmount) : preview?.discountAmount || 0
  const taxAmount = isGenerated ? Number(invoice?.taxAmount) : preview?.taxAmount || 0
  const serviceCharge = isGenerated ? Number(invoice?.serviceCharge) : preview?.serviceCharge || 0
  const roundOff = isGenerated ? Number(invoice?.roundOff) : preview?.roundOff || 0
  const grandTotal = isGenerated ? Number(invoice?.grandTotal) : preview?.grandTotal || 0

  const isPaid = isGenerated && invoice?.paymentStatus === 'PAID'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {isPaid
                ? 'Tax Invoice (Paid)'
                : isGenerated
                ? 'Invoice Generated'
                : 'Billing Calculation'}
            </h2>
            {tableNumber && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Table {tableNumber}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-xl bg-destructive/10 p-4 text-center text-destructive">
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : (
            <>
              {/* Paid Header Banner */}
              {isPaid && (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-bold text-sm">Payment Received — Session Completed</p>
                    <p className="text-xs opacity-90">
                      Paid via {invoice.paymentMethod} on{' '}
                      {new Date(invoice.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}

              {/* Invoice Number info */}
              {isGenerated && (
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-3">
                  <span>Invoice #: <strong className="text-foreground font-mono">{invoice.invoiceNumber}</strong></span>
                  <span>Date: {new Date(invoice.generatedAt).toLocaleDateString()}</span>
                </div>
              )}

              {/* Itemized Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item</th>
                      <th className="px-4 py-3 font-semibold text-center">Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Price</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item: any, idx: number) => (
                      <tr key={item.id || idx}>
                        <td className="px-4 py-3 font-medium text-foreground">{item.itemName}</td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">${Number(item.lineTotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Adjustment Inputs (Only when creating invoice) */}
              {!isGenerated && (
                <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-muted/20 p-4 text-xs">
                  <div>
                    <label className="block font-medium text-muted-foreground mb-1">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-muted-foreground mb-1">Tax / GST (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value)))}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-muted-foreground mb-1">Service Charge (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={serviceChargePercent}
                      onChange={(e) => setServiceChargePercent(Math.max(0, Number(e.target.value)))}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Financial Calculation Breakdown */}
              <div className="space-y-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax / GST ({taxPercent}%)</span>
                    <span>+${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {serviceCharge > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service Charge ({serviceChargePercent}%)</span>
                    <span>+${serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                {roundOff !== 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground/70">
                    <span>Round Off</span>
                    <span>{roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2">
                  <span>Grand Total</span>
                  <span className="text-primary text-lg">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selector (When invoice generated & unpaid) */}
              {isGenerated && !isPaid && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['CASH', 'UPI', 'CARD', 'OTHER'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-lg border py-2.5 text-xs font-semibold transition-all ${
                          paymentMethod === method
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/30'
                        }`}
                      >
                        {method === 'CASH' && <Banknote className="h-4 w-4" />}
                        {method === 'UPI' && <QrCode className="h-4 w-4" />}
                        {method === 'CARD' && <CreditCard className="h-4 w-4" />}
                        {method === 'OTHER' && <DollarSign className="h-4 w-4" />}
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {isPaid ? 'Close' : 'Cancel'}
          </button>

          {!isGenerated && !loading && !error && (
            <button
              onClick={handleGenerateInvoice}
              disabled={isActionLoading}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              Generate Invoice
            </button>
          )}

          {isGenerated && !isPaid && !loading && (
            <button
              onClick={handleMarkPaid}
              disabled={isActionLoading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mark Paid & Complete Session
            </button>
          )}

          {isPaid && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
