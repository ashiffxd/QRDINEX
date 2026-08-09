import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  ArrowLeft, 
  ArrowRight,
  Building2, 
  User, 
  FileCheck, 
  History, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  BarChart3,
  QrCode,
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Users
} from 'lucide-react'
import { getRestaurantDetails, getRestaurantStats } from '@/services/admin/restaurant.service'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { RestaurantLifecycleActions } from '@/components/admin/RestaurantLifecycleActions'
import { VerificationStatus } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Restaurant Details — QRDineX Admin',
}

export default async function RestaurantDetailsPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>
}) {
  const { restaurantId } = await params
  
  // Parallel data fetching
  const [restaurant, stats] = await Promise.all([
    getRestaurantDetails(restaurantId),
    getRestaurantStats(restaurantId),
  ])

  if (!restaurant) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/restaurants"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Restaurants
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{restaurant.restaurantName}</h1>
            <StatusBadge status={restaurant.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">Code: {restaurant.restaurantCode}</p>
        </div>

        {/* Action Buttons Orchestrator */}
        <RestaurantLifecycleActions restaurantId={restaurant.id} currentStatus={restaurant.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ------------------------------------------------------------------ */}
        {/* SECTION 1: RESTAURANT INFO CARD                                    */}
        {/* ------------------------------------------------------------------ */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Restaurant Information</h2>
          </div>
          <div className="divide-y divide-border">
            <InfoRow icon={Building2} label="Restaurant Name" value={restaurant.restaurantName} />
            <InfoRow icon={MapPin} label="Address" value={restaurant.address} />
            <InfoRow icon={MapPin} label="City" value={restaurant.city} />
            <InfoRow icon={Calendar} label="Created Date" value={format(new Date(restaurant.createdAt), 'MMMM d, yyyy h:mm a')} />
            <InfoRow icon={Calendar} label="Last Updated" value={format(new Date(restaurant.updatedAt), 'MMMM d, yyyy h:mm a')} />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 2: OWNER INFO CARD                                         */}
        {/* ------------------------------------------------------------------ */}
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Owner Information</h2>
          </div>
          <div className="divide-y divide-border">
            <InfoRow icon={User} label="Owner Name" value={restaurant.owner.fullName} />
            <InfoRow icon={Mail} label="Email Address" value={restaurant.owner.email} />
            <InfoRow icon={Phone} label="Phone Number" value={restaurant.owner.phoneNumber} />
            <InfoRow icon={User} label="Role" value={restaurant.owner.role} />
            <InfoRow icon={Calendar} label="Account Created Date" value={format(new Date(restaurant.owner.createdAt), 'MMMM d, yyyy h:mm a')} />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 3: VERIFICATION STATUS CARD                                */}
        {/* ------------------------------------------------------------------ */}
        <section className="overflow-hidden rounded-xl border border-border bg-card flex flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4">
            <FileCheck className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Verification Information</h2>
          </div>
          <div className="divide-y divide-border flex-1">
            {restaurant.verification ? (
              <>
                <div className="flex justify-between px-5 py-4">
                  <span className="text-sm text-muted-foreground">Approval Status</span>
                  <VerificationBadge status={restaurant.verification.approvalStatus} />
                </div>
                <InfoRow icon={Calendar} label="Submitted Date" value={format(new Date(restaurant.verification.submittedAt), 'MMM d, yyyy h:mm a')} />
                
                {restaurant.verification.contactedAt && (
                  <InfoRow icon={Calendar} label="Contacted Date" value={format(new Date(restaurant.verification.contactedAt), 'MMM d, yyyy h:mm a')} />
                )}

                {restaurant.verification.verifiedAt && (
                  <InfoRow icon={Calendar} label="Verified Date" value={format(new Date(restaurant.verification.verifiedAt), 'MMM d, yyyy h:mm a')} />
                )}
                
                {restaurant.verification.verifiedByAdmin && (
                  <InfoRow icon={User} label="Verified By" value={restaurant.verification.verifiedByAdmin.fullName} />
                )}

                {restaurant.verification.remarks && (
                  <div className="px-5 py-4">
                    <p className="mb-1 text-sm text-muted-foreground">Verification Remarks</p>
                    <div className="rounded-md bg-muted/50 p-3 text-sm text-foreground">
                      {restaurant.verification.remarks}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center px-5 py-8 text-center text-sm text-muted-foreground">
                No verification record found. (Legacy data)
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SECTION 4: STATUS HISTORY LOGS CARD                                */}
        {/* ------------------------------------------------------------------ */}
        <section className="overflow-hidden rounded-xl border border-border bg-card flex flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Status Timeline</h2>
          </div>
          
          {restaurant.statusLogs.length === 0 ? (
            <div className="flex h-full items-center justify-center px-5 py-8 text-center text-sm text-muted-foreground">
              No status changes recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border h-[350px] overflow-y-auto">
              {restaurant.statusLogs.map((log) => (
                <div key={log.id} className="px-5 py-4">
                  <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{log.changedByAdmin?.fullName ?? 'System'}</span>
                    </div>
                  </div>
                  <div className="mb-2 flex items-center gap-3">
                    <StatusBadge status={log.oldStatus} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <StatusBadge status={log.newStatus} />
                  </div>
                  <p className="text-sm text-foreground">{log.reason}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 5: QUICK STATISTICS                                        */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Quick Statistics</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Dining Tables" value={stats.totalTables} />
          <StatCard title="QR Codes" value={stats.totalQrCodes} />
          <StatCard title="Menu Categories" value={stats.totalMenuCategories} />
          <StatCard title="Menu Items" value={stats.totalMenuItems} />
          <StatCard title="Dining Sessions" value={stats.totalSessions} />
          <StatCard title="Total Orders" value={stats.totalOrders} />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 6: FUTURE MODULES                                          */}
      {/* ------------------------------------------------------------------ */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Future Modules</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <FutureModuleCard icon={Building2} title="Dining Tables" />
          <FutureModuleCard icon={QrCode} title="QR Codes" />
          <FutureModuleCard icon={UtensilsCrossed} title="Menu" />
          <FutureModuleCard icon={Receipt} title="Orders" />
          <FutureModuleCard icon={Users} title="Sessions" />
        </div>
      </section>

    </div>
  )
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------------

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const styles: Record<VerificationStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    CONTACTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    VERIFIED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  )
}

function FutureModuleCard({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center opacity-70">
      <Icon className="mb-2 h-6 w-6 text-muted-foreground" />
      <h3 className="mb-1 text-sm font-medium text-foreground">{title}</h3>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Coming in future phase</p>
    </div>
  )
}
