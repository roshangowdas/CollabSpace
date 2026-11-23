import React from 'react'
import {
  Search,
  Filter,
  Layers,
  ArrowUpDown,
  LayoutGrid,
  List,
  User,
  AlertCircle,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

export function TaskFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  projectFilter,
  onProjectChange,
  assigneeFilter,
  onAssigneeChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  projects = [],
  workspaceMembers = [],
  statusCounts = { all: 0, todo: 0, in_progress: 0, in_review: 0, completed: 0 },
  onResetFilters,
}) {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    projectFilter !== 'all' ||
    assigneeFilter !== 'all'

  return (
    <div className="space-y-3">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
        {[
          { id: 'all', label: 'All Tasks', count: statusCounts.all },
          { id: 'todo', label: 'Todo', count: statusCounts.todo },
          { id: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
          { id: 'in_review', label: 'In Review', count: statusCounts.in_review },
          { id: 'completed', label: 'Completed', count: statusCounts.completed },
        ].map((tab) => {
          const isActive = statusFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0',
                isActive
                  ? 'bg-secondary text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-mono',
                  isActive ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Secondary Controls: Search, Dropdown Filters, Sort & View Mode */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tasks by title, key, label..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project Filter */}
          <div className="w-36">
            <Select
              value={projectFilter}
              onChange={(e) => onProjectChange(e.target.value)}
              options={[
                { value: 'all', label: 'All Projects' },
                ...projects.map((p) => ({
                  value: p.id,
                  label: `[${p.key}] ${p.name}`,
                })),
              ]}
            />
          </div>

          {/* Priority Filter */}
          <div className="w-32">
            <Select
              value={priorityFilter}
              onChange={(e) => onPriorityChange(e.target.value)}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
          </div>

          {/* Assignee Filter */}
          <div className="w-36">
            <Select
              value={assigneeFilter}
              onChange={(e) => onAssigneeChange(e.target.value)}
              options={[
                { value: 'all', label: 'All Assignees' },
                { value: 'me', label: 'Assigned to Me' },
                { value: 'unassigned', label: 'Unassigned' },
                ...workspaceMembers.map((m) => ({
                  value: m.user_id || m.id,
                  label: m.full_name || m.username || m.email,
                })),
              ]}
            />
          </div>

          {/* Sort Selector */}
          <div className="w-36">
            <Select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              options={[
                { value: 'recent', label: 'Newest First' },
                { value: 'due_date', label: 'Due Date' },
                { value: 'priority', label: 'Priority' },
                { value: 'task_number', label: 'Task Number' },
              ]}
            />
          </div>

          {/* View Mode Switcher */}
          {onViewModeChange && (
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('board')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === 'board'
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Board / Columns view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Clear Filters Button if any active */}
          {hasActiveFilters && onResetFilters && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onResetFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

