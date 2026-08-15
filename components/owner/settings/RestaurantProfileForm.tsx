'use client'

import { useState } from 'react'
import { Building2, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface RestaurantProfileFormProps {
  initialData: {
    restaurantName: string
    logoUrl?: string | null
    description?: string | null
    address: string
    city: string
    phone?: string | null
    email?: string | null
    sessionMode: 'OPEN' | 'APPROVAL'
  }
}

export function RestaurantProfileForm({ initialData }: RestaurantProfileFormProps) {
  const [formData, setFormData] = useState({
    restaurantName: initialData.restaurantName || '',
    logoUrl: initialData.logoUrl || '',
    description: initialData.description || '',
    address: initialData.address || '',
    city: initialData.city || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    sessionMode: initialData.sessionMode || 'APPROVAL',
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
      const res = await fetch('/api/owner/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (data.success) {
        setSuccessMessage('Restaurant profile updated successfully!')
      } else {
        setErrorMessage(data.message || 'Failed to update profile.')
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-foreground">
            Restaurant Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.restaurantName}
            onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Spice Garden Fine Dining"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground">Phone Number</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="+91 9876543210"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="contact@restaurant.com"
          />
        </div>

        {/* ── Table Session Mode Selection (New Feature) ── */}
        <div className="sm:col-span-2 border-t border-border/60 pt-6">
          <label className="block text-sm font-semibold text-foreground">
            Table Session Mode
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure how customers access the menu after scanning table QR codes.
          </p>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {/* Approval Required card */}
            <div
              onClick={() => setFormData({ ...formData, sessionMode: 'APPROVAL' })}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:bg-muted/50 ${
                formData.sessionMode === 'APPROVAL'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-background'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    formData.sessionMode === 'APPROVAL'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 bg-background'
                  }`}
                >
                  {formData.sessionMode === 'APPROVAL' && '✓'}
                </span>
                <span className="text-sm font-bold text-foreground">Approval Required</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Staff must approve new sessions from the Live Table Monitor. Recommended to prevent remote/false orders.
              </p>
            </div>

            {/* Open Access card */}
            <div
              onClick={() => setFormData({ ...formData, sessionMode: 'OPEN' })}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:bg-muted/50 ${
                formData.sessionMode === 'OPEN'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-background'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                    formData.sessionMode === 'OPEN'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 bg-background'
                  }`}
                >
                  {formData.sessionMode === 'OPEN' && '✓'}
                </span>
                <span className="text-sm font-bold text-foreground">Open Access</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Customers scan and access the menu immediately. Faster entry, but vulnerable if QR codes are shared outside.
              </p>
            </div>
          </div>
        </div>

        <div className="sm:col-span-2 border-t border-border/60 pt-6">
          <label className="block text-sm font-semibold text-foreground">Logo URL</label>
          <input
            type="url"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="https://images.example.com/logo.png"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-foreground">Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Brief tagline or description of your dining experience..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground">Street Address</label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="123 Main Street"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground">City</label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Mumbai"
          />
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
          Save Profile
        </button>
      </div>
    </form>
  )
}
