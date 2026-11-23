import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  Plus,
  Circle,
  PlayCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import { KanbanTaskCard } from './KanbanTaskCard'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export function KanbanColumn({
  column,
  tasks = [],
  onTaskClick,
  onAddTask,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  })

  const taskIds = tasks.map((t) => t.id)

  const iconMap = {
    todo: { icon: Circle, color: 'text-muted-foreground' },
    in_progress: { icon: PlayCircle, color: 'text-brand' },
    in_review: { icon: Eye, color: 'text-indigo-500' },
    completed: { icon: CheckCircle2, color: 'text-emerald-500' },
  }

  const { icon: StatusIcon, color: iconColor } = iconMap[column.id] || {
    icon: Circle,
    color: 'text-muted-foreground',
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border border-border/80 bg-secondary/30 transition-colors duration-150 min-h-[500px] w-full',
        isOver && 'border-brand/60 bg-brand/5 ring-1 ring-brand/30'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/60 bg-muted/20 rounded-t-xl">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('h-4 w-4 shrink-0', iconColor)} />
          <h3 className="text-xs font-semibold text-foreground tracking-tight">
            {column.title}
          </h3>
          <span className="rounded-full bg-background border px-2 py-0.2 text-[10px] font-mono text-muted-foreground font-semibold">
            {tasks.length}
          </span>
        </div>

        {onAddTask && (
          <button
            type="button"
            onClick={() => onAddTask(column.id)}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={`Add task to ${column.title}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Sortable Task List Area */}
      <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>

        {/* Empty Column Drop Target Placeholder */}
        {tasks.length === 0 && (
          <div
            onClick={() => onAddTask && onAddTask(column.id)}
            className={cn(
              'rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground transition-colors cursor-pointer hover:border-brand/50 hover:bg-muted/30 flex flex-col items-center justify-center gap-1.5 min-h-[140px]',
              isOver && 'border-brand bg-brand/10 text-brand'
            )}
          >
            <Plus className="h-4 w-4" />
            <span className="font-medium text-[11px]">
              {isOver ? 'Drop task here' : `No tasks in ${column.title}`}
            </span>
            <span className="text-[10px] text-muted-foreground/80">
              Click + to create
            </span>
          </div>
        )}
      </div>

      {/* Quick Add Task Button at Column Footer */}
      {onAddTask && (
        <div className="p-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => onAddTask(column.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-muted-foreground hover:bg-secondary/70 hover:text-foreground transition-colors font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      )}
    </div>
  )
}

