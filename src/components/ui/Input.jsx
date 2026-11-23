import React, { useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export const Input = React.forwardRef(
  (
    {
      className,
      type = 'text',
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      allowPasswordToggle = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password' || allowPasswordToggle
    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="w-full space-y-1.5">
        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center justify-center">
              <LeftIcon className="h-4 w-4" />
            </div>
          )}

          <input
            ref={ref}
            type={actualType}
            disabled={disabled}
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-subtle transition-all duration-150',
              'placeholder:text-muted-foreground/70',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:border-input',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
              '[&::-ms-reveal]:hidden [&::-ms-clear]:hidden',
              LeftIcon && 'pl-9',
              (RightIcon || isPassword) && 'pr-9',
              error && 'border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive text-destructive',
              className
            )}
            {...props}
          />

          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          ) : RightIcon ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center justify-center">
              <RightIcon className="h-4 w-4" />
            </div>
          ) : null}
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

Input.displayName = 'Input'
