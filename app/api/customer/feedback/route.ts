import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { FeedbackRating } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('dining_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'No active session found.' }, { status: 401 })
    }

    const session = await prisma.diningSession.findUnique({
      where: { sessionToken }
    })

    if (!session) {
      return NextResponse.json({ success: false, message: 'Invalid or expired session.' }, { status: 400 })
    }

    const body = await req.json()
    const { restaurantRating, qrdinexRating } = body

    const validRatings = Object.values(FeedbackRating)
    if (!validRatings.includes(restaurantRating) || !validRatings.includes(qrdinexRating)) {
      return NextResponse.json({ success: false, message: 'Invalid rating option.' }, { status: 400 })
    }

    // Try to find the most recent order in this session to link (optional)
    const latestOrder = await prisma.order.findFirst({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    })

    const newFeedback = await prisma.feedback.create({
      data: {
        restaurantId: session.restaurantId,
        orderId: latestOrder?.id || null,
        restaurantRating,
        qrdinexRating
      }
    })

    return NextResponse.json({ success: true, data: newFeedback })
  } catch (error) {
    console.error('[Feedback API] Error creating feedback:', error)
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 })
  }
}
