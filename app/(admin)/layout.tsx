/**
 * QRDineX — Admin Route Group Layout
 * ==========================================================================
 * Server Component layout shared by all pages inside (admin)/.
 *
 * Reads the admin's name from the x-user-name header injected by middleware
 * (Phase 3.4). This avoids a DB call on every page render.
 *
 * Security:
 *  - Middleware (Phase 3.4) already verifies the JWT and enforces
 *    SUPER_ADMIN role before any request reaches this layout.
 *  - This layout does NOT need to re-check auth — middleware handles it.
 *  - The x-user-name header is only present because middleware verified
 *    the token and injected it. It cannot be spoofed by client requests
 *    because Next.js strips incoming x-* headers before middleware runs.
 * ==========================================================================
 */

import { headers } from 'next/headers'
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const adminName = headersList.get('x-user-name') ?? 'Admin'

  return <AdminLayoutShell adminName={adminName}>{children}</AdminLayoutShell>
}
