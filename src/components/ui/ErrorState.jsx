import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/utils/cn'

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  error,
  onRetry,
  onBack,
  className,
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-destructive/20 bg-destructive/5 text-card-foreground',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4 border border-destructive/20 shadow-subtle">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {onRetry && (
          <Button size="sm" variant="default" onClick={onRetry} leftIcon={RefreshCw}>
            Try Again
          </Button>
        )}
        {onBack && (
          <Button size="sm" variant="outline" onClick={onBack}>
            Go Back
          </Button>
        )}
      </div>

      {error && (
        <div className="w-full max-w-md mt-6 pt-4 border-t border-destructive/15">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mx-auto cursor-pointer"
          >
            <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showDetails && (
            <pre className="mt-3 p-3 text-[11px] font-mono text-left bg-background/80 rounded-md border text-destructive overflow-x-auto whitespace-pre-wrap">
              {error.message || String(error)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

