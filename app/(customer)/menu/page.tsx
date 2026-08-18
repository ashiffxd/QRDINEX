import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/services/customer/session.service'
import { getCustomerMenu } from '@/services/customer/menu.service'
import { CustomerMenuClient } from '@/components/customer/menu/CustomerMenuClient'
import { ParticipantsManager } from '@/components/customer/menu/ParticipantsManager'
import { FloatingCartButton } from '@/components/customer/cart/FloatingCartButton'
import { UtensilsCrossed, AlertTriangle, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import { getOrSetDeviceId } from '@/lib/auth/device'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Menu — QRDineX',
  description: 'View the restaurant menu.',
  robots: { index: false, follow: false },
}

export default async function CustomerMenuPage() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('dining_session')?.value

  if (!sessionToken) {
    return <ErrorState message="No active dining session found. Please scan the QR code at your table." />
  }

  const session = await getCurrentSession(sessionToken)

  if (!session) {
    return (
      <ErrorState message="Your session has expired or is invalid. Please scan the QR code at your table again." />
    )
  }

  if (session.status === 'COMPLETED' || session.status === 'CLOSED' || session.status === 'INVOICE_GENERATED') {
    redirect('/invoice')
  }

  // Double check device is an APPROVED participant
  const deviceId = await getOrSetDeviceId()
  const participant = await prisma.sessionParticipant.findUnique({
    where: {
      sessionId_deviceIdentifier: {
        sessionId: session.id,
        deviceIdentifier: deviceId,
      },
    },
  })

  if (!participant || participant.status !== 'APPROVED') {
    return (
      <ErrorState message="You are not authorized to view this menu. Please scan the table QR code and request to join." />
    )
  }

  const menu = await getCustomerMenu(session.restaurantId)
  const { restaurant, table } = session

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 sm:px-6">
      {/* Header */}
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm sm:mx-0 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold text-foreground">
              {restaurant.restaurantName}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
              Table {table.tableNumber}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            <IndianRupee className="h-4 w-4" />
          </Link>
          <ParticipantsManager />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-6">
        {menu.length === 0 ? (
          <div className="flex h-[50vh] flex-col items-center justify-center text-center">
            <UtensilsCrossed className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold text-foreground">Menu Empty</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              This restaurant hasn't added any items to their menu yet.
            </p>
          </div>
        ) : (
          <CustomerMenuClient initialCategories={menu} />
        )}
      </main>

      <FloatingCartButton />
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-6 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="mt-6 text-xl font-bold tracking-tight text-foreground">
          Session Error
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  )
}
