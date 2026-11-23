import React from 'react'
import {
  BarChart3,
  Calendar,
  Filter,
  FolderKanban,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DATE_RANGE_PRESETS } from '@/services/analytics'

export function AnalyticsHeader({
  projects = [],
  selectedProject = 'all',
  onSelectProject,
  selectedRange = '30d',
  onSelectRange,
  onRefresh,
  isLoading = false,
  isLive = true,
}) {
  return (
    <div className="flex flex-col gap-4 pb-6 border-b border-border/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-primary" />
              Project Analytics
            </h1>
            {isLive && (
              <Badge variant="outline" className="gap-1.5 py-0.5 text-xs font-normal border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time project velocity, task completion metrics, and team workload distribution.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5" />
            Project:
          </span>
          <select
            value={selectedProject}
            onChange={(e) => onSelectProject(e.target.value)}
            className="text-xs font-medium bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.key ? `[${p.key}] ` : ''}{p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5" />
            Range:
          </span>
          {DATE_RANGE_PRESETS.map((preset) => {
            const isActive = selectedRange === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => onSelectRange(preset.id)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
