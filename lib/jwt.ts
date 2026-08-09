/**
 * QRDineX — JWT Utilities (Legacy Re-export)
 * ==========================================================================
 * This file is kept for backwards compatibility only.
 * The canonical JWT utilities have moved to '@/lib/auth/jwt'.
 *
 * All new code should import from '@/lib/auth' or '@/lib/auth/jwt' directly.
 * This file will be removed in a future cleanup pass.
 * ==========================================================================
 */

export { signAuthToken as signJwt, verifyAuthToken as verifyJwt } from '@/lib/auth/jwt'
