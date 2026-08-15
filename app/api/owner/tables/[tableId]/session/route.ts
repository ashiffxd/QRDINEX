/**
 * POST   /api/owner/tables/[tableId]/session  — Owner manually opens a table session
 * DELETE /api/owner/tables/[tableId]/session  — Owner closes the active session (Table Panel toggle OFF)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import prisma from '@/lib/prisma'
import {
  ownerCloseSession,
  ownerApproveSession,
} from '@/services/customer/session.service'
import { socketEmitter } from '@/lib/socket'
import { SESSION_EVENTS } from '@/lib/socket/events'
import crypto from 'crypto'
import { SessionStatus, DiningTableStatus, OwnerApprovalStatus, ParticipantRole } from '@prisma/client'

interface RouteParams {
  params: Promise<{ tableId: string }>
}

// ---------------------------------------------------------------------------
// POST — Owner manually opens a table session (toggle OFF → ON)
// Used when owner wants to pre-open a table (e.g. large booking)
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

    // Check no active session already exists
    const existingSession = await prisma.diningSession.findFirst({
      where: {
        tableId,
        status: { in: [SessionStatus.PENDING, SessionStatus.OPEN, SessionStatus.BILL_REQUESTED] },
      },
    })

    if (existingSession) {
      return NextResponse.json(
        { success: false, code: 'SESSION_ALREADY_ACTIVE', message: 'Table already has an active session.' },
        { status: 409 }
      )
    }

    // Get the active QR code for this table
    const qrCode = await prisma.qrCode.findFirst({
      where: { tableId, isActive: true },
    })

    if (!qrCode) {
      return NextResponse.json(
        { success: false, code: 'NO_QR_CODE', message: 'No active QR code found for this table.' },
        { status: 400 }
      )
    }

    // Create a manually-opened session (always APPROVED — owner initiated)
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.diningSession.create({
        data: {
          restaurantId,
          tableId,
          qrCodeId: qrCode.id,
          sessionToken: crypto.randomBytes(32).toString('hex'),
          status: SessionStatus.OPEN,
          ownerApproval: OwnerApprovalStatus.APPROVED,
          startedAt: new Date(),
        },
      })

      await tx.diningTable.update({
        where: { id: tableId },
        data: { status: DiningTableStatus.OCCUPIED },
      })

      return newSession
    })

    // Emit to owner namespace (so other owner tabs update)
    socketEmitter.emitToRestaurant(restaurantId, SESSION_EVENTS.NEW, {
      sessionId: session.id,
      shortId: session.id.split('-')[0].toUpperCase(),
      tableNumber: table.tableNumber,
      startedAt: session.startedAt?.toISOString() ?? new Date().toISOString(),
    })

    return NextResponse.json({ success: true, data: { sessionId: session.id } }, { status: 201 })
  } catch (error) {
    console.error('[owner/tables/session POST]', error)
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// DELETE — Owner closes the active session (toggle ON → OFF)
// This is the ONLY way a session can be closed.
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
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
      include: { restaurant: true },
    })

    if (!table) {
      return NextResponse.json({ success: false, code: 'TABLE_NOT_FOUND' }, { status: 404 })
    }

    // Find the active session for this table
    const activeSession = await prisma.diningSession.findFirst({
      where: {
        tableId,
        status: {
          in: [SessionStatus.PENDING, SessionStatus.OPEN, SessionStatus.BILL_REQUESTED, SessionStatus.INVOICE_GENERATED],
        },
      },
    })

    if (!activeSession) {
      return NextResponse.json(
        { success: false, code: 'NO_ACTIVE_SESSION', message: 'No active session found for this table.' },
        { status: 404 }
      )
    }

    // Close the session
    await ownerCloseSession(activeSession.id, userId)

    // Notify customers in the session that it has been closed
    socketEmitter.emitToSession(activeSession.id, SESSION_EVENTS.CLOSED, {
      sessionId: activeSession.id,
      shortId: activeSession.id.split('-')[0].toUpperCase(),
      tableNumber: table.tableNumber,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[owner/tables/session DELETE]', error)
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
