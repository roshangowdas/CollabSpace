import React from 'react'
import { cn } from '@/utils/cn'

export const Switch = React.forwardRef(
  ({ className, checked = false, onCheckedChange, disabled, label, description, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    const toggle = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked)
      }
    }

    return (
      <div className="flex items-center justify-between space-x-3">
        {(label || description) && (
          <div className="grid gap-0.5 leading-none select-none">
            {label && (
              <label
                htmlFor={inputId}
                onClick={toggle}
                className={cn(
                  'text-sm font-medium leading-none cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        <button
          ref={ref}
          type="button"
          role="switch"
          id={inputId}
          aria-checked={checked}
          disabled={disabled}
          onClick={toggle}
          className={cn(
            'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary' : 'bg-muted-foreground/30 dark:bg-muted',
            className
          )}
          {...props}
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out',
              checked ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>
    )
  }
)

Switch.displayName = 'Switch'

