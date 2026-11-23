import React from 'react'
import { AVAILABILITY_STATUSES } from '@/services/presence'
import { cn } from '@/utils/cn'

export function UserPresenceBadge({
  availability = 'offline',
  size = 'sm',
  showLabel = false,
  className,
}) {
  const availKey = (availability || 'offline').toUpperCase()
  const config = AVAILABILITY_STATUSES[availKey] || AVAILABILITY_STATUSES.OFFLINE

  const sizeClasses = {
    xs: 'h-2 w-2 ring-1',
    sm: 'h-2.5 w-2.5 ring-2',
    md: 'h-3 w-3 ring-2',
    lg: 'h-3.5 w-3.5 ring-2',
  }[size] || 'h-2.5 w-2.5 ring-2'

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      title={`Status: ${config.label}`}
    >
      <span
        className={cn(
          'relative flex rounded-full shrink-0 ring-background transition-colors',
          config.badgeClass,
          sizeClasses
        )}
      >
        {availability === 'online' && (
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-75',
              config.badgeClass
            )}
          />
        )}
      </span>

      {showLabel && (
        <span className={cn('text-xs font-medium', config.textClass)}>
          {config.label}
        </span>
      )}
    </div>
  )
}

