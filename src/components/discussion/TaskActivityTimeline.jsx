import React from 'react'
import {
  History,
  PlayCircle,
  CheckCircle2,
  UserCheck,
  Calendar,
  MessageSquare,
  PlusCircle,
  FileEdit,
  Clock,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatActivityDescription } from '@/services/discussions'
import { cn } from '@/utils/cn'

export function TaskActivityTimeline({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground space-y-1">
        <History className="h-5 w-5 mx-auto text-muted-foreground/60 mb-1.5" />
        <p className="font-medium text-foreground">No activity history</p>
        <p className="text-[11px]">Lifecycle events will appear here as the task progresses.</p>
      </div>
    )
  }

  const getActionIcon = (action, details = {}) => {
    switch (action) {
      case 'status_changed':
        if (details.new_status === 'completed' || details.new_status === 'done') {
          return { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' }
        }
        return { icon: PlayCircle, color: 'text-brand bg-brand/10' }
      case 'assigned':
        return { icon: UserCheck, color: 'text-indigo-500 bg-indigo-500/10' }
      case 'updated':
        return { icon: Calendar, color: 'text-amber-500 bg-amber-500/10' }
      case 'commented':
        return { icon: MessageSquare, color: 'text-brand bg-brand/10' }
      case 'created':
        return { icon: PlusCircle, color: 'text-emerald-500 bg-emerald-500/10' }
      default:
        return { icon: FileEdit, color: 'text-muted-foreground bg-muted' }
    }
  }

  return (
    <div className="relative pl-6 space-y-4">
      {/* Vertical timeline connecting line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border/70" />

      {activities.map((act) => {
        const user = act.user || {}
        const { icon: ActionIcon, color } = getActionIcon(act.action, act.details)
        const date = new Date(act.created_at)
        const relativeTime = formatRelativeTime(date)
        const description = formatActivityDescription(act)

        return (
          <div key={act.id} className="relative flex items-start gap-3 text-xs group">
            {/* Timeline icon node */}
            <div
              className={cn(
                'absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border shrink-0 shadow-xs ring-2 ring-background',
                color
              )}
            >
              <ActionIcon className="h-3 w-3 shrink-0" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground truncate">
                  {user.full_name || user.username || 'System'}
                </span>
                <span className="text-muted-foreground leading-relaxed">
                  {description}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground" title={date.toLocaleString()}>
                {relativeTime}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatRelativeTime(date) {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDays = Math.floor(diffHour / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

