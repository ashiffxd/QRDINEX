import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { User, Mail, Phone, Calendar, ShieldCheck, KeyRound } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm'

export const metadata: Metadata = {
  title: 'Profile — QRDineX Admin',
}

export default async function AdminProfilePage() {
  const sessionResult = await requireRole(['SUPER_ADMIN'])
  
  if (!sessionResult.success) {
    redirect('/login')
  }

  // Fetch fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: sessionResult.data.userId }
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your administrative profile and manage your security settings.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Personal Information</h2>
          </div>
          <div className="divide-y divide-border">
            <InfoRow icon={User} label="Full Name" value={user.fullName} />
            <InfoRow icon={Mail} label="Email Address" value={user.email} />
            <InfoRow icon={Phone} label="Phone Number" value={user.phoneNumber} />
            <InfoRow icon={ShieldCheck} label="Role" value={user.role} badge />
            <InfoRow icon={Calendar} label="Account Created" value={format(new Date(user.createdAt), 'MMMM d, yyyy h:mm a')} />
            <InfoRow icon={Calendar} label="Last Updated" value={format(new Date(user.updatedAt), 'MMMM d, yyyy h:mm a')} />
          </div>
        </section>

        {/* Security Settings */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Change Password</h2>
          </div>
          <div className="p-5">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, badge = false }: { icon: any; label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {badge ? (
          <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {value}
          </span>
        ) : (
          <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
        )}
      </div>
    </div>
  )
}
