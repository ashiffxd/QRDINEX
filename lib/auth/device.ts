import { cookies, headers } from 'next/headers'
import crypto from 'crypto'

const DEVICE_COOKIE_NAME = 'qrd_device_id'

/**
 * Ensures the requesting device has a unique identifier cookie.
 * This is used to track participants within a single Dining Session.
 * @returns The device identifier string.
 */
export async function getOrSetDeviceId(): Promise<string> {
  const cookieStore = await cookies()
  let deviceId = cookieStore.get(DEVICE_COOKIE_NAME)?.value

  if (!deviceId) {
    // Generate a new URL-safe random device ID
    deviceId = crypto.randomBytes(16).toString('hex')
    
    // Dynamically check if accessing via local IP or localhost to allow HTTP cookies during local phone testing
    const headersList = await headers()
    const host = headersList.get('host') || ''
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')
    const secure = process.env.NODE_ENV === 'production' && !isLocal

    cookieStore.set({
      name: DEVICE_COOKIE_NAME,
      value: deviceId,
      httpOnly: true,
      path: '/',
      secure,
      sameSite: 'lax',
      // Very long expiration - identifies the physical browser
      maxAge: 60 * 60 * 24 * 365, 
    })
  }

  return deviceId
}

/**
 * Gets the current device ID if it exists, otherwise returns null.
 */
export async function getDeviceId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(DEVICE_COOKIE_NAME)?.value || null
}
