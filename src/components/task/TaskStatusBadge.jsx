import React from 'react'
import {
  Circle,
  PlayCircle,
  Eye,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { cn } from '@/utils/cn'

export function TaskStatusBadge({ status = 'todo', size = 'sm', className }) {
  const norm = (status || 'todo').toLowerCase()

  const config = {
    todo: {
      label: 'Todo',
      icon: Circle,
      className: 'bg-secondary/80 text-muted-foreground border-border',
    },
    in_progress: {
      label: 'In Progress',
      icon: PlayCircle,
      className: 'bg-brand/10 text-brand border-brand/30 font-medium',
    },
    in_review: {
      label: 'In Review',
      icon: Eye,
      className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-medium',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle2,
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium',
    },
    done: {
      label: 'Completed',
      icon: CheckCircle2,
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium',
    },
  }[norm] || {
    label: status.replace('_', ' '),
    icon: Clock,
    className: 'bg-secondary text-muted-foreground border-border',
  }

  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] border capitalize tracking-tight',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  )
}

