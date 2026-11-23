import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-md font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'border border-transparent bg-primary text-primary-foreground shadow-subtle',
        secondary:
          'border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        brand:
          'border border-brand/20 bg-brand/10 text-brand font-semibold',
        outline:
          'border border-border text-foreground bg-background',
        destructive:
          'border border-destructive/20 bg-destructive/10 text-destructive',
        success:
          'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning:
          'border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        info:
          'border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400',
        muted:
          'border border-transparent bg-muted text-muted-foreground',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.2 text-[10px] leading-tight',
        lg: 'px-3 py-1 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const dotColorMap = {
  default: 'bg-primary-foreground',
  secondary: 'bg-secondary-foreground',
  brand: 'bg-brand',
  outline: 'bg-muted-foreground',
  destructive: 'bg-destructive',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
  muted: 'bg-muted-foreground',
}

export function Badge({
  className,
  variant = 'default',
  size = 'default',
  dot = false,
  ping = false,
  children,
  ...props
}) {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5 mr-1.5 shrink-0">
          {ping && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                dotColorMap[variant] || 'bg-foreground'
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex h-1.5 w-1.5 rounded-full',
              dotColorMap[variant] || 'bg-foreground'
            )}
          />
        </span>
      )}
      {children}
    </span>
  )
}
