import type { Metadata } from 'next'
import { headers } from 'next/headers'
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  QrCode,
  BadgeCheck,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { getProfile } from '@/services/auth/account.service'
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm'
import { LogoutButton } from '@/components/account/LogoutButton'

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Account Settings — QRDineX',
  description: 'Manage your QRDineX account profile and security settings.',
}

// ---------------------------------------------------------------------------
// STATUS BADGE CONFIG
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; classes: string }
> = {
  ACTIVE: {
    label: 'Active',
    icon: BadgeCheck,
    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  PENDING: {
    label: 'Pending Verification',
    icon: Clock,
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  INACTIVE: {
    label: 'Inactive',
    icon: XCircle,
    classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  REJECTED: {
    label: 'Rejected',
    icon: AlertTriangle,
    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
}

const ROLE_CONFIG: Record<string, { label: string; classes: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  OWNER: {
    label: 'Restaurant Owner',
    classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
}

// ---------------------------------------------------------------------------
// PAGE — Server Component
// Reads userId from the x-user-id header injected by middleware.
// Falls back to requireSession() if header is absent.
// ---------------------------------------------------------------------------

export default async function SettingsPage() {
  // Read user ID from middleware-forwarded header
  const headersList = await headers()
  const userId = headersList.get('x-user-id')

  // Fetch profile
  const profileResult = userId ? await getProfile(userId) : null
  const profile = profileResult?.success ? profileResult.data : null

  const statusCfg = profile?.restaurant
    ? STATUS_CONFIG[profile.restaurant.status] ?? STATUS_CONFIG.PENDING
    : null

  const roleCfg = profile ? ROLE_CONFIG[profile.role] ?? ROLE_CONFIG.OWNER : null

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile information and security settings.
          </p>
        </div>

        <div className="space-y-6">
          {/* ---------------------------------------------------------------- */}
          {/* PROFILE CARD                                                     */}
          {/* ---------------------------------------------------------------- */}
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Profile Information</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your account details on QRDineX.
              </p>
            </div>

            {profile ? (
              <div className="divide-y divide-border">
                {/* Full Name */}
                <ProfileRow
                  icon={<User className="h-4 w-4" />}
                  label="Full Name"
                  value={profile.fullName}
                />

                {/* Email */}
                <ProfileRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                  value={profile.email}
                />

                {/* Phone */}
                <ProfileRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone Number"
                  value={profile.phoneNumber}
                />

                {/* Role */}
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Role</p>
                    {roleCfg && (
                      <span
                        className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleCfg.classes}`}
                      >
                        {roleCfg.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Restaurant info — OWNER only */}
                {profile.restaurant && (
                  <>
                    <ProfileRow
                      icon={<Building2 className="h-4 w-4" />}
                      label="Restaurant Name"
                      value={profile.restaurant.restaurantName}
                    />

                    <div className="flex items-center gap-4 px-6 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <QrCode className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Restaurant Code</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold tracking-widest text-foreground">
                          {profile.restaurant.restaurantCode}
                        </p>
                      </div>
                    </div>

                    {statusCfg && (
                      <div className="flex items-center gap-4 px-6 py-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <statusCfg.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Restaurant Status</p>
                          <span
                            className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.classes}`}
                          >
                            <statusCfg.icon className="h-3 w-3" />
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                Unable to load profile. Please refresh the page.
              </div>
            )}
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* CHANGE PASSWORD CARD                                             */}
          {/* ---------------------------------------------------------------- */}
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Change Password</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                After changing your password, you will be signed out and must log in again.
              </p>
            </div>
            <div className="px-6 py-6">
              <ChangePasswordForm />
            </div>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* SIGN OUT CARD                                                    */}
          {/* ---------------------------------------------------------------- */}
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Sign Out</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Sign out of your account on this device.
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Your session will be cleared. You can log back in at any time.
              </p>
              <LogoutButton />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PROFILE ROW SUB-COMPONENT
// ---------------------------------------------------------------------------

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
