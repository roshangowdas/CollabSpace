import React from 'react'
import {
  Calendar,
  Clock,
  Tag,
  User,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { TaskStatusBadge } from './TaskStatusBadge'
import { cn } from '@/utils/cn'

export function TaskCard({
  task,
  onClick,
  onStatusChange,
  showProject = true,
  className,
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

  const taskKey = project?.key ? `${project.key}-${task_number}` : `#${task_number}`

  // Due date formatting
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

    if (status === 'completed' || status === 'done') {
      dueDateText = formatted
    } else if (diffDays < 0) {
      isOverdue = true
      dueDateText = `${Math.abs(diffDays)}d overdue`
    } else if (diffDays === 0) {
      dueDateText = 'Due today'
    } else if (diffDays === 1) {
      dueDateText = 'Due tomorrow'
    } else {
      dueDateText = `${diffDays}d left (${formatted})`
    }
  }

  const isCompleted = status === 'completed' || status === 'done'

  return (
    <Card
      hover
      onClick={() => onClick && onClick(task)}
      className={cn(
        'p-4 transition-all duration-150 border-border/80 hover:border-brand/40 cursor-pointer group flex flex-col justify-between space-y-3',
        isCompleted && 'opacity-80 bg-muted/20',
        className
      )}
    >
      <div>
        {/* Top Header: Task Key, Project & Priority */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground group-hover:text-brand transition-colors">
              {taskKey}
            </span>
            {showProject && project?.name && (
              <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                {project.name}
              </span>
            )}
          </div>
          <TaskPriorityBadge priority={priority} />
        </div>

        {/* Task Title */}
        <h4
          className={cn(
            'text-xs sm:text-sm font-semibold text-foreground tracking-tight leading-snug line-clamp-2 group-hover:text-brand transition-colors',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {title}
        </h4>

        {/* Snippet / Description if present */}
        {description && (
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Labels / Tags */}
        {labels && labels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {labels.slice(0, 3).map((lbl, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium"
              >
                {lbl}
              </span>
            ))}
            {labels.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{labels.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Status, Timeline, Estimated Hours & Assignee */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border/50 text-[11px] gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskStatusBadge status={status} />

          {due_date && (
            <div
              className={cn(
                'flex items-center gap-1 font-medium',
                isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'
              )}
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
  )
}

