import React from 'react'
import { BarChart3, Plus, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function AnalyticsEmptyState({ onResetFilters, onNewTask }) {
  return (
    <Card className="border-dashed border-border/80">
      <CardContent className="py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
          <BarChart3 className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-1.5">
          No Analytics Data Found
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          There are no projects or tasks matching your current filter criteria in this workspace.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {onResetFilters && (
            <Button variant="outline" size="sm" onClick={onResetFilters} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </Button>
          )}
          {onNewTask && (
            <Button size="sm" onClick={onNewTask} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Task
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
