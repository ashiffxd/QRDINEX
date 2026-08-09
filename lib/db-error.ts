/**
 * QRDineX — Prisma Error Parser
 * ==========================================================================
 * Classifies Prisma runtime errors into structured, application-friendly
 * error objects. This prevents raw Prisma errors from leaking implementation
 * details into API responses and provides consistent error handling across
 * all Server Actions and Route Handlers.
 *
 * Usage:
 *   import { parsePrismaError, PrismaErrorCode } from '@/lib/db-error'
 *
 *   try {
 *     await prisma.user.create({ data })
 *   } catch (error) {
 *     const parsed = parsePrismaError(error)
 *     // parsed.code, parsed.message, parsed.field are safe to return
 *   }
 * ==========================================================================
 */

import { Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// Application-level error codes — map to HTTP status codes in Route Handlers
// ---------------------------------------------------------------------------
export const PrismaErrorCode = {
  UNIQUE_CONSTRAINT: 'UNIQUE_CONSTRAINT_VIOLATION',
  FOREIGN_KEY_CONSTRAINT: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  QUERY_TIMEOUT: 'QUERY_TIMEOUT',
  UNKNOWN: 'UNKNOWN_DATABASE_ERROR',
} as const

export type PrismaErrorCodeType = (typeof PrismaErrorCode)[keyof typeof PrismaErrorCode]

// ---------------------------------------------------------------------------
// Structured database error — safe to serialize and return in API responses
// ---------------------------------------------------------------------------
export interface ParsedDbError {
  /** Application-level error code — use for conditional logic in callers */
  code: PrismaErrorCodeType
  /** Human-readable message — safe for logging, NOT for direct UI display */
  message: string
  /**
   * The database field or model that caused the error, if known.
   * e.g. "email" for a unique constraint on users.email
   */
  field?: string
  /**
   * The original error — retained for server-side logging ONLY.
   * NEVER serialize this into an API response.
   */
  originalError: unknown
}

// ---------------------------------------------------------------------------
// Prisma P-code reference (subset used in QRDineX):
//   P2000 — Value too long for column type
//   P2001 — Record not found in WHERE clause
//   P2002 — Unique constraint failed
//   P2003 — Foreign key constraint failed
//   P2004 — Database constraint failed
//   P2011 — Null constraint violation
//   P2025 — Record required for the operation was not found
//   P1001 — Cannot reach database server
//   P1008 — Operations timed out
// ---------------------------------------------------------------------------
export function parsePrismaError(error: unknown): ParsedDbError {
  // -------------------------------------------------------------------------
  // Prisma client known request errors (most common in application code)
  // -------------------------------------------------------------------------
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint — extract the offending field name(s)
        const fields = error.meta?.target as string[] | string | undefined
        const fieldName = Array.isArray(fields) ? fields.join(', ') : (fields ?? 'unknown')
        return {
          code: PrismaErrorCode.UNIQUE_CONSTRAINT,
          message: `A record with this ${fieldName} already exists.`,
          field: fieldName,
          originalError: error,
        }
      }

      case 'P2003': {
        // Foreign key constraint — a referenced record does not exist
        const fieldName = (error.meta?.field_name as string) ?? 'unknown'
        return {
          code: PrismaErrorCode.FOREIGN_KEY_CONSTRAINT,
          message: `The referenced record for field "${fieldName}" does not exist or has been restricted.`,
          field: fieldName,
          originalError: error,
        }
      }

      case 'P2025':
      case 'P2001': {
        // Record not found — used when a specific record is required
        return {
          code: PrismaErrorCode.RECORD_NOT_FOUND,
          message: 'The requested record does not exist.',
          originalError: error,
        }
      }

      case 'P2011': {
        // Null constraint violation — required field was not provided
        const fieldName = (error.meta?.constraint as string) ?? 'unknown'
        return {
          code: PrismaErrorCode.REQUIRED_FIELD_MISSING,
          message: `Required field "${fieldName}" cannot be null.`,
          field: fieldName,
          originalError: error,
        }
      }

      case 'P1001': {
        return {
          code: PrismaErrorCode.CONNECTION_ERROR,
          message: 'Cannot connect to the database. Please try again later.',
          originalError: error,
        }
      }

      case 'P1008': {
        return {
          code: PrismaErrorCode.QUERY_TIMEOUT,
          message: 'The database operation timed out. Please try again.',
          originalError: error,
        }
      }

      default: {
        return {
          code: PrismaErrorCode.UNKNOWN,
          message: 'An unexpected database error occurred.',
          originalError: error,
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Prisma validation errors — bad query structure (developer error)
  // -------------------------------------------------------------------------
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      code: PrismaErrorCode.UNKNOWN,
      message: 'Invalid database query structure.',
      originalError: error,
    }
  }

  // -------------------------------------------------------------------------
  // Prisma initialization or connection errors
  // -------------------------------------------------------------------------
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      code: PrismaErrorCode.CONNECTION_ERROR,
      message: 'Failed to initialize the database connection.',
      originalError: error,
    }
  }

  // -------------------------------------------------------------------------
  // Unknown / non-Prisma error — re-wrap so callers always get a ParsedDbError
  // -------------------------------------------------------------------------
  return {
    code: PrismaErrorCode.UNKNOWN,
    message: 'An unexpected error occurred.',
    originalError: error,
  }
}

// ---------------------------------------------------------------------------
// Type guard — check if a parsed error is a specific code
// ---------------------------------------------------------------------------
export function isDbErrorCode(
  error: ParsedDbError,
  code: PrismaErrorCodeType,
): boolean {
  return error.code === code
}

// ---------------------------------------------------------------------------
// Map ParsedDbError codes to HTTP status codes for Route Handlers
// ---------------------------------------------------------------------------
export function dbErrorToHttpStatus(error: ParsedDbError): number {
  switch (error.code) {
    case PrismaErrorCode.RECORD_NOT_FOUND:
      return 404
    case PrismaErrorCode.UNIQUE_CONSTRAINT:
      return 409
    case PrismaErrorCode.FOREIGN_KEY_CONSTRAINT:
      return 422
    case PrismaErrorCode.REQUIRED_FIELD_MISSING:
      return 400
    case PrismaErrorCode.CONNECTION_ERROR:
    case PrismaErrorCode.QUERY_TIMEOUT:
      return 503
    default:
      return 500
  }
}
