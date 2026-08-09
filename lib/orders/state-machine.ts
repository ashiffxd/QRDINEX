import { OrderStatus, OrderAction } from '@prisma/client'

export interface StateTransition {
  action: OrderAction
  nextStatus: OrderStatus
  requiresRemarks: boolean
}

// Defines valid transitions from any given state
const STATUS_MACHINE: Record<OrderStatus, StateTransition[]> = {
  PLACED: [
    { action: 'ACCEPT', nextStatus: 'ACCEPTED', requiresRemarks: false },
    { action: 'START_PREPARING', nextStatus: 'PREPARING', requiresRemarks: false },
    { action: 'CANCEL', nextStatus: 'CANCELLED', requiresRemarks: true },
  ],
  ACCEPTED: [
    { action: 'START_PREPARING', nextStatus: 'PREPARING', requiresRemarks: false },
    { action: 'CANCEL', nextStatus: 'CANCELLED', requiresRemarks: true },
  ],
  PREPARING: [
    { action: 'MARK_READY', nextStatus: 'READY', requiresRemarks: false },
  ],
  READY: [
    { action: 'MARK_SERVED', nextStatus: 'SERVED', requiresRemarks: false },
  ],
  SERVED: [],
  COMPLETED: [],
  CANCELLED: [],
}

export function getValidTransitions(currentStatus: OrderStatus): StateTransition[] {
  return STATUS_MACHINE[currentStatus] || []
}

export function validateTransition(
  currentStatus: OrderStatus,
  action: OrderAction,
  remarks?: string
): { isValid: boolean; nextStatus?: OrderStatus; error?: string } {
  const transitions = getValidTransitions(currentStatus)
  const match = transitions.find((t) => t.action === action)

  if (!match) {
    return {
      isValid: false,
      error: `Invalid action '${action}' for current status '${currentStatus}'.`,
    }
  }

  if (match.requiresRemarks && (!remarks || remarks.trim().length === 0)) {
    return {
      isValid: false,
      error: `Remarks are required to perform the action '${action}'.`,
    }
  }

  return {
    isValid: true,
    nextStatus: match.nextStatus,
  }
}
