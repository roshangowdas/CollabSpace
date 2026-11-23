import React from 'react'
import { cn } from '@/utils/cn'

/**
 * Visual progress indicator for projects and tasks.
 *
 * @param {object} props
 * @param {number} props.value - percentage (0 to 100)
 * @param {'active'|'paused'|'completed'|'archived'} [props.status='active']
 * @param {boolean} [props.showLabel=true]
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.className]
 */
export function ProjectProgress({
  value = 0,
  status = 'active',
  showLabel = true,
  size = 'md',
  className,
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)))

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  // Dynamic color coding based on project status and completion
  let fillClasses = 'bg-brand'
  if (status === 'completed' || clamped === 100) {
    fillClasses = 'bg-emerald-500'
  } else if (status === 'paused') {
    fillClasses = 'bg-amber-500'
  } else if (status === 'archived') {
    fillClasses = 'bg-muted-foreground'
  }

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Progress</span>
          <span className="font-semibold text-foreground font-mono">{clamped}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-secondary/80 border border-border/40',
          heightClasses[size] || heightClasses.md
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300 ease-out', fillClasses)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

