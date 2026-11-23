import React from 'react'
import { ChevronDown, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export const Select = React.forwardRef(
  ({ className, options = [], error, helperText, placeholder, disabled, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <div className="relative flex items-center">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              'flex h-9 w-full appearance-none rounded-md border border-input bg-background px-3 py-1.5 pr-8 text-sm shadow-subtle transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:border-input',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50 cursor-pointer',
              error && 'border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive text-destructive',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children ||
              options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

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

Select.displayName = 'Select'

