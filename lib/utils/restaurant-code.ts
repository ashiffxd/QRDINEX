/**
 * QRDineX — Restaurant Code Generator
 * ==========================================================================
 * Generates the public restaurant identifier (restaurantCode).
 *
 * Format: RST-XXXXXX
 *   - Prefix: "RST-" (always uppercase, fixed)
 *   - Suffix: 6 alphanumeric characters (uppercase A-Z, digits 0-9)
 *   - Example: RST-4H8K92, RST-XM03QA
 *
 * Design rules:
 *  - IMMUTABLE after creation — never changes for a restaurant.
 *  - Used in QR code URLs, support tickets, and public-facing pages.
 *  - Globally unique — enforced by @unique constraint in the DB schema.
 *  - Generated server-side only — never by the client.
 *  - Collision handling: retry up to MAX_RETRIES times if the generated
 *    code is already taken (extremely unlikely with 36^6 = ~2.17B combinations).
 *
 * Character set: A-Z + 0-9 (excludes ambiguous characters O,0,I,1 for
 * human readability in printed materials and support contexts).
 * ==========================================================================
 */

import prisma from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PREFIX = 'RST-' as const

/**
 * Unambiguous character set — excludes O (looks like 0) and I (looks like 1).
 * 32 characters × 6 positions = 1,073,741,824 combinations.
 */
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' as const

const CODE_LENGTH = 6 as const
const MAX_RETRIES = 10 as const

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Generates a random 6-character suffix using the unambiguous character set.
 */
function generateSuffix(): string {
  let result = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return result
}

/**
 * Generates a unique restaurant code in RST-XXXXXX format.
 *
 * Checks the database to ensure uniqueness before returning.
 * Retries up to MAX_RETRIES times on collision.
 *
 * @throws Error if a unique code cannot be generated after MAX_RETRIES attempts.
 *         This should never happen in practice with a non-saturated namespace.
 */
export async function generateRestaurantCode(): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const code = `${PREFIX}${generateSuffix()}`

    const existing = await prisma.restaurant.findUnique({
      where: { restaurantCode: code },
      select: { id: true },
    })

    if (!existing) {
      return code
    }

    console.warn(
      `[generateRestaurantCode] Collision on attempt ${attempt}: ${code}. Retrying...`,
    )
  }

  throw new Error(
    `[generateRestaurantCode] Failed to generate a unique restaurant code after ${MAX_RETRIES} attempts. ` +
      `This indicates an extremely rare collision or a saturated namespace.`,
  )
}
