import React, { useState } from 'react'
import { cn } from '@/utils/cn'

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  default: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-20 w-20 text-xl',
}

const statusIndicatorClasses = {
  online: 'bg-emerald-500 ring-background',
  offline: 'bg-muted-foreground ring-background',
  away: 'bg-amber-500 ring-background',
  busy: 'bg-rose-500 ring-background',
}

const statusSizeClasses = {
  xs: 'h-1.5 w-1.5 ring-1 -bottom-0.5 -right-0.5',
  sm: 'h-2 w-2 ring-1.5 -bottom-0.5 -right-0.5',
  default: 'h-2.5 w-2.5 ring-2 bottom-0 right-0',
  md: 'h-2.5 w-2.5 ring-2 bottom-0 right-0',
  lg: 'h-3 w-3 ring-2 bottom-0 right-0',
  xl: 'h-3.5 w-3.5 ring-2 bottom-0.5 right-0.5',
  '2xl': 'h-4 w-4 ring-2 bottom-1 right-1',
}

export function Avatar({
  src,
  alt = '',
  name = '',
  fallback,
  status,
  size = 'default',
  className,
  ...props
}) {
  const [hasError, setHasError] = useState(!src)

  const displayName = name || alt || fallback || 'User'
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className={cn('relative inline-flex shrink-0 select-none', className)} {...props}>
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-full font-medium bg-muted text-muted-foreground border border-border/80 shadow-subtle',
          sizeClasses[size] || sizeClasses.default
        )}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || displayName}
            onError={() => setHasError(true)}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <span className="leading-none tracking-tight">{initials}</span>
        )}
      </div>

      {status && statusIndicatorClasses[status] && (
        <span
          className={cn(
            'absolute rounded-full',
            statusSizeClasses[size] || statusSizeClasses.default,
            statusIndicatorClasses[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  )
}

export function AvatarGroup({ children, max = 4, size = 'default', className }) {
  const childrenArray = React.Children.toArray(children)
  const visibleAvatars = childrenArray.slice(0, max)
  const extraCount = childrenArray.length - max

  return (
    <div className={cn('flex items-center -space-x-2.5 overflow-hidden', className)}>
      {visibleAvatars.map((child, index) => (
        <div key={index} className="ring-2 ring-background rounded-full">
          {React.cloneElement(child, { size })}
        </div>
      ))}
      {extraCount > 0 && (
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full font-medium bg-secondary text-secondary-foreground ring-2 ring-background border border-border text-xs',
            sizeClasses[size] || sizeClasses.default
          )}
        >
          +{extraCount}
        </div>
      )}
    </div>
  )
}
