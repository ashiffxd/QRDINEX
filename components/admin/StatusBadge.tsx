/**
 * QRDineX — Restaurant Status Badge
 * Consistent status indicator used across all admin tables and cards.
 */

import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  ACTIVE: {
    label: 'Active',
    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  PENDING: {
    label: 'Pending',
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  INACTIVE: {
    label: 'Inactive',
    classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  REJECTED: {
    label: 'Rejected',
    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_STYLES[status] ?? { label: status, classes: 'bg-muted text-muted-foreground' }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.classes,
      )}
    >
      {config.label}
    </span>
  )
}
