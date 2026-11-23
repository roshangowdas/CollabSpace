import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export const Textarea = React.forwardRef(
  ({ className, error, helperText, disabled, rows = 3, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-subtle transition-all duration-150',
            'placeholder:text-muted-foreground/70',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:border-input',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
            error && 'border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive text-destructive',
            className
          )}
          {...props}
        />
        {error ? (
          <div className="flex items-center gap-1.5 text-xs text-destructive animate-in fade-in-50">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

