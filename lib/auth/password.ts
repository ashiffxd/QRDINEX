/**
 * QRDineX — Password Utilities
 * ==========================================================================
 * All password operations: hashing, verification, and strength validation.
 *
 * Library: bcryptjs (pure JS, no native bindings — works in all environments
 * including Next.js Edge Runtime if needed in future).
 *
 * Rules enforced here:
 *  - Raw passwords are NEVER logged or stored.
 *  - Cost factor is read from constants — never hardcoded inline.
 *  - max length is enforced to prevent bcrypt's 72-byte truncation issue.
 *  - All functions return typed results — no raw throws at call sites.
 * ==========================================================================
 */

import bcrypt from 'bcryptjs'
import {
  BCRYPT_COST_FACTOR,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '@/constants/auth'
import type { AuthResult, PasswordValidationResult } from '@/types/auth'
import { AuthErrorCode } from '@/types/auth'
import { authFailure, authSuccess } from '@/lib/auth/errors'

// ---------------------------------------------------------------------------
// HASH PASSWORD
// ---------------------------------------------------------------------------

/**
 * Hashes a plain-text password using bcrypt.
 *
 * - Uses BCRYPT_COST_FACTOR (12) — the production-safe minimum.
 * - Returns a typed AuthResult — callers never need try/catch.
 * - The plain-text password is NEVER stored or logged.
 *
 * @param plainPassword  The raw password from the user's input form.
 * @returns              AuthResult<string> containing the bcrypt hash.
 */
export async function hashPassword(
  plainPassword: string,
): Promise<AuthResult<string>> {
  try {
    if (plainPassword.length > PASSWORD_MAX_LENGTH) {
      return authFailure(
        AuthErrorCode.WEAK_PASSWORD,
        `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`,
      )
    }

    const hash = await bcrypt.hash(plainPassword, BCRYPT_COST_FACTOR)
    return authSuccess(hash)
  } catch {
    return authFailure(
      AuthErrorCode.INTERNAL_ERROR,
      'Failed to hash password due to an internal error.',
    )
  }
}

// ---------------------------------------------------------------------------
// VERIFY PASSWORD
// ---------------------------------------------------------------------------

/**
 * Compares a plain-text password against a stored bcrypt hash.
 *
 * - Uses bcrypt's timing-safe compare — not a string comparison.
 * - Returns true only if the password matches AND the hash is valid bcrypt.
 * - Returns false for any mismatch, including malformed hashes.
 *
 * @param plainPassword   The raw password from the user's login form.
 * @param hashedPassword  The bcrypt hash stored in the database.
 * @returns               AuthResult<boolean> — true if match, false if not.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<AuthResult<boolean>> {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
    return authSuccess(isMatch)
  } catch {
    // bcrypt.compare throws if the hash is malformed — treat as no-match
    // to prevent hash-format oracle attacks.
    return authSuccess(false)
  }
}

// ---------------------------------------------------------------------------
// VALIDATE PASSWORD STRENGTH
// ---------------------------------------------------------------------------

/**
 * Validates a plain-text password against QRDineX strength requirements.
 *
 * Requirements:
 *  - Minimum 8 characters
 *  - Maximum 72 characters (bcrypt hard limit)
 *  - At least one uppercase letter (A-Z)
 *  - At least one lowercase letter (a-z)
 *  - At least one digit (0-9)
 *  - At least one special character (!@#$%^&* etc.)
 *
 * This is a pure validation function — it does NOT hash the password.
 * Call this before hashPassword() to give early feedback.
 *
 * @param password  The raw password to validate.
 * @returns         PasswordValidationResult with all failing rules listed.
 */
export function validatePasswordStrength(
  password: string,
): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`)
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`)
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.')
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character.')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ---------------------------------------------------------------------------
// CHECK IF SAME PASSWORD
// ---------------------------------------------------------------------------

/**
 * Checks whether a new plain-text password matches the currently stored hash.
 * Used during password change to enforce the "new password must differ" rule.
 *
 * @param newPlainPassword   The new password being set.
 * @param currentHashedPassword  The current bcrypt hash stored in the DB.
 * @returns  true if the new password is the same as the current one.
 */
export async function isSamePassword(
  newPlainPassword: string,
  currentHashedPassword: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(newPlainPassword, currentHashedPassword)
  } catch {
    return false
  }
}
