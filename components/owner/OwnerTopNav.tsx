'use client'

import { Menu, Store } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface OwnerTopNavProps {
  onMenuClick: () => void
  userFullName: string
  restaurantName: string
}

export function OwnerTopNav({ onMenuClick, userFullName, restaurantName }: OwnerTopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </button>
        
        {/* Restaurant Context Indicator */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1">
          <Store className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">{restaurantName}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-foreground">{userFullName}</p>
            <p className="text-xs text-muted-foreground capitalize">Owner</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {userFullName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
