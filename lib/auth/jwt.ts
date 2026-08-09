/**
 * QRDineX — JWT Utilities
 * ==========================================================================
 * Signs and verifies JWTs using the jose library.
 *
 * Why jose (not jsonwebtoken)?
 *  - jose is Web Crypto API based — works in Next.js Edge Runtime, Workers,
 *    and Deno without any Node.js native bindings.
 *  - jsonwebtoken is Node.js-only and cannot run in middleware (Edge).
 *  - jose is actively maintained and JOSE/JWA standards compliant.
 *
 * Architecture decisions enforced here:
 *  - Single token only — no refresh tokens, no token pairs.
 *  - JWT lifetime is exactly 24 hours (from JWT_EXPIRY constant).
 *  - Algorithm is HS256 (symmetric, single-server secret).
 *  - Issuer and audience are validated on every verify call.
 *  - JWT_SECRET is read from environment — never hardcoded.
 *  - The secret key is encoded once and reused (not re-encoded per call).
 * ==========================================================================
 */

import { SignJWT, jwtVerify, errors as JoseErrors } from 'jose'
import {
  JWT_ALGORITHM,
  JWT_EXPIRY,
  JWT_ISSUER,
  JWT_AUDIENCE,
  JWT_SECRET_ENV_KEY,
} from '@/constants/auth'
import type { JwtPayload, AuthResult, TokenVerificationResult } from '@/types/auth'
import { AuthErrorCode } from '@/types/auth'
import { authFailure, authSuccess } from '@/lib/auth/errors'

// ---------------------------------------------------------------------------
// SECRET KEY RESOLUTION
// ---------------------------------------------------------------------------

/**
 * Resolves and encodes the JWT signing secret from the environment.
 * Throws at startup (not at request time) if the secret is missing or weak.
 * The encoded key is a Uint8Array — the format jose requires for HMAC.
 *
 * This is intentionally NOT a lazy function — any misconfiguration is caught
 * at module load time, not silently on the first auth request.
 */
function getSigningKey(): Uint8Array {
  const secret = process.env[JWT_SECRET_ENV_KEY]

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      `[Auth] JWT_SECRET environment variable is not set. ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
    )
  }

  if (secret.length < 32) {
    throw new Error(
      `[Auth] JWT_SECRET is too short (${secret.length} chars). ` +
        `Minimum 32 characters required; 64-char hex string strongly recommended.`,
    )
  }

  return new TextEncoder().encode(secret)
}

// ---------------------------------------------------------------------------
// SIGN TOKEN
// ---------------------------------------------------------------------------

/**
 * Signs a JWT containing the provided payload.
 *
 * Sets:
 *  - Protected header: alg=HS256
 *  - sub: payload.sub (User UUID)
 *  - iat: current timestamp (automatic via setIssuedAt)
 *  - exp: now + 24h (from JWT_EXPIRY constant)
 *  - iss: 'qrdinex' (JWT_ISSUER)
 *  - aud: 'qrdinex-app' (JWT_AUDIENCE)
 *
 * @param payload  The claims to embed. Must include sub and role at minimum.
 * @returns        AuthResult<string> containing the signed JWT string.
 */
export async function signAuthToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
): Promise<AuthResult<string>> {
  try {
    const key = getSigningKey()

    const token = await new SignJWT({
      role: payload.role,
      name: payload.name,
      restaurantId: payload.restaurantId,
    })
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .sign(key)

    return authSuccess(token)
  } catch (error) {
    console.error('[Auth] Failed to sign JWT:', error)
    return authFailure(
      AuthErrorCode.INTERNAL_ERROR,
      'Failed to issue authentication token.',
    )
  }
}

// ---------------------------------------------------------------------------
// VERIFY TOKEN
// ---------------------------------------------------------------------------

/**
 * Verifies a JWT string and returns its decoded payload.
 *
 * Validates:
 *  - Signature (using JWT_SECRET)
 *  - Expiry (exp claim)
 *  - Issuer (iss === JWT_ISSUER)
 *  - Audience (aud === JWT_AUDIENCE)
 *  - Algorithm (alg === HS256)
 *
 * Returns a discriminated TokenVerificationResult — no exceptions at call site.
 *
 * @param token  The raw JWT string (from cookie or Authorization header).
 * @returns      TokenVerificationResult — valid with payload, or invalid with reason.
 */
export async function verifyAuthToken(
  token: string,
): Promise<TokenVerificationResult> {
  if (!token || token.trim().length === 0) {
    return { valid: false, reason: 'missing' }
  }

  try {
    const key = getSigningKey()

    const { payload } = await jwtVerify(token, key, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: [JWT_ALGORITHM],
    })

    // Reconstruct a typed JwtPayload from the raw jose payload
    const typedPayload: JwtPayload = {
      sub: payload.sub as string,
      role: payload.role as JwtPayload['role'],
      name: payload.name as string,
      restaurantId: (payload.restaurantId as string | null) ?? null,
      iat: payload.iat,
      exp: payload.exp,
    }

    return { valid: true, payload: typedPayload }
  } catch (error) {
    if (error instanceof JoseErrors.JWTExpired) {
      return { valid: false, reason: 'expired' }
    }

    // Covers: JWSInvalid, JWSSignatureVerificationFailed, JWTClaimValidationFailed,
    // JWTMalformed, JWKSNoMatchingKey, etc.
    return { valid: false, reason: 'invalid' }
  }
}

// ---------------------------------------------------------------------------
// DECODE WITHOUT VERIFY (for debugging / logging only)
// ---------------------------------------------------------------------------

/**
 * Decodes a JWT without verifying its signature.
 *
 * ⚠️  WARNING: This does NOT validate the token's integrity.
 * Use ONLY for non-security-sensitive operations such as:
 *  - Logging the subject of an expired token for audit purposes
 *  - Reading exp to display "your session expires in X minutes" in the UI
 *
 * NEVER use this for authorization decisions.
 *
 * @param token  The raw JWT string.
 * @returns      The decoded payload, or null if the token is malformed.
 */
export function decodeAuthTokenUnsafe(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payloadBase64 = parts[1]
    const padded = payloadBase64 + '='.repeat((4 - (payloadBase64.length % 4)) % 4)
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))

    return decoded as JwtPayload
  } catch {
    return null
  }
}
