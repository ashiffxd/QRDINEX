'use client'

import { useState } from 'react'
import { OwnerSidebar } from './OwnerSidebar'
import { OwnerTopNav } from './OwnerTopNav'

interface OwnerLayoutShellProps {
  children: React.ReactNode
  userFullName: string
  restaurantName: string
}

export function OwnerLayoutShell({ children, userFullName, restaurantName }: OwnerLayoutShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-muted/10">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Desktop (static) & Mobile (off-canvas) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <OwnerSidebar onClose={closeSidebar} />
      </aside>

      {/* Main Content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <OwnerTopNav 
          onMenuClick={toggleSidebar} 
          userFullName={userFullName} 
          restaurantName={restaurantName}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
