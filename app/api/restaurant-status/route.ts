import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { RestaurantStatus } from '@prisma/client'

// Forces this route to be dynamically evaluated for every request (prevents static build caching)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, active: false, reason: 'missing_id' })
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!restaurant) {
      return NextResponse.json({ success: false, active: false, reason: 'not_found' })
    }

    const active = restaurant.status === RestaurantStatus.ACTIVE

    return NextResponse.json({ success: true, active })
  } catch (error) {
    console.error('[API Restaurant Status] Error:', error)
    return NextResponse.json({ success: false, active: false, reason: 'error' })
  }
}
