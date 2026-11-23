import React, { useState, useEffect, useCallback } from 'react'
import { MessageSquare, History, Loader2, AlertCircle } from 'lucide-react'
import { TaskCommentsList } from './TaskCommentsList'
import { TaskCommentInput } from './TaskCommentInput'
import { TaskActivityTimeline } from './TaskActivityTimeline'
import {
  getTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  getTaskActivityHistory,
} from '@/services/discussions'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

export function TaskDiscussionsSection({
  task,
  members = [],
  workspaceId,
  className,
}) {
  const { user, profile } = useAuth()
  const { currentWorkspace, isAdmin } = useWorkspace()

  const [activeTab, setActiveTab] = useState('discussion') // 'discussion' | 'activity'
  const [comments, setComments] = useState([])
  const [activities, setActivities] = useState([])
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [isLoadingActivities, setIsLoadingActivities] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const activeWorkspaceId = workspaceId || currentWorkspace?.id || task?.workspace_id

  // Load comments
  const loadComments = useCallback(async () => {
    if (!task?.id) return
    setIsLoadingComments(true)
    setError(null)
    try {
      const data = await getTaskComments(task.id)
      setComments(data || [])
    } catch (err) {
      console.error('Failed to load task comments:', err)
      setError('Failed to load discussion comments.')
    } finally {
      setIsLoadingComments(false)
    }
  }, [task?.id])

  // Load activity history
  const loadActivities = useCallback(async () => {
    if (!task?.id) return
    setIsLoadingActivities(true)
    try {
      const data = await getTaskActivityHistory(task.id)
      setActivities(data || [])
    } catch (err) {
      console.error('Failed to load task activity history:', err)
    } finally {
      setIsLoadingActivities(false)
    }
  }, [task?.id])

  useEffect(() => {
    if (task?.id) {
      loadComments()
      loadActivities()
    }
  }, [task?.id, loadComments, loadActivities])

  // Set up Supabase Realtime subscription
  useEffect(() => {
    if (!task?.id || !isSupabaseConfigured) return

    const channelName = `task-discussions:${task.id}`
    const channel = supabase.channel(channelName)

    // Listen for peer broadcast events
    channel
      .on('broadcast', { event: 'new_comment' }, (payload) => {
        const newComment = payload?.payload?.comment
        if (newComment && newComment.task_id === task.id) {
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev
            return [...prev, newComment]
          })
          // Refresh activities to show new comment activity
          loadActivities()
        }
      })
      .on('broadcast', { event: 'update_comment' }, (payload) => {
        const updated = payload?.payload?.comment
        if (updated) {
          setComments((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
          )
        }
      })
      .on('broadcast', { event: 'delete_comment' }, (payload) => {
        const deletedId = payload?.payload?.commentId
        if (deletedId) {
          setComments((prev) => prev.filter((c) => c.id !== deletedId))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [task?.id, loadActivities])

  // Add new comment
  const handleAddComment = async (content) => {
    if (!user || !task?.id) return
    setIsSubmitting(true)
    setError(null)

    try {
      const newComment = await createTaskComment({
        taskId: task.id,
        content,
        userId: user.id,
        workspaceId: activeWorkspaceId,
        currentUserProfile: profile || {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Alex Rivera',
          username: user.user_metadata?.username || 'alex_rivera',
          avatar_url: user.user_metadata?.avatar_url || '',
        },
      })

      // Add to local comments state if not already there
      setComments((prev) => {
        if (prev.some((c) => c.id === newComment.id)) return prev
        return [...prev, newComment]
      })

      // Optimistically add to activities
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          action: 'commented',
          entity_type: 'task',
          entity_id: task.id,
          details: { comment_id: newComment.id },
          created_at: new Date().toISOString(),
          user: newComment.user,
        },
        ...prev,
      ])

      toast.success('Comment added')
    } catch (err) {
      console.error('Failed to post comment:', err)
      setError(err.message || 'Failed to post comment. Please try again.')
      toast.error(err.message || 'Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update comment
  const handleUpdateComment = async (commentId, content) => {
    if (!user) return
    try {
      const updated = await updateTaskComment(commentId, content, user.id)
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c))
      )
      toast.success('Comment updated')
    } catch (err) {
      console.error('Failed to edit comment:', err)
      toast.error(err.message || 'Failed to edit comment')
      throw err
    }
  }

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!user) return
    try {
      await deleteTaskComment(commentId, user.id, isAdmin, task.id)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      toast.success('Comment deleted')
    } catch (err) {
      console.error('Failed to delete comment:', err)
      toast.error(err.message || 'Failed to delete comment')
    }
  }

  return (
    <div className={cn('space-y-4 pt-4 border-t border-border', className)}>
      {/* Tab selection headers */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('discussion')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'discussion'
                ? 'bg-secondary text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Discussion</span>
            <span className="ml-1 rounded-full bg-brand/10 text-brand px-1.5 py-0.2 text-[10px] font-mono">
              {comments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'activity'
                ? 'bg-secondary text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            )}
          >
            <History className="h-3.5 w-3.5" />
            <span>Activity History</span>
            <span className="ml-1 rounded-full bg-muted text-muted-foreground px-1.5 py-0.2 text-[10px] font-mono">
              {activities.length}
            </span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'discussion' ? (
        <div className="space-y-4">
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
              <span>Loading discussion...</span>
            </div>
          ) : (
            <TaskCommentsList
              comments={comments}
              currentUserId={user?.id}
              isWorkspaceAdmin={isAdmin}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
            />
          )}

          {/* New Comment Input */}
          <div className="pt-2">
            <TaskCommentInput
              onSubmit={handleAddComment}
              members={members}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {isLoadingActivities ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
              <span>Loading activity history...</span>
            </div>
          ) : (
            <TaskActivityTimeline activities={activities} />
          )}
        </div>
      )}
    </div>
  )
}

