'use client'

/**
 * QRDineX — Admin Layout Shell
 * ==========================================================================
 * Client wrapper that owns the mobile sidebar open/close state.
 * The parent layout.tsx (Server Component) renders this and passes
 * the admin name resolved from middleware headers.
 *
 * This pattern keeps the layout.tsx itself a Server Component while
 * allowing interactive sidebar toggling on the client.
 * ==========================================================================
 */

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopNav } from '@/components/admin/AdminTopNav'

interface AdminLayoutShellProps {
  children: React.ReactNode
  adminName: string
}

export function AdminLayoutShell({ children, adminName }: AdminLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopNav
          adminName={adminName}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
