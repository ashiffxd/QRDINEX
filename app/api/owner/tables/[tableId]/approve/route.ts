/**
 * POST   /api/owner/tables/[tableId]/approve  — Owner approves a PENDING session request
 * DELETE /api/owner/tables/[tableId]/approve  — Owner rejects a PENDING session request
 *
 * Only relevant when restaurant.sessionMode = APPROVAL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import { ownerApproveSession, ownerRejectSession } from '@/services/customer/session.service'
import { socketEmitter } from '@/lib/socket'
import { SESSION_EVENTS } from '@/lib/socket/events'
import { SessionStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ tableId: string }>
}

// ---------------------------------------------------------------------------
// POST — Owner approves the pending session request for this table
// ---------------------------------------------------------------------------

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { tableId } = await params
  const { restaurantId, userId } = sessionResult.data

  try {
    // Verify table belongs to this restaurant
    const table = await prisma.diningTable.findFirst({
      where: { id: tableId, restaurantId },
    })

    if (!table) {
      return NextResponse.json({ success: false, code: 'TABLE_NOT_FOUND' }, { status: 404 })
    }

    // Find the PENDING session
    const pendingSession = await prisma.diningSession.findFirst({
      where: {
        tableId,
        status: SessionStatus.PENDING,
        ownerApproval: 'PENDING',
      },
    })

    if (!pendingSession) {
      return NextResponse.json(
        { success: false, code: 'NO_PENDING_SESSION', message: 'No pending session found for this table.' },
        { status: 404 }
      )
    }

    // Approve the session
    const approved = await ownerApproveSession(pendingSession.id, userId)

    // Notify the customer's browser — they are waiting on the approval screen
    socketEmitter.emitToSession(pendingSession.id, SESSION_EVENTS.OWNER_APPROVED, {
      sessionId: pendingSession.id,
      sessionToken: approved.sessionToken,
    })

    // Also notify all owner tabs that session is now active
    socketEmitter.emitToRestaurant(restaurantId, SESSION_EVENTS.NEW, {
      sessionId: approved.id,
      shortId: approved.id.split('-')[0].toUpperCase(),
      tableNumber: table.tableNumber,
      startedAt: approved.startedAt?.toISOString() ?? new Date().toISOString(),
    })

    return NextResponse.json({ success: true, data: { sessionId: approved.id } })
  } catch (error) {
    console.error('[owner/tables/approve POST]', error)
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — Owner rejects the pending session request for this table
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const sessionResult = await requireRole(['OWNER'])
  if (!sessionResult.success || !sessionResult.data.restaurantId) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { tableId } = await params
  const { restaurantId, userId } = sessionResult.data

  try {
    const table = await prisma.diningTable.findFirst({
      where: { id: tableId, restaurantId },
    })

    if (!table) {
      return NextResponse.json({ success: false, code: 'TABLE_NOT_FOUND' }, { status: 404 })
    }

    const pendingSession = await prisma.diningSession.findFirst({
      where: {
        tableId,
        status: SessionStatus.PENDING,
        ownerApproval: 'PENDING',
      },
    })

    if (!pendingSession) {
      return NextResponse.json(
        { success: false, code: 'NO_PENDING_SESSION' },
        { status: 404 }
      )
    }

    // Reject the session
    await ownerRejectSession(pendingSession.id, userId)

    // Notify customer they were rejected
    socketEmitter.emitToSession(pendingSession.id, SESSION_EVENTS.OWNER_REJECTED, {
      sessionId: pendingSession.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[owner/tables/approve DELETE]', error)
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
