/**
 * QRDineX — Socket.IO Room Name Utilities
 * ============================================================
 * Centralizes all room name generation.
 *
 * Rules enforced by convention:
 *  - No hardcoded room name strings are permitted outside this file.
 *  - All namespaces, emitters, and hooks must derive room names
 *    using these functions.
 *
 * Naming conventions:
 *  restaurant:{restaurantId} — Owner namespace rooms.
 *    All authenticated owner clients for a restaurant join this room.
 *    Events emitted here are visible to all owner dashboard tabs/devices.
 *
 *  session:{sessionId} — Customer namespace rooms.
 *    All approved participants of a dining session join this room.
 *    Events emitted here are visible to all devices at the same table.
 *
 *  user:{userId} — Reserved for future direct-user notifications.
 * ============================================================
 */

/**
 * Generates the owner namespace room name for a restaurant.
 * All owner sockets for this restaurant join this room on connect.
 *
 * @param restaurantId  UUID of the restaurant.
 * @returns Room name string, e.g. "restaurant:a1b2c3d4-e5f6-..."
 */
export function restaurantRoom(restaurantId: string): string {
  return `restaurant:${restaurantId}`
}

/**
 * Generates the customer namespace room name for a dining session.
 * All approved participant sockets for this session join this room on connect.
 *
 * @param sessionId  UUID of the dining session.
 * @returns Room name string, e.g. "session:e5f6g7h8-a1b2-..."
 */
export function sessionRoom(sessionId: string): string {
  return `session:${sessionId}`
}

/**
 * Generates a direct user room name for targeted, single-recipient notifications.
 * Reserved for future use — e.g. notifying a specific Super Admin.
 *
 * @param userId  UUID of the target user.
 * @returns Room name string, e.g. "user:c3d4e5f6-..."
 */
export function userRoom(userId: string): string {
  return `user:${userId}`
}
