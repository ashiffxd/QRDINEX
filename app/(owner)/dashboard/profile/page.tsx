import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { getProfile } from '@/services/auth/account.service'
import { AccountProfileForm } from '@/components/owner/settings/AccountProfileForm'
import { User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'My Profile — QRDineX',
  description: 'View and update your personal account profile and password.',
}

export default async function ProfilePage() {
  const auth = await requireRole(['OWNER'])
  if (!auth.success) {
    redirect('/login')
  }

  const profileResult = await getProfile(auth.data.userId)

  if (!profileResult.success || !profileResult.data) {
    redirect('/login')
  }

  const user = profileResult.data

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-3">
          <User className="h-7 w-7 text-primary" />
          My Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal account details and change your password.
        </p>
      </div>

      {/* Read-only info card */}
      <div className="rounded-2xl border border-border bg-muted/30 px-6 py-4 flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</span>
          <p className="mt-0.5 font-semibold text-foreground capitalize">{user.role.toLowerCase()}</p>
        </div>
        {user.restaurant && (
          <>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restaurant</span>
              <p className="mt-0.5 font-semibold text-foreground">{user.restaurant.restaurantName}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restaurant Code</span>
              <p className="mt-0.5 font-mono font-semibold text-primary">{user.restaurant.restaurantCode}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
              <p className={`mt-0.5 font-semibold capitalize ${user.restaurant.status === 'ACTIVE' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {user.restaurant.status.toLowerCase()}
              </p>
            </div>
          </>
        )}
      </div>

      <AccountProfileForm initialUser={user} />
    </div>
  )
}
