import React, { useState } from 'react'
import {
  MoreVertical,
  Edit2,
  Trash2,
  Save,
  X,
  Clock,
  MessageSquare,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { cn } from '@/utils/cn'

/**
 * Formats comment text with highlighted @username mention badges.
 */
function FormattedCommentContent({ content }) {
  if (!content) return null

  // Split on @username patterns
  const parts = content.split(/(@[a-zA-Z0-9_]+)/g)

  return (
    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
      {parts.map((part, idx) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={idx}
              className="inline-flex items-center font-semibold text-brand bg-brand/10 px-1 py-0.2 rounded font-mono text-[11px] mx-0.5"
            >
              {part}
            </span>
          )
        }
        return <span key={idx}>{part}</span>
      })}
    </p>
  )
}

export function TaskCommentsList({
  comments = [],
  currentUserId,
  isWorkspaceAdmin = false,
  onUpdateComment,
  onDeleteComment,
}) {
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingContent('')
  }

  const handleSaveEdit = async (commentId) => {
    if (!editingContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onUpdateComment(commentId, editingContent)
      setEditingCommentId(null)
      setEditingContent('')
    } catch (err) {
      console.error('Failed to update comment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await onDeleteComment(commentId)
    }
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground space-y-1">
        <MessageSquare className="h-5 w-5 mx-auto text-muted-foreground/60 mb-1.5" />
        <p className="font-medium text-foreground">No comments yet</p>
        <p className="text-[11px]">Start the conversation or tag a team member below.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      {comments.map((comment) => {
        const author = comment.user || {}
        const isAuthor = comment.user_id === currentUserId
        const canDelete = isAuthor || isWorkspaceAdmin
        const isEditing = editingCommentId === comment.id

        // Format timestamp
        const createdDate = new Date(comment.created_at)
        const timeAgo = formatRelativeTime(createdDate)
        const fullDate = createdDate.toLocaleString()
        const isEdited = comment.updated_at && comment.updated_at !== comment.created_at

        return (
          <div
            key={comment.id}
            className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2 shadow-subtle group transition-colors"
          >
            {/* Header: Author Avatar, Name, Timestamp & Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  src={author.avatar_url}
                  name={author.full_name || author.username || 'Member'}
                  size="xs"
                />
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {author.full_name || author.username || 'Team Member'}
                  </span>
                  {author.username && (
                    <span className="text-[10px] text-muted-foreground font-mono truncate">
                      @{author.username}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground/50">•</span>
                  <span
                    className="text-[10px] text-muted-foreground"
                    title={fullDate}
                  >
                    {timeAgo}
                  </span>
                  {isEdited && (
                    <span className="text-[9px] text-muted-foreground italic">
                      (edited)
                    </span>
                  )}
                </div>
              </div>

              {/* Actions dropdown: strictly author or admin */}
              {(isAuthor || canDelete) && !isEditing && (
                <div className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu
                    align="right"
                    trigger={
                      <button
                        type="button"
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    }
                  >
                    {isAuthor && (
                      <DropdownMenuItem
                        icon={Edit2}
                        onClick={() => handleStartEdit(comment)}
                      >
                        Edit Comment
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        icon={Trash2}
                        destructive
                        onClick={() => handleDelete(comment.id)}
                      >
                        Delete Comment
                      </DropdownMenuItem>
                    )}
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Content or Editing Textarea */}
            {isEditing ? (
              <div className="space-y-2 pt-1">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand leading-relaxed"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="brand"
                    size="xs"
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={!editingContent.trim() || isSubmitting}
                    leftIcon={Save}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <FormattedCommentContent content={comment.content} />
            )}
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

