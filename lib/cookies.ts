/**
 * QRDineX — Generic Cookie Utilities (Legacy Re-export)
 * ==========================================================================
 * This file is kept for backwards compatibility only.
 * Auth-specific cookie operations have moved to '@/lib/auth/cookie'.
 *
 * All new code should import from '@/lib/auth' or '@/lib/auth/cookie' directly.
 * This file will be removed in a future cleanup pass.
 * ==========================================================================
 */

export { setAuthCookie as setCookie, getAuthCookie as getCookie, deleteAuthCookie as deleteCookie } from '@/lib/auth/cookie'
