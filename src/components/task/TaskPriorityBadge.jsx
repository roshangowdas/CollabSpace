import React from 'react'
import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Flame,
  Minus,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

export function TaskPriorityBadge({ priority = 'medium', size = 'sm', className }) {
  const norm = (priority || 'medium').toLowerCase()

  const config = {
    urgent: {
      label: 'Urgent',
      variant: 'destructive',
      icon: Flame,
      className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold',
    },
    high: {
      label: 'High',
      variant: 'warning',
      icon: ArrowUp,
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium',
    },
    medium: {
      label: 'Medium',
      variant: 'brand',
      icon: Minus,
      className: 'bg-brand/10 text-brand border-brand/30 font-medium',
    },
    low: {
      label: 'Low',
      variant: 'secondary',
      icon: ArrowDown,
      className: 'bg-secondary text-muted-foreground border-border font-normal',
    },
  }[norm] || {
    label: priority,
    variant: 'secondary',
    icon: Minus,
    className: '',
  }

  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] border capitalize tracking-tight',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  )
}

