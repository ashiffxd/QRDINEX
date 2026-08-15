import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import {
  getRestaurantProfile,
  updateRestaurantProfile,
} from '@/services/owner/restaurant.service'

export async function GET() {
  try {
    const auth = await requireRole(['OWNER'])
    if (!auth.success || !auth.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getRestaurantProfile(auth.data.restaurantId)
    return NextResponse.json({ success: true, restaurant: profile })
  } catch (error: any) {
    console.error('[GET /api/owner/restaurant] Error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireRole(['OWNER'])
    if (!auth.success || !auth.data.restaurantId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { restaurantName, logoUrl, description, address, city, phone, email, sessionMode } = body

    if (restaurantName !== undefined && (typeof restaurantName !== 'string' || !restaurantName.trim())) {
      return NextResponse.json({ success: false, message: 'Restaurant name cannot be empty.' }, { status: 400 })
    }

    if (email && typeof email === 'string' && !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Invalid email address.' }, { status: 400 })
    }

    if (sessionMode !== undefined && sessionMode !== 'OPEN' && sessionMode !== 'APPROVAL') {
      return NextResponse.json({ success: false, message: 'Invalid session mode.' }, { status: 400 })
    }

    const updated = await updateRestaurantProfile(auth.data.restaurantId, {
      restaurantName,
      logoUrl,
      description,
      address,
      city,
      phone,
      email,
      sessionMode,
    })

    return NextResponse.json({ success: true, restaurant: updated })
  } catch (error: any) {
    console.error('[PATCH /api/owner/restaurant] Error:', error)
    if (error.message === 'INVALID_RESTAURANT_NAME') {
      return NextResponse.json({ success: false, message: 'Restaurant name cannot be empty.' }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
