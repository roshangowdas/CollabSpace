import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function AnalyticsErrorState({ error, onRetry }) {
  const errorMessage =
    error?.message ||
    (typeof error === 'string' ? error : 'Failed to load workspace analytics. Please verify your connection.')

  return (
    <Card className="border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10">
      <CardContent className="py-12 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-semibold text-foreground mb-1">
          Analytics Error
        </h3>
        <p className="text-xs text-muted-foreground mb-5 max-w-sm">
          {errorMessage}
        </p>

        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
