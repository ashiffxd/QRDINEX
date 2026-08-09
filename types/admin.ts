/**
 * QRDineX — Admin Types
 * ==========================================================================
 * Common types and enums used across the Super Admin module.
 * ==========================================================================
 */

import { RestaurantStatus } from '@prisma/client'

/**
 * Valid actions that a Super Admin can perform on a restaurant's lifecycle.
 */
export enum RestaurantAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
}

/**
 * API Request Payload for PATCH /api/admin/restaurants/:id/status
 */
export interface UpdateRestaurantStatusPayload {
  action: RestaurantAction
  remarks?: string
}

/**
 * Centralized State Machine Configuration
 * Defines valid transitions and resulting statuses.
 */
export const RESTAURANT_LIFECYCLE_STATE_MACHINE: Record<
  RestaurantStatus,
  Partial<Record<RestaurantAction, RestaurantStatus>>
> = {
  PENDING: {
    [RestaurantAction.APPROVE]: RestaurantStatus.ACTIVE,
    [RestaurantAction.REJECT]: RestaurantStatus.REJECTED,
  },
  ACTIVE: {
    [RestaurantAction.DEACTIVATE]: RestaurantStatus.INACTIVE,
  },
  INACTIVE: {
    [RestaurantAction.ACTIVATE]: RestaurantStatus.ACTIVE,
  },
  REJECTED: {}, // Terminal state, no actions allowed
}
