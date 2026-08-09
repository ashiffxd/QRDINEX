/**
 * QRDineX — Admin Stats Card
 * A server-renderable stats card used on the admin dashboard.
 */

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  description?: string
  colorClass: string      // Tailwind classes for icon container bg + text
  trend?: string          // Optional trend label (future use)
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  colorClass,
}: StatsCardProps) {
  return (
    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {value.toLocaleString()}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
}
