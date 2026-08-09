'use client'

/**
 * QRDineX — useCustomerSocket Hook
 * ============================================================
 * Client-side hook for connecting to the /customer Socket.IO namespace.
 *
 * This hook provides the infrastructure for real-time customer-facing
 * notifications (e.g. session closed by owner, participant approved/rejected,
 * shared cart updates). It does NOT implement any business logic.
 *
 * What this hook provides:
 *  - Stable connection to the /customer namespace on mount
 *  - Connection status tracking
 *  - A typed event registration helper (on)
 *  - Automatic cleanup on unmount (disconnects socket)
 *
 * Authentication:
 *  withCredentials: true sends both cookies automatically:
 *    - dining_session  (identifies the active session)
 *    - qrd_device_id   (identifies the physical device/browser)
 *  The server validates both via a Prisma read in the namespace middleware.
 *  If validation fails (session expired, device not approved), onConnectError fires.
 *
 * When to mount:
 *  Only mount this hook in components rendered AFTER the customer has
 *  successfully started or joined a dining session (i.e. dining_session
 *  cookie is present). Mounting earlier will result in a connect_error.
 *
 * Usage:
 *   const { isConnected, on } = useCustomerSocket()
 *
 *   useEffect(() => {
 *     const off = on('session:closed', (payload) => {
 *       router.push('/goodbye')
 *     })
 *     return off
 *   }, [on])
 * ============================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import type {
  CustomerServerToClientEvents,
  CustomerClientToServerEvents,
} from '@/lib/socket/types'

// ============================================================
// TYPES
// ============================================================

export type CustomerSocket = Socket<
  CustomerServerToClientEvents,
  CustomerClientToServerEvents
>

export interface UseCustomerSocketOptions {
  /** Called when the socket successfully connects */
  onConnect?: () => void
  /** Called when the socket disconnects */
  onDisconnect?: (reason: string) => void
  /**
   * Called when the server rejects the connection.
   * Common causes: dining_session expired, device not approved,
   * or session was closed before the customer connected.
   */
  onConnectError?: (error: Error) => void
}

export interface UseCustomerSocketReturn {
  /** Whether the socket is currently connected and authenticated */
  isConnected: boolean
  /**
   * The raw socket instance. Null until the effect runs on mount.
   * Prefer using the on() helper over accessing socket directly.
   */
  socket: CustomerSocket | null
  /**
   * Registers a typed event listener on the customer socket.
   * Returns an unsubscribe function — always call it in useEffect cleanup.
   *
   * @example
   *   useEffect(() => {
   *     const off = on('participant:action_resolved', (payload) => { ... })
   *     return off
   *   }, [on])
   */
  on: <E extends keyof CustomerServerToClientEvents>(
    event: E,
    handler: CustomerServerToClientEvents[E],
  ) => () => void
}

// ============================================================
// HOOK
// ============================================================

export function useCustomerSocket(
  options: UseCustomerSocketOptions = {},
): UseCustomerSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<CustomerSocket | null>(null)

  // Keep options ref stable so the effect closure doesn't go stale
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  // ----------------------------------------------------------
  // SOCKET LIFECYCLE
  // Created once on mount. Destroyed on unmount.
  // ----------------------------------------------------------
  useEffect(() => {
    const socket: CustomerSocket = io('/customer', {
      withCredentials: true,        // Sends dining_session + qrd_device_id cookies
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2_000,
      reconnectionDelayMax: 10_000,
      reconnectionAttempts: 5,
      timeout: 10_000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      optionsRef.current.onConnect?.()
    })

    socket.on('disconnect', (reason) => {
      setIsConnected(false)
      optionsRef.current.onDisconnect?.(reason)
    })

    socket.on('connect_error', (error) => {
      console.warn('[useCustomerSocket] connect_error:', error.message)
      optionsRef.current.onConnectError?.(error)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.disconnect()
      socketRef.current = null
    }
  }, []) // Empty deps — connect once, cleanup on unmount

  // ----------------------------------------------------------
  // TYPED EVENT REGISTRATION
  // ----------------------------------------------------------
  const on = useCallback(
    <E extends keyof CustomerServerToClientEvents>(
      event: E,
      handler: CustomerServerToClientEvents[E],
    ): (() => void) => {
      const socket = socketRef.current

      if (!socket) {
        console.warn(`[useCustomerSocket] on('${String(event)}'): socket not ready`)
        return () => {}
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on(event as any, handler as any)

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.off(event as any, handler as any)
      }
    },
    [],
  )

  return {
    isConnected,
    socket: socketRef.current,
    on,
  }
}
