import React from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MoreVertical,
  Users,
  CheckCircle2,
  Lock,
  Globe,
  Archive,
  RotateCcw,
  Trash2,
  Edit,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { ProjectProgress } from './ProjectProgress'
import { cn } from '@/utils/cn'

export function ProjectCard({
  project,
  canModify = false,
  onEdit,
  onManageMembers,
  onArchive,
  onRestore,
  onDelete,
}) {
  const {
    id,
    name,
    key,
    description,
    status = 'active',
    visibility = 'workspace',
    start_date,
    due_date,
    task_stats = { total: 0, done: 0 },
    member_count = 1,
    progress = 0,
    creator,
  } = project

  // Calculate timeline relative status
  let dueDateText = null
  let isOverdue = false

  if (due_date) {
    const dueDateObj = new Date(due_date)
    const now = new Date()
    const diffMs = dueDateObj.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    const formatted = dueDateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    if (status === 'completed') {
      dueDateText = `Finished (${formatted})`
    } else if (diffDays < 0) {
      isOverdue = true
      dueDateText = `Overdue by ${Math.abs(diffDays)}d (${formatted})`
    } else if (diffDays === 0) {
      dueDateText = `Due today (${formatted})`
    } else if (diffDays === 1) {
      dueDateText = `Due tomorrow (${formatted})`
    } else {
      dueDateText = `Due in ${diffDays}d (${formatted})`
    }
  }

  const statusVariant = {
    active: 'brand',
    paused: 'warning',
    completed: 'success',
    archived: 'secondary',
  }[status] || 'secondary'

  return (
    <Card
      hover
      className="flex flex-col justify-between p-5 transition-all duration-200 border-border/70 hover:border-brand/40 group relative"
    >
      <div>
        {/* Top Header: Key, Badges & Action Menu */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
              {key}
            </span>
            <Badge variant={statusVariant} size="sm" className="capitalize">
              {status}
            </Badge>
            <Badge variant="outline" size="sm" className="gap-1 text-[11px]">
              {visibility === 'private' ? (
                <>
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span>Private</span>
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span>Workspace</span>
                </>
              )}
            </Badge>
          </div>

          {/* Action Menu */}
          <div className="shrink-0">
            <DropdownMenu
              align="right"
              trigger={
                <button
                  type="button"
                  aria-label="Project options"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
            >
              <Link to={`/projects/${id}`}>
                <DropdownMenuItem icon={ExternalLink}>View Details</DropdownMenuItem>
              </Link>
              {canModify && onEdit && (
                <DropdownMenuItem icon={Edit} onClick={() => onEdit(project)}>
                  Edit Project
                </DropdownMenuItem>
              )}
              {canModify && onManageMembers && (
                <DropdownMenuItem icon={Users} onClick={() => onManageMembers(project)}>
                  Manage Members
                </DropdownMenuItem>
              )}
              {canModify && (
                <>
                  <DropdownMenuSeparator />
                  {status === 'archived' ? (
                    onRestore && (
                      <DropdownMenuItem icon={RotateCcw} onClick={() => onRestore(project)}>
                        Restore Project
                      </DropdownMenuItem>
                    )
                  ) : (
                    onArchive && (
                      <DropdownMenuItem icon={Archive} onClick={() => onArchive(project)}>
                        Archive Project
                      </DropdownMenuItem>
                    )
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      icon={Trash2}
                      destructive
                      onClick={() => onDelete(project)}
                    >
                      Delete Project
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenu>
          </div>
        </div>

        {/* Project Name and Description */}
        <div className="mb-4">
          <Link
            to={`/projects/${id}`}
            className="group-hover:text-brand transition-colors inline-block"
          >
            <h3 className="text-base font-semibold text-foreground tracking-tight line-clamp-1">
              {name}
            </h3>
          </Link>
          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2rem]">
            {description || 'No description provided for this project.'}
          </p>
        </div>

        {/* Timeline & Due Date */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          {due_date ? (
            <div
              className={cn(
                'flex items-center gap-1.5 font-medium',
                isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'
              )}
              title={`Due: ${new Date(due_date).toLocaleDateString()}`}
            >
              {isOverdue ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Calendar className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{dueDateText}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground/70">
              <Clock className="h-3.5 w-3.5" />
              <span>No due date</span>
            </div>
          )}
        </div>

        {/* Progress bar and Task Counts */}
        <div className="space-y-1.5 mb-5">
          <ProjectProgress value={progress} status={status} size="sm" showLabel={false} />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>
                {task_stats.done} of {task_stats.total} tasks completed
              </span>
            </span>
            <span className="font-semibold text-foreground font-mono">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Members & Creator */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            <Avatar
              src={creator?.avatar_url}
              name={creator?.full_name || 'Project Lead'}
              size="xs"
              className="ring-2 ring-card"
            />
          </div>
          <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
            {creator?.full_name || 'Team'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <Users className="h-3.5 w-3.5" />
          <span>{member_count} {member_count === 1 ? 'member' : 'members'}</span>
        </div>
      </div>
    </Card>
  )
}

