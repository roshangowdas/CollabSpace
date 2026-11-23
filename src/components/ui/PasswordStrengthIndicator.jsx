import React from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Calculates password strength score (0 to 4) and checks requirements.
 * @param {string} password
 */
export function getPasswordStrength(password = '') {
  const requirements = [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'mixed', label: 'Uppercase & lowercase letters', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: 'number', label: 'At least one number', met: /\d/.test(password) },
    { id: 'symbol', label: 'At least one special symbol', met: /[^A-Za-z0-9]/.test(password) },
  ]

  const score = requirements.filter((r) => r.met).length

  let label = 'Too Weak'
  let color = 'bg-muted-foreground/30'
  let textColor = 'text-muted-foreground'

  if (password.length > 0) {
    if (score <= 1) {
      label = 'Weak'
      color = 'bg-destructive'
      textColor = 'text-destructive'
    } else if (score === 2) {
      label = 'Fair'
      color = 'bg-amber-500'
      textColor = 'text-amber-600 dark:text-amber-400'
    } else if (score === 3) {
      label = 'Good'
      color = 'bg-sky-500'
      textColor = 'text-sky-600 dark:text-sky-400'
    } else if (score === 4) {
      label = 'Strong'
      color = 'bg-emerald-500'
      textColor = 'text-emerald-600 dark:text-emerald-400'
    }
  }

  return { score, label, color, textColor, requirements }
}

export function PasswordStrengthIndicator({ password = '', showRequirements = true, className }) {
  if (!password) return null

  const { score, label, color, textColor, requirements } = getPasswordStrength(password)

  return (
    <div className={cn('space-y-2 pt-1 animate-in fade-in-50 duration-200', className)}>
      {/* Strength Meter Bars */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground font-medium">Password strength:</span>
          <span className={cn('font-semibold', textColor)}>{label}</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                'h-full rounded-full transition-colors duration-200',
                score >= step ? color : 'bg-muted dark:bg-muted/50'
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirement items */}
      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
          {requirements.map((req) => (
            <div
              key={req.id}
              className={cn(
                'flex items-center gap-1.5 text-[11px] transition-colors',
                req.met ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3 shrink-0 stroke-[3]" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0 ml-0.5 mr-1" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

