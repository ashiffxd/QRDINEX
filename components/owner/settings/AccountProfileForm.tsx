'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, Save, Loader2, CheckCircle2, AlertCircle, LogOut, Pencil, X } from 'lucide-react'

interface AccountProfileFormProps {
  initialUser: {
    id: string
    fullName: string
    email: string
    phoneNumber: string
    role: string
  }
}

export function AccountProfileForm({ initialUser }: AccountProfileFormProps) {
  const router = useRouter()

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false)

  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: initialUser.fullName || '',
    email: initialUser.email || '',
    phoneNumber: initialUser.phoneNumber || '',
  })

  // Snapshot to restore on cancel
  const [snapshot, setSnapshot] = useState(profileData)

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Password form state
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPass, setIsChangingPass] = useState(false)
  const [passSuccess, setPassSuccess] = useState<string | null>(null)
  const [passError, setPassError] = useState<string | null>(null)

  const handleEditClick = () => {
    setSnapshot(profileData) // save current values for cancel
    setProfileSuccess(null)
    setProfileError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setProfileData(snapshot) // restore pre-edit values
    setProfileError(null)
    setIsEditing(false)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileSuccess(null)
    setProfileError(null)

    try {
      const res = await fetch('/api/owner/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })
      const data = await res.json()

      if (data.success) {
        setProfileSuccess('Account profile updated successfully!')
        setIsEditing(false)
      } else {
        setProfileError(data.message || 'Failed to update profile.')
      }
    } catch (err) {
      setProfileError('Network error. Please try again.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passData.newPassword !== passData.confirmPassword) {
      setPassError('New password and confirm password do not match.')
      return
    }

    setIsChangingPass(true)
    setPassSuccess(null)
    setPassError(null)

    try {
      const res = await fetch('/api/owner/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passData),
      })
      const data = await res.json()

      if (data.success) {
        setPassSuccess('Password changed successfully! Redirecting to login...')
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => {
          router.push('/login?message=password_changed')
        }, 1500)
      } else {
        setPassError(data.message || 'Failed to change password.')
      }
    } catch (err) {
      setPassError('Network error. Please try again.')
    } finally {
      setIsChangingPass(false)
    }
  }

  const fieldClass = isEditing
    ? 'mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
    : 'mt-1.5 w-full rounded-xl border border-transparent bg-muted/40 px-4 py-2.5 text-sm text-foreground cursor-default select-text'

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <form onSubmit={handleProfileSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        {/* Header row with Edit button */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Owner Personal Account Profile
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isEditing ? 'Edit your personal name and contact information.' : 'Your personal account details.'}
            </p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {profileSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-foreground">
              Full Name {isEditing && <span className="text-destructive">*</span>}
            </label>
            <input
              type="text"
              required={isEditing}
              readOnly={!isEditing}
              value={profileData.fullName}
              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">
              Login Email {isEditing && <span className="text-destructive">*</span>}
            </label>
            <input
              type="email"
              required={isEditing}
              readOnly={!isEditing}
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-foreground">Phone Number</label>
            <input
              type="text"
              readOnly={!isEditing}
              value={profileData.phoneNumber}
              onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile
            </button>
          </div>
        )}
      </form>

      {/* Security / Password Section */}
      <form onSubmit={handlePasswordSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security & Change Password
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Changing your password will log you out of all active sessions.
          </p>
        </div>

        {passSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}

        {passError && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-semibold text-foreground">Current Password</label>
            <input
              type="password"
              required
              value={passData.currentPassword}
              onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={passData.newPassword}
              onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={passData.confirmPassword}
              onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isChangingPass}
            className="inline-flex items-center gap-2 rounded-xl bg-destructive px-6 py-2.5 text-sm font-bold text-destructive-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {isChangingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Update Password & Log Out
          </button>
        </div>
      </form>
    </div>
  )
}
