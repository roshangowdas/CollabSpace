import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export const Checkbox = React.forwardRef(
  (
    {
      className,
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      disabled = false,
      label,
      description,
      id,
      error,
      name,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const isControlled = controlledChecked !== undefined
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(Boolean(defaultChecked))

    const isChecked = isControlled ? Boolean(controlledChecked) : uncontrolledChecked

    const handleChange = (e) => {
      if (disabled) return
      const nextChecked = e.target.checked
      if (!isControlled) {
        setUncontrolledChecked(nextChecked)
      }
      onChange?.(e)
    }

    return (
      <div className="flex items-start space-x-2.5 group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="checkbox"
            checked={isControlled ? Boolean(controlledChecked) : undefined}
            defaultChecked={!isControlled ? Boolean(defaultChecked) : undefined}
            onChange={handleChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'h-4 w-4 shrink-0 rounded border border-input shadow-subtle transition-all duration-150 cursor-pointer flex items-center justify-center select-none',
              'hover:border-foreground/40',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
              isChecked
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-background hover:bg-muted/30',
              error && 'border-destructive focus-visible:ring-destructive/30',
              disabled && 'cursor-not-allowed opacity-50 bg-muted border-muted-foreground/30',
              className
            )}
          >
            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
          </label>
        </div>

        {(label || description) && (
          <div className="grid gap-1 leading-none select-none">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'text-sm font-medium leading-relaxed cursor-pointer text-foreground select-none',
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
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

