import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare,
  Users,
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  ArrowDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import { MessageItem } from './MessageItem'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from '@/components/presence/TypingIndicator'
import { ProjectMembersPresenceList } from '@/components/presence/ProjectMembersPresenceList'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  getProjectMessages,
  sendChatMessage,
  updateChatMessage,
  deleteChatMessage,
  uploadChatAttachment,
  getChannelLastRead,
  markChannelAsRead,
} from '@/services/chat'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { usePresence } from '@/hooks/usePresence'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

function getDateLabel(isoDateString) {
  if (!isoDateString) return ''
  const date = new Date(isoDateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

export function ProjectChatRoom({
  project = null,
  channelName = 'general',
  workspaceId = null,
  className,
}) {
  const { user, profile } = useAuth()
  const { currentWorkspace, isAdmin } = useWorkspace()
  const {
    setActiveRoom,
    sendTyping,
    typingUsers,
    activeRoomMembers,
  } = usePresence()

  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [error, setError] = useState(null)
  const [lastReadTimestamp, setLastReadTimestamp] = useState(null)
  const [isPresenceListOpen, setIsPresenceListOpen] = useState(false)

  // Track room presence
  useEffect(() => {
    const roomId = project?.id || channelName
    setActiveRoom(roomId)
    return () => {
      setActiveRoom(null)
    }
  }, [project?.id, channelName, setActiveRoom])

  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const isFirstLoad = useRef(true)

  const activeWorkspaceId = workspaceId || currentWorkspace?.id || project?.workspace_id
  const channelKey = project?.id ? `proj-${project.id}` : `chan-${channelName}`

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Load Initial Message History
  const loadMessages = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const storedLastRead = getChannelLastRead(channelKey)
      setLastReadTimestamp(storedLastRead)

      const history = await getProjectMessages(project?.id, {
        limit: 30,
        channelName,
      })

      setMessages(history || [])
      setHasMore((history || []).length >= 30)

      // Mark channel as read
      markChannelAsRead(channelKey)
    } catch (err) {
      console.error('Failed to load chat messages:', err)
      setError('Unable to load message history.')
    } finally {
      setIsLoading(false)
    }
  }, [project?.id, channelName, channelKey])

  useEffect(() => {
    isFirstLoad.current = true
    loadMessages()
  }, [loadMessages])

  // Scroll to bottom on initial message load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && isFirstLoad.current) {
      scrollToBottom('auto')
      isFirstLoad.current = false
    }
  }, [isLoading, messages.length])

  // Load older messages (Pagination)
  const handleLoadMore = async () => {
    if (isLoadingMore || messages.length === 0) return
    setIsLoadingMore(true)
    try {
      const oldestTimestamp = messages[0].created_at
      const olderHistory = await getProjectMessages(project?.id, {
        limit: 30,
        beforeTimestamp: oldestTimestamp,
        channelName,
      })

      if (!olderHistory || olderHistory.length === 0) {
        setHasMore(false)
      } else {
        setMessages((prev) => {
          // De-duplicate by ID
          const existingIds = new Set(prev.map((m) => m.id))
          const fresh = olderHistory.filter((m) => !existingIds.has(m.id))
          return [...fresh, ...prev]
        })
        setHasMore(olderHistory.length >= 30)
      }
    } catch (err) {
      console.error('Failed to load older messages:', err)
      toast.error('Failed to load older messages.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Supabase Realtime Subscription with clean unmount
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const realtimeChannelName = project?.id
      ? `project-chat:${project.id}`
      : `workspace-chat:${channelName}`

    const channel = supabase.channel(realtimeChannelName)

    channel
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const newMsg = payload?.payload?.message
        if (newMsg) {
          setMessages((prev) => {
            // Avoid duplicate messages
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          markChannelAsRead(channelKey)
          setTimeout(() => scrollToBottom('smooth'), 100)
        }
      })
      .on('broadcast', { event: 'update_message' }, (payload) => {
        const updated = payload?.payload?.message
        if (updated) {
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          )
        }
      })
      .on('broadcast', { event: 'delete_message' }, (payload) => {
        const deletedId = payload?.payload?.messageId
        if (deletedId) {
          setMessages((prev) => prev.filter((m) => m.id !== deletedId))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [project?.id, channelName, channelKey])

  // Send Message
  const handleSendMessage = async ({ content, attachments, parentId }) => {
    if (!user) return
    setIsSending(true)
    setError(null)

    try {
      const newMsg = await sendChatMessage({
        projectId: project?.id || null,
        workspaceId: activeWorkspaceId,
        content,
        senderId: user.id,
        parentId,
        attachments,
        channelName,
        senderProfile: profile || {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Alex Rivera',
          username: user.user_metadata?.username || 'alex_rivera',
          avatar_url: user.user_metadata?.avatar_url || '',
        },
      })

      // Add to local state if not already there
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })

      setReplyingTo(null)
      markChannelAsRead(channelKey)
      setTimeout(() => scrollToBottom('smooth'), 50)
    } catch (err) {
      console.error('Failed to send message:', err)
      setError(err.message || 'Failed to send message.')
      toast.error(err.message || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  // Update Message
  const handleUpdateMessage = async (messageId, content) => {
    if (!user) return
    try {
      const updated = await updateChatMessage(messageId, content, user.id, project?.id)
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m))
      )
      toast.success('Message updated')
    } catch (err) {
      console.error('Failed to update message:', err)
      toast.error(err.message || 'Failed to update message')
      throw err
    }
  }

  // Delete Message
  const handleDeleteMessage = async (messageId) => {
    if (!user) return
    try {
      await deleteChatMessage(messageId, user.id, isAdmin, project?.id)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      toast.success('Message deleted')
    } catch (err) {
      console.error('Failed to delete message:', err)
      toast.error(err.message || 'Failed to delete message')
    }
  }

  // Upload Attachment
  const handleUploadAttachment = async (file) => {
    if (!user) throw new Error('Authentication required.')
    return await uploadChatAttachment(file, user.id)
  }

  const roomTitle = project ? project.name : `#${channelName}`
  const roomKey = project?.key

  return (
    <div className={cn('flex flex-col h-full bg-background overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card/70 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {roomKey && (
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 shrink-0">
              {roomKey}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-foreground truncate flex items-center gap-1.5">
              <span>{roomTitle}</span>
              {project && (
                <Badge variant="outline" size="xs" className="ml-1 text-[10px]">
                  {project.visibility === 'private' ? 'Private' : 'Workspace'}
                </Badge>
              )}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {project?.description || 'Real-time project collaboration & discussion room'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setIsPresenceListOpen(!isPresenceListOpen)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0',
              isPresenceListOpen
                ? 'bg-brand/10 text-brand border-brand/30'
                : 'bg-secondary/60 text-muted-foreground border-border/80 hover:text-foreground'
            )}
            title="Toggle active member presence"
          >
            <Users className="h-3.5 w-3.5" />
            <span>
              {activeRoomMembers.length}
              <span className="hidden sm:inline"> active</span>
              {project?.members ? ` / ${project.members.length}` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="mx-4 mt-2 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main Chat & Presence Split Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Message List Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4"
        >
          {/* Pagination: Load older messages button */}
          {hasMore && (
            <div className="flex justify-center pb-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-xs text-muted-foreground gap-1.5"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-brand" />
                    <span>Loading older messages...</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    <span>Load older messages</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Loading Spinner */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <span>Connecting to real-time chat...</span>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-2">
              <div className="p-3.5 rounded-lg bg-brand/10 text-brand">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Welcome to {roomTitle}!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                This is the start of the <strong className="text-foreground">{roomTitle}</strong> real-time chat room. Send a message or share an attachment to collaborate with the team.
              </p>
            </div>
          ) : (
            /* Render Messages with Date & Unread Dividers */
            messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1]
              const currDate = getDateLabel(msg.created_at)
              const prevDate = prevMsg ? getDateLabel(prevMsg.created_at) : null
              const showDateDivider = currDate !== prevDate

              // Unread indicator line
              const isUnread =
                lastReadTimestamp &&
                msg.sender_id !== user?.id &&
                new Date(msg.created_at).getTime() > new Date(lastReadTimestamp).getTime()
              const isFirstUnread =
                isUnread &&
                (!prevMsg ||
                  new Date(prevMsg.created_at).getTime() <= new Date(lastReadTimestamp).getTime())

              return (
                <React.Fragment key={msg.id}>
                  {/* Date Divider */}
                  {showDateDivider && (
                    <div className="relative flex items-center justify-center my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/70" />
                      </div>
                      <span className="relative z-10 rounded-full border border-border bg-card px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-2xs">
                        {currDate}
                      </span>
                    </div>
                  )}

                  {/* Unread Message Divider */}
                  {isFirstUnread && (
                    <div className="relative flex items-center justify-center my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-brand/60" />
                      </div>
                      <span className="relative z-10 rounded-full bg-brand text-brand-foreground px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        New Messages
                      </span>
                    </div>
                  )}

                  {/* Message Item */}
                  <MessageItem
                    message={msg}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                    onReply={(m) => setReplyingTo(m)}
                    onUpdate={handleUpdateMessage}
                    onDelete={handleDeleteMessage}
                  />
                </React.Fragment>
              )
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Live Presence List Side Panel */}
        {isPresenceListOpen && (
          <ProjectMembersPresenceList
            project={project}
            onClose={() => setIsPresenceListOpen(false)}
          />
        )}
      </div>

      {/* Live Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Bottom Sticky Input Bar */}
      <div className="p-3 sm:p-4 border-t border-border bg-card/90 backdrop-blur-xs shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          onUploadAttachment={handleUploadAttachment}
          onTyping={() => sendTyping(true)}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          isSending={isSending}
          placeholder={`Message ${roomTitle}...`}
        />
      </div>
    </div>
  )
}

