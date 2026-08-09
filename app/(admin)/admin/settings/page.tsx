import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { 
  Settings, 
  Database, 
  Activity, 
  Server, 
  Code,
  CheckCircle2,
  XCircle,
  User
} from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'System Settings — QRDineX Admin',
}

export default async function AdminSettingsPage() {
  const sessionResult = await requireRole(['SUPER_ADMIN'])
  
  if (!sessionResult.success) {
    redirect('/login')
  }

  // Perform a simple health check query
  let dbStatus = 'Disconnected'
  let dbLatency = 0
  
  try {
    const start = performance.now()
    await prisma.$queryRaw`SELECT 1`
    const end = performance.now()
    dbLatency = Math.round(end - start)
    dbStatus = 'Connected'
  } catch (e) {
    dbStatus = 'Disconnected'
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View high-level system information and database health.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Application Information */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Application Info</h2>
          </div>
          <div className="divide-y divide-border">
            <InfoRow icon={Code} label="Application Name" value="QRDineX" />
            <InfoRow icon={Server} label="Current Environment" value={process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} badge />
            <InfoRow icon={Activity} label="Application Version" value="v1.0.0 (Phase 4)" />
            <InfoRow icon={User} label="Current Logged-in User" value={sessionResult.data.name} />
          </div>
        </section>

        {/* Database Health */}
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm h-fit">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-4">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Database Health</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-border bg-muted/10">
              {dbStatus === 'Connected' ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-xl font-bold text-foreground">Healthy</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Database is connected and responding.</p>
                  <p className="mt-3 inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono text-muted-foreground">
                    Latency: {dbLatency}ms
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-foreground">Unavailable</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Cannot establish connection to the database.</p>
                </>
              )}
            </div>
            
            <p className="mt-6 text-xs text-center text-muted-foreground leading-relaxed">
              These settings are strictly informational. Advanced system configuration, feature flags, 
              and global platform policies will be implemented in future iterations of the QRDineX administrative suite.
            </p>
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
          <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
            {value}
          </span>
        ) : (
          <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
        )}
      </div>
    </div>
  )
}
