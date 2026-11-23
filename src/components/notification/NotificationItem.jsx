import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserCheck,
  AtSign,
  MessageSquare,
  PlayCircle,
  Clock,
  UserPlus,
  Mail,
  Sparkles,
  MessageCircle,
  Info,
  Check,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'

function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`
  const diffDays = Math.floor(diffHour / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function getNotificationTypeConfig(type) {
  switch (type) {
    case 'assignment':
      return {
        icon: UserCheck,
        color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        label: 'Assignment',
      }
    case 'mention':
      return {
        icon: AtSign,
        color: 'text-brand bg-brand/10 border-brand/20',
        label: 'Mention',
      }
    case 'comment':
      return {
        icon: MessageSquare,
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        label: 'Comment',
      }
    case 'status_change':
      return {
        icon: PlayCircle,
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        label: 'Status Change',
      }
    case 'deadline':
      return {
        icon: Clock,
        color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        label: 'Deadline',
      }
    case 'member_joined':
      return {
        icon: UserPlus,
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        label: 'Member Joined',
      }
    case 'invitation':
      return {
        icon: Mail,
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        label: 'Invitation',
      }
    case 'announcement':
      return {
        icon: Sparkles,
        color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
        label: 'Announcement',
      }
    case 'chat_message':
      return {
        icon: MessageCircle,
        color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
        label: 'Chat Message',
      }
    default:
      return {
        icon: Info,
        color: 'text-muted-foreground bg-secondary border-border',
        label: 'Notification',
      }
  }
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onCloseDropdown,
  compact = false,
  className,
}) {
  const navigate = useNavigate()
  const { icon: TypeIcon, color } = getNotificationTypeConfig(notification.type)
  const actor = notification.actor
  const isUnread = !notification.is_read

  const handleClick = () => {
    if (isUnread && onMarkRead) {
      onMarkRead(notification.id)
    }
    if (onCloseDropdown) {
      onCloseDropdown()
    }
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const handleMarkReadClick = (e) => {
    e.stopPropagation()
    if (onMarkRead) {
      onMarkRead(notification.id)
    }
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(notification.id)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer border',
        isUnread
          ? 'bg-brand/5 dark:bg-brand/10 border-brand/20 hover:bg-brand/10'
          : 'bg-card hover:bg-secondary/60 border-border/60',
        className
      )}
    >
      {/* Unread dot indicator */}
      {isUnread && (
        <span className="absolute left-1.5 top-3.5 h-1.5 w-1.5 rounded-full bg-brand ring-2 ring-background" />
      )}

      {/* Avatar or Event Icon Badge */}
      <div className="relative shrink-0 ml-1">
        {actor ? (
          <Avatar
            src={actor.avatar_url}
            name={actor.full_name || actor.username}
            size={compact ? 'sm' : 'default'}
          />
        ) : (
          <div
            className={cn(
              'flex items-center justify-center rounded-full border shadow-2xs',
              compact ? 'h-8 w-8' : 'h-9 w-9',
              color
            )}
          >
            <TypeIcon className={compact ? 'h-4 w-4' : 'h-4 w-4'} />
          </div>
        )}

        {/* Small corner type icon badge if avatar is shown */}
        {actor && (
          <div
            className={cn(
              'absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-background shadow-xs',
              color
            )}
          >
            <TypeIcon className="h-2.5 w-2.5" />
          </div>
        )}
      </div>

      {/* Notification Text Content */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-xs truncate font-semibold',
              isUnread ? 'text-foreground' : 'text-foreground/80'
            )}
          >
            {notification.title}
          </p>
          <span
            className="text-[10px] text-muted-foreground shrink-0"
            title={new Date(notification.created_at).toLocaleString()}
          >
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {notification.message}
        </p>

        {/* Destination link hint */}
        {notification.link && !compact && (
          <div className="flex items-center gap-1 text-[11px] text-brand pt-1 font-medium group-hover:underline">
            <span>View details</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Action Buttons on Hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-1">
        {isUnread && (
          <button
            type="button"
            onClick={handleMarkReadClick}
            className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={handleDeleteClick}
          className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
