'use client'

/**
 * QRDineX — useOwnerSocket Hook
 * ============================================================
 * Client-side hook for connecting to the /owner Socket.IO namespace.
 *
 * This hook provides the infrastructure for real-time owner dashboard
 * updates. It does NOT implement any business logic.
 *
 * What this hook provides:
 *  - Stable connection to the /owner namespace on mount
 *  - Connection status tracking
 *  - A typed event registration helper (on)
 *  - Automatic cleanup on unmount (disconnects socket)
 *
 * What this hook does NOT do:
 *  - Modify application state
 *  - Fetch data
 *  - Contain business logic
 *
 * Authentication:
 *  withCredentials: true sends the qrdinex_auth JWT cookie automatically.
 *  If the server rejects the connection (invalid/expired token), the hook
 *  calls onConnectError and stops reconnecting after reconnectionAttempts.
 *
 * Usage:
 *   const { isConnected, on } = useOwnerSocket()
 *
 *   useEffect(() => {
 *     const off = on('order:new', (payload) => {
 *       // handle new order notification
 *     })
 *     return off // always clean up
 *   }, [on])
 * ============================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import type {
  OwnerServerToClientEvents,
  OwnerClientToServerEvents,
} from '@/lib/socket/types'

// ============================================================
// TYPES
// ============================================================

export type OwnerSocket = Socket<OwnerServerToClientEvents, OwnerClientToServerEvents>

export interface UseOwnerSocketOptions {
  /** Called when the socket successfully connects or reconnects */
  onConnect?: () => void
  /** Called when the socket disconnects for any reason */
  onDisconnect?: (reason: string) => void
  /**
   * Called when the server rejects the connection.
   * This fires on auth failures (expired/invalid JWT) and network errors.
   * The socket will attempt reconnection automatically until reconnectionAttempts
   * is exhausted. Set onConnectError to show a UI warning if needed.
   */
  onConnectError?: (error: Error) => void
}

export interface UseOwnerSocketReturn {
  /** Whether the socket is currently connected and authenticated */
  isConnected: boolean
  /**
   * The raw socket instance. Null until the effect runs on mount.
   * Prefer using the on() helper over accessing socket directly.
   */
  socket: OwnerSocket | null
  /**
   * Registers a typed event listener on the owner socket.
   * Returns an unsubscribe function — always call it in useEffect cleanup.
   *
   * @example
   *   useEffect(() => {
   *     const off = on('order:new', (payload) => { ... })
   *     return off
   *   }, [on])
   */
  on: <E extends keyof OwnerServerToClientEvents>(
    event: E,
    handler: OwnerServerToClientEvents[E],
  ) => () => void
}

// ============================================================
// HOOK
// ============================================================

export function useOwnerSocket(
  options: UseOwnerSocketOptions = {},
): UseOwnerSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<OwnerSocket | null>(null)

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
    // Connect to the /owner namespace on the same origin.
    // The empty-string base URL means "same host as the page".
    const socket: OwnerSocket = io('/owner', {
      withCredentials: true,        // Sends qrdinex_auth cookie in handshake
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
      // Auth rejections and network errors arrive here.
      // Not re-thrown — socket infrastructure failures must not crash the UI.
      console.warn('[useOwnerSocket] connect_error:', error.message)
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
    <E extends keyof OwnerServerToClientEvents>(
      event: E,
      handler: OwnerServerToClientEvents[E],
    ): (() => void) => {
      const socket = socketRef.current

      if (!socket) {
        // Socket not yet initialized (called before effect runs — very unusual).
        console.warn(`[useOwnerSocket] on('${String(event)}'): socket not ready`)
        return () => {}
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on(event as any, handler as any)

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.off(event as any, handler as any)
      }
    },
    [], // socketRef is stable — safe to use in deps-free callback
  )

  return {
    isConnected,
    socket: socketRef.current,
    on,
  }
}
