import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { OwnerLayoutShell } from '@/components/owner/OwnerLayoutShell'
import prisma from '@/lib/prisma'

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Enforce OWNER role
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success) {
    redirect('/login')
  }

  const { name: userFullName, restaurantId } = sessionResult.data

  // 2. We already know restaurantId must be present for OWNERs because middleware enforces it.
  //    But we need the restaurant name for the TopNav.
  if (!restaurantId) {
    redirect('/login?reason=missing_restaurant')
  }

  // 3. Fetch minimal restaurant info for layout display
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { restaurantName: true },
  })

  // If the restaurant was deleted or not found, redirect (middleware usually catches INACTIVE status)
  if (!restaurant) {
    redirect('/login?reason=account_inactive')
  }

  // 4. Render Shell
  return (
    <OwnerLayoutShell 
      userFullName={userFullName} 
      restaurantName={restaurant.restaurantName}
    >
      {children}
    </OwnerLayoutShell>
  )
}
