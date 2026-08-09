import { Metadata } from 'next'
import { validateQrToken, QRErrorType } from '@/services/customer/qr-entry.service'
import { QrCode, Clock, Store, AlertTriangle, UtensilsCrossed } from 'lucide-react'
import { StartDiningButton } from '@/components/customer/StartDiningButton'
import { JoinSessionClient } from '@/components/customer/JoinSessionClient'
import prisma from '@/lib/prisma'
import { getOrSetDeviceId } from '@/lib/auth/device'
import { redirect } from 'next/navigation'

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: 'Scan QR — QRDineX',
  description: 'Enter the QRDineX digital menu.',
  // Prevent indexing of temporary QR entry URLs
  robots: {
    index: false,
    follow: false,
  }
}

interface QrEntryPageProps {
  params: Promise<{ token: string }>
}

// ---------------------------------------------------------------------------
// Page Component (Server Component)
// ---------------------------------------------------------------------------
export default async function QrEntryPage({ params }: QrEntryPageProps) {
  // Await params object required in Next.js 15
  const resolvedParams = await params
  const { token } = resolvedParams

  const result = await validateQrToken(token)

  if (!result.success || !result.data) {
    return <ErrorState error={result.error!} />
  }

  // Check for an active session
  const activeSession = await prisma.diningSession.findFirst({
    where: {
      tableId: result.data.tableId,
      status: 'OPEN',
    },
  })

  let hasActiveSession = false
  let participantStatus: 'NOT_REQUESTED' | 'PENDING' | 'REJECTED' = 'NOT_REQUESTED'

  if (activeSession) {
    hasActiveSession = true
    const deviceId = await getOrSetDeviceId()
    const participant = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_deviceIdentifier: {
          sessionId: activeSession.id,
          deviceIdentifier: deviceId,
        },
      },
    })

    if (participant) {
      if (participant.status === 'APPROVED') {
        // Automatically set cookie if missing, and redirect
        redirect('/menu')
      } else {
        participantStatus = participant.status
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
        </div>
        
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
          Welcome to
          <br />
          <span className="text-primary">{result.data.restaurantName}</span>
        </h1>
        
        <div className="mt-4 inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
          Table {result.data.tableNumber}
        </div>

        {hasActiveSession ? (
          <JoinSessionClient token={token} initialStatus={participantStatus} />
        ) : (
          <StartDiningButton token={token} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error States Component
// ---------------------------------------------------------------------------
function ErrorState({ error }: { error: QRErrorType }) {
  let title = 'Something went wrong'
  let message = 'Please ask a staff member for assistance.'
  let Icon = AlertTriangle
  let iconColorClass = 'text-amber-500'
  let iconBgClass = 'bg-amber-50 dark:bg-amber-500/10'

  switch (error) {
    case 'INVALID_QR':
      title = 'Invalid QR Code'
      message = "We couldn't recognize this QR code. Please ask a staff member for the correct one."
      Icon = QrCode
      iconColorClass = 'text-destructive'
      iconBgClass = 'bg-destructive/10'
      break
    case 'QR_INACTIVE':
      title = 'QR Code Expired'
      message = 'This QR code is no longer active. A new one has been generated for this table.'
      Icon = Clock
      iconColorClass = 'text-amber-500'
      iconBgClass = 'bg-amber-50 dark:bg-amber-500/10'
      break
    case 'RESTAURANT_INACTIVE':
      title = 'Restaurant Unavailable'
      message = 'This restaurant is currently not accepting orders through QRDineX. Please order directly with staff.'
      Icon = Store
      iconColorClass = 'text-slate-500 dark:text-slate-400'
      iconBgClass = 'bg-slate-100 dark:bg-slate-800'
      break
    case 'TABLE_UNAVAILABLE':
      title = 'Table Unavailable'
      message = 'This table is currently marked as out of service. Please ask staff for assistance.'
      Icon = AlertTriangle
      iconColorClass = 'text-amber-500'
      iconBgClass = 'bg-amber-50 dark:bg-amber-500/10'
      break
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconBgClass}`}>
          <Icon className={`h-8 w-8 ${iconColorClass}`} />
        </div>
        
        <h1 className="mt-6 text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  )
}
