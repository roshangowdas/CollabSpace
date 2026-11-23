import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Calendar,
  Clock,
  MessageSquare,
  AlertCircle,
  GripVertical,
  CheckCircle2,
  User,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { TaskPriorityBadge } from '@/components/task/TaskPriorityBadge'
import { TaskStatusBadge } from '@/components/task/TaskStatusBadge'
import { cn } from '@/utils/cn'

export function KanbanTaskCard({
  task,
  onClick,
  isOverlay = false,
}) {
  const {
    id,
    task_number,
    title,
    description,
    status = 'todo',
    priority = 'medium',
    due_date,
    estimated_hours,
    comment_count = 0,
    labels = [],
    project,
    assignee,
  } = task

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
    disabled: isOverlay,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const taskKey = project?.key ? `${project.key}-${task_number}` : `#${task_number}`
  const isCompleted = status === 'completed' || status === 'done'

  // Relative due date
  let dueDateText = null
  let isOverdue = false
  if (due_date) {
    const dueTime = new Date(due_date).getTime()
    const nowTime = new Date().getTime()
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24))

    const formatted = new Date(due_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    if (isCompleted) {
      dueDateText = formatted
    } else if (diffDays < 0) {
      isOverdue = true
      dueDateText = `${Math.abs(diffDays)}d overdue`
    } else if (diffDays === 0) {
      dueDateText = 'Due today'
    } else if (diffDays === 1) {
      dueDateText = 'Due tomorrow'
    } else {
      dueDateText = `${diffDays}d left`
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl',
        isDragging && 'opacity-30 scale-95'
      )}
    >
      <Card
        hover
        onClick={() => onClick && onClick(task)}
        className={cn(
          'p-3.5 transition-all duration-150 border-border/80 hover:border-brand/50 cursor-grab active:cursor-grabbing group relative select-none flex flex-col justify-between space-y-2.5 bg-card',
          isCompleted && 'opacity-75 bg-muted/20',
          isOverlay && 'shadow-modal ring-2 ring-brand/40 rotate-1 scale-102 cursor-grabbing z-50'
        )}
      >
        <div>
          {/* Card Top: Identifier, Drag Handle & Priority */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
              <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground group-hover:text-brand transition-colors">
                {taskKey}
              </span>
              {project?.name && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                  {project.name}
                </span>
              )}
            </div>
            <TaskPriorityBadge priority={priority} />
          </div>

          {/* Task Title */}
          <h4
            className={cn(
              'text-xs font-semibold text-foreground tracking-tight leading-snug line-clamp-2 group-hover:text-brand transition-colors',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {title}
          </h4>

          {/* Labels */}
          {labels && labels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {labels.slice(0, 2).map((lbl, idx) => (
                <span
                  key={idx}
                  className="text-[9px] px-1.5 py-0.2 rounded bg-secondary text-secondary-foreground font-medium"
                >
                  {lbl}
                </span>
              ))}
              {labels.length > 2 && (
                <span className="text-[9px] text-muted-foreground">+{labels.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Due date, comments, estimated hours & Assignee */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] gap-2">
          <div className="flex items-center gap-2.5">
            {due_date && (
              <div
                className={cn(
                  'flex items-center gap-1 font-medium',
                  isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'
                )}
                title={`Due: ${new Date(due_date).toLocaleDateString()}`}
              >
                {isOverdue ? (
                  <AlertCircle className="h-3 w-3 shrink-0" />
                ) : (
                  <Calendar className="h-3 w-3 shrink-0" />
                )}
                <span>{dueDateText}</span>
              </div>
            )}

            {estimated_hours && (
              <div className="flex items-center gap-1 text-muted-foreground" title="Estimated hours">
                <Clock className="h-3 w-3" />
                <span>{estimated_hours}h</span>
              </div>
            )}

            {Boolean(comment_count) && (
              <div className="flex items-center gap-1 text-muted-foreground" title={`${comment_count} comments`}>
                <MessageSquare className="h-3 w-3" />
                <span>{comment_count}</span>
              </div>
            )}
          </div>

          {/* Assignee Avatar */}
          <div className="shrink-0">
            {assignee ? (
              <Avatar
                src={assignee.avatar_url}
                name={assignee.full_name || assignee.username || 'Member'}
                size="xs"
                title={`Assigned to ${assignee.full_name || assignee.username}`}
              />
            ) : (
              <div
                className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/60 flex items-center justify-center text-muted-foreground"
                title="Unassigned"
              >
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

