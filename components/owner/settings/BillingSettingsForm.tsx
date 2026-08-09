'use client'

import { useState } from 'react'
import { Save, Loader2, CheckCircle2, AlertCircle, Percent, Coins } from 'lucide-react'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'

interface BillingSettingsFormProps {
  initialData: {
    serviceChargeEnabled: boolean
    serviceChargePercent: number
    currency: string
  }
}

export function BillingSettingsForm({ initialData }: BillingSettingsFormProps) {
  const [formData, setFormData] = useState({
    serviceChargeEnabled: initialData.serviceChargeEnabled ?? false,
    serviceChargePercent: initialData.serviceChargePercent ?? 0,
    currency: initialData.currency || 'INR',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/owner/settings/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        setSuccessMessage('Billing & currency settings saved successfully!')
      } else {
        setErrorMessage(data.message || 'Failed to update settings.')
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Module 2: Service Charge Configuration */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Service Charge Configuration
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Automatically apply default service charge percentage when generating invoices.
            </p>
          </div>

          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={formData.serviceChargeEnabled}
              onChange={(e) =>
                setFormData({ ...formData, serviceChargeEnabled: e.target.checked })
              }
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-muted peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']" />
          </label>
        </div>

        {formData.serviceChargeEnabled && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              Service Charge Percentage (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.serviceChargePercent}
                onChange={(e) =>
                  setFormData({ ...formData, serviceChargePercent: Number(e.target.value) })
                }
                className="w-36 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm font-medium text-muted-foreground">%</span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-medium">Quick presets:</span>
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setFormData({ ...formData, serviceChargePercent: pct })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
                    formData.serviceChargePercent === pct
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Module 3: Currency Configuration */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Currency Configuration
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Select display currency used across menu, cart, orders, and invoices.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Select Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full sm:w-72 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </button>
      </div>
    </form>
  )
}
