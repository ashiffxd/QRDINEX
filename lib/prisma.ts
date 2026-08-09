/**
 * QRDineX — Prisma Client Singleton
 * ==========================================================================
 * Provides a single shared PrismaClient instance across the entire Next.js
 * application. This pattern is required to prevent resource exhaustion from
 * multiple client instances being created during development Hot Module
 * Replacement (HMR) cycles.
 *
 * Pattern: globalThis singleton (recommended by Prisma for Next.js)
 * Reference: https://www.prisma.io/docs/guides/nextjs
 *
 * Usage:
 *   import prisma from '@/lib/prisma'
 *   const user = await prisma.user.findUnique({ where: { email } })
 * ==========================================================================
 */

import { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Environment guard
// ---------------------------------------------------------------------------
const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

// ---------------------------------------------------------------------------
// Client factory — called exactly once per process lifetime.
// Logging strategy:
//   development : query + error + warn + info (full visibility)
//   test        : error only (keep test output clean)
//   production  : error + warn (no query logging — performance + security)
// ---------------------------------------------------------------------------
const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient({
    log: isDev
      ? [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
          { level: 'info', emit: 'stdout' },
        ]
      : isTest
        ? [{ level: 'error', emit: 'stdout' }]
        : [
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ],
  })

  // -------------------------------------------------------------------------
  // Development-only: log all queries with duration.
  // Queries taking longer than SLOW_QUERY_THRESHOLD_MS are flagged as slow.
  // This surfaces N+1 query issues and missing indexes early in development.
  // -------------------------------------------------------------------------
  if (isDev) {
    const SLOW_QUERY_THRESHOLD_MS = 2000

  
    // This is safe and the officially documented event listener pattern.
    client.$on('query', (event: { query: string; params: string; duration: number }) => {
      const isSlow = event.duration >= SLOW_QUERY_THRESHOLD_MS
      const prefix = isSlow ? '🐢 [SLOW QUERY]' : '🔍 [Query]'
      console.log(`${prefix} ${event.duration}ms — ${event.query}`)
      if (isSlow) {
        console.warn(`   Params: ${event.params}`)
      }
    })
  }

  return client
}

// ---------------------------------------------------------------------------
// TypeScript: augment globalThis so TypeScript knows about the cached client.
// The `var` keyword is required here — `let`/`const` do not work in global
// declaration merging.
// ---------------------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// ---------------------------------------------------------------------------
// Singleton resolution:
//   Development / Test : reuse the cached global instance across HMR cycles.
//   Production         : globalThis.__prisma is never set — each module
//                        evaluation gets a fresh client, which is correct
//                        for serverless (cold start isolation).
// ---------------------------------------------------------------------------
const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient()

if (isDev || isTest) {
  globalThis.__prisma = prisma
}

export default prisma
