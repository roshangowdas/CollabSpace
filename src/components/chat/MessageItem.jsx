import React, { useState } from 'react'
import {
  Reply,
  Edit2,
  Trash2,
  Save,
  X,
  CornerDownRight,
  Clock,
  MoreVertical,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { AttachmentPreview } from './AttachmentPreview'
import { UserPresenceBadge } from '@/components/presence/UserPresenceBadge'
import { usePresence } from '@/hooks/usePresence'
import { cn } from '@/utils/cn'

function FormattedMessageText({ content }) {
  if (!content) return null

  // Split on @mentions and URL patterns
  const parts = content.split(/(@[a-zA-Z0-9_]+|https?:\/\/[^\s]+)/g)

  return (
    <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
      {parts.map((part, idx) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={idx}
              className="inline-flex items-center font-semibold text-brand bg-brand/10 px-1.5 py-0.2 rounded font-mono text-xs mx-0.5"
            >
              {part}
            </span>
          )
        }
        if (part.startsWith('http://') || part.startsWith('https://')) {
          return (
            <a
              key={idx}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline inline-flex items-center break-all font-medium"
            >
              {part}
            </a>
          )
        }
        return <span key={idx}>{part}</span>
      })}
    </p>
  )
}

function formatMessageTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageItem({
  message,
  currentUserId,
  isAdmin = false,
  onReply = null,
  onUpdate = null,
  onDelete = null,
  className,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { getUserPresence } = usePresence()
  const isAuthor = message.sender_id === currentUserId
  const canDelete = isAuthor || isAdmin
  const isEdited = message.updated_at && message.updated_at !== message.created_at

  const sender = message.sender || {}
  const senderName = sender.full_name || sender.username || 'Team Member'
  const parent = message.parent
  const presence = getUserPresence(message.sender_id)

  const handleStartEdit = () => {
    setEditContent(message.content || '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(message.content || '')
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (onUpdate) {
        await onUpdate(message.id, editContent)
      }
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update message:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      if (onDelete) {
        await onDelete(message.id)
      }
    }
  }

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        'group relative flex items-start gap-3 py-2 px-3 rounded-xl transition-colors hover:bg-muted/40',
        className
      )}
    >
      {/* Sender Avatar with Live Presence Indicator */}
      <div className="relative mt-0.5 shrink-0">
        <Avatar
          src={sender.avatar_url}
          name={senderName}
          size="sm"
          className="shadow-xs"
        />
        {presence.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <UserPresenceBadge availability={presence.availability} size="xs" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Header: Name, Time, Edited flag */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-foreground">
            {senderName}
          </span>
          {sender.username && (
            <span className="text-[11px] text-muted-foreground font-mono">
              @{sender.username}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground" title={new Date(message.created_at).toLocaleString()}>
            {formatMessageTime(message.created_at)}
          </span>
          {isEdited && (
            <span className="text-[10px] text-muted-foreground/70 italic">
              (edited)
            </span>
          )}
        </div>

        {/* Quoted parent reply banner */}
        {parent && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary/60 border-l-2 border-brand text-[11px] text-muted-foreground mb-1 max-w-lg truncate">
            <CornerDownRight className="h-3 w-3 text-brand shrink-0" />
            <span className="font-semibold text-foreground/80 shrink-0">
              @{parent.sender?.username || parent.sender?.full_name || 'Member'}:
            </span>
            <span className="truncate">{parent.content}</span>
          </div>
        )}

        {/* Message Content / Inline Editor */}
        {isEditing ? (
          <div className="space-y-2 mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-brand bg-background p-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-brand"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSaveEdit()
                } else if (e.key === 'Escape') {
                  handleCancelEdit()
                }
              }}
              autoFocus
            />
            <div className="flex items-center gap-1.5 text-xs">
              <Button
                type="button"
                variant="brand"
                size="xs"
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editContent.trim()}
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <span className="text-[10px] text-muted-foreground ml-2">
                Escape to cancel • Enter to save
              </span>
            </div>
          </div>
        ) : (
          <>
            <FormattedMessageText content={message.content} />
            {message.attachments && message.attachments.length > 0 && (
              <AttachmentPreview attachments={message.attachments} />
            )}
          </>
        )}
      </div>

      {/* Hover Action Bar */}
      {!isEditing && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-subtle">
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(message)}
              className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Reply to message"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>
          )}

          {isAuthor && onUpdate && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Edit message"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}

          {canDelete && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Delete message"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

