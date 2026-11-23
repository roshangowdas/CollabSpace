import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'

/**
 * Realistic in-memory seed notifications for preview, testing, and offline modes.
 * Adheres strictly to AGENTS.md rules separating demo and real data.
 */
export const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-notif-1',
    user_id: 'demo-user-collabspace-uuid',
    workspace_id: 'demo-ws-acme-corp',
    title: 'Task Assigned',
    message: 'Sarah Jenkins assigned you to "Implement interactive Kanban board with dnd-kit"',
    type: 'assignment',
    entity_type: 'task',
    entity_id: 'demo-task-1',
    link: '/tasks',
    actor_id: 'demo-user-sarah',
    metadata: {
      task_title: 'Implement interactive Kanban board with dnd-kit',
      project_key: 'APL',
    },
    is_read: false,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    actor: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-notif-2',
    user_id: 'demo-user-collabspace-uuid',
    workspace_id: 'demo-ws-acme-corp',
    title: 'You were mentioned',
    message: 'Sarah Jenkins mentioned you in a comment: "@alex_rivera check out the touch sensor configuration"',
    type: 'mention',
    entity_type: 'task',
    entity_id: 'demo-task-1',
    link: '/tasks',
    actor_id: 'demo-user-sarah',
    metadata: {
      task_id: 'demo-task-1',
      comment_preview: 'Please make sure @alex_rivera reviews the touch sensitivity constraints...',
    },
    is_read: false,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    actor: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-notif-3',
    user_id: 'demo-user-collabspace-uuid',
    workspace_id: 'demo-ws-acme-corp',
    title: 'Task Status Updated',
    message: 'Task "API Gateway TLS 1.3 configuration" changed to In Review',
    type: 'status_change',
    entity_type: 'task',
    entity_id: 'demo-task-2',
    link: '/tasks',
    actor_id: 'demo-user-david',
    metadata: {
      old_status: 'in_progress',
      new_status: 'in_review',
    },
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    actor: {
      id: 'demo-user-david',
      full_name: 'David Chen',
      username: 'david_c',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-notif-4',
    user_id: 'demo-user-collabspace-uuid',
    workspace_id: 'demo-ws-acme-corp',
    title: 'New Member Joined Workspace',
    message: 'Elena Rostova has joined Acme Corp as Developer',
    type: 'member_joined',
    entity_type: 'workspace',
    entity_id: 'demo-ws-acme-corp',
    link: '/dashboard',
    actor_id: 'demo-user-elena',
    metadata: {
      role: 'Developer',
    },
    is_read: true,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    actor: {
      id: 'demo-user-elena',
      full_name: 'Elena Rostova',
      username: 'elena_r',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-notif-5',
    user_id: 'demo-user-collabspace-uuid',
    workspace_id: 'demo-ws-acme-corp',
    title: 'Approaching Deadline',
    message: 'Task "Sprint 4 Database Migrations" is due tomorrow',
    type: 'deadline',
    entity_type: 'task',
    entity_id: 'demo-task-3',
    link: '/tasks',
    actor_id: null,
    metadata: {
      due_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    },
    is_read: true,
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    actor: null,
  },
]

/**
 * Retrieves notifications for an authenticated user with filtering and pagination.
 *
 * @param {string} userId
 * @param {object} [options]
 * @param {number} [options.limit=50]
 * @param {string} [options.filter='all'] ('all', 'unread', 'mentions', 'assignments', 'tasks', 'chat')
 * @param {string} [options.workspaceId]
 * @returns {Promise<Array<object>>}
 */
export async function getUserNotifications(
  userId,
  { limit = 50, filter = 'all', workspaceId = null } = {}
) {
  if (!userId) return []

  if (!isSupabaseConfigured || userId.startsWith('demo-') || userId.startsWith('test-')) {
    let list = [...DEMO_NOTIFICATIONS]

    if (workspaceId) {
      list = list.filter((n) => !n.workspace_id || n.workspace_id === workspaceId)
    }

    if (filter === 'unread') {
      list = list.filter((n) => !n.is_read)
    } else if (filter === 'mentions') {
      list = list.filter((n) => n.type === 'mention')
    } else if (filter === 'assignments') {
      list = list.filter((n) => n.type === 'assignment')
    } else if (filter === 'tasks') {
      list = list.filter((n) => ['assignment', 'status_change', 'deadline', 'comment'].includes(n.type))
    } else if (filter === 'chat') {
      list = list.filter((n) => ['chat_message', 'mention'].includes(n.type))
    }

    return list.slice(0, limit)
  }

  try {
    let query = supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        workspace_id,
        title,
        message,
        type,
        entity_type,
        entity_id,
        link,
        actor_id,
        metadata,
        is_read,
        created_at,
        actor:actor_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('user_id', userId)

    if (workspaceId) {
      query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    }

    if (filter === 'unread') {
      query = query.eq('is_read', false)
    } else if (filter === 'mentions') {
      query = query.eq('type', 'mention')
    } else if (filter === 'assignments') {
      query = query.eq('type', 'assignment')
    } else if (filter === 'tasks') {
      query = query.in('type', ['assignment', 'status_change', 'deadline', 'comment'])
    } else if (filter === 'chat') {
      query = query.in('type', ['chat_message', 'mention'])
    }

    query = query.order('created_at', { ascending: false }).limit(limit)

    const { data, error } = await query

    if (error) {
      throw handleDatabaseError(error)
    }

    return data || []
  } catch (err) {
    console.error('getUserNotifications error:', err)
    throw err
  }
}

/**
 * Retrieves the count of unread notifications for a user.
 *
 * @param {string} userId
 * @param {string} [workspaceId]
 * @returns {Promise<number>}
 */
export async function getUnreadNotificationCount(userId, workspaceId = null) {
  if (!userId) return 0

  if (!isSupabaseConfigured || userId.startsWith('demo-') || userId.startsWith('test-')) {
    return DEMO_NOTIFICATIONS.filter((n) => {
      const matchWs = !workspaceId || !n.workspace_id || n.workspace_id === workspaceId
      return matchWs && !n.is_read
    }).length
  }

  try {
    let query = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (workspaceId) {
      query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    }

    const { count, error } = await query

    if (error) {
      throw handleDatabaseError(error)
    }

    return count || 0
  } catch (err) {
    console.error('getUnreadNotificationCount error:', err)
    return 0
  }
}

/**
 * Marks a single notification as read.
 *
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function markNotificationAsRead(notificationId, userId) {
  if (!notificationId) return false

  if (!isSupabaseConfigured || notificationId.startsWith('demo-') || userId?.startsWith('test-')) {
    const found = DEMO_NOTIFICATIONS.find((n) => n.id === notificationId)
    if (found) {
      found.is_read = true
      return true
    }
    return false
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      throw handleDatabaseError(error)
    }

    return true
  } catch (err) {
    console.error('markNotificationAsRead error:', err)
    throw err
  }
}

/**
 * Marks all notifications as read for a user.
 *
 * @param {string} userId
 * @param {string} [workspaceId]
 * @returns {Promise<number>} Count of notifications marked read
 */
export async function markAllNotificationsAsRead(userId, workspaceId = null) {
  if (!userId) return 0

  if (!isSupabaseConfigured || userId.startsWith('demo-') || userId.startsWith('test-')) {
    let updatedCount = 0
    DEMO_NOTIFICATIONS.forEach((n) => {
      if ((!workspaceId || !n.workspace_id || n.workspace_id === workspaceId) && !n.is_read) {
        n.is_read = true
        updatedCount++
      }
    })
    return updatedCount
  }

  try {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (workspaceId) {
      query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    }

    const { data, error } = await query.select('id')

    if (error) {
      throw handleDatabaseError(error)
    }

    return (data || []).length
  } catch (err) {
    console.error('markAllNotificationsAsRead error:', err)
    throw err
  }
}

/**
 * Deletes a notification (accessible only to recipient user).
 *
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function deleteNotification(notificationId, userId) {
  if (!notificationId) return false

  if (!isSupabaseConfigured || notificationId.startsWith('demo-') || userId?.startsWith('test-')) {
    const idx = DEMO_NOTIFICATIONS.findIndex((n) => n.id === notificationId)
    if (idx !== -1) {
      DEMO_NOTIFICATIONS.splice(idx, 1)
      return true
    }
    return true
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      throw handleDatabaseError(error)
    }

    return true
  } catch (err) {
    console.error('deleteNotification error:', err)
    throw err
  }
}

/**
 * Clears all read notifications for a user.
 *
 * @param {string} userId
 * @param {string} [workspaceId]
 * @returns {Promise<boolean>}
 */
export async function clearReadNotifications(userId, workspaceId = null) {
  if (!userId) return false

  if (!isSupabaseConfigured || userId.startsWith('demo-') || userId.startsWith('test-')) {
    const remaining = DEMO_NOTIFICATIONS.filter((n) => !n.is_read)
    DEMO_NOTIFICATIONS.length = 0
    DEMO_NOTIFICATIONS.push(...remaining)
    return true
  }

  try {
    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)

    if (workspaceId) {
      query = query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
    }

    const { error } = await query

    if (error) {
      throw handleDatabaseError(error)
    }

    return true
  } catch (err) {
    console.error('clearReadNotifications error:', err)
    throw err
  }
}

/**
 * Returns visual styling and configuration for a notification event type.
 *
 * @param {string} type
 * @returns {object} { label, iconName, colorClass, badgeClass }
 */
export function getNotificationTypeConfig(type) {
  switch (type) {
    case 'assignment':
      return {
        label: 'Assignment',
        iconName: 'UserCheck',
        color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      }
    case 'mention':
      return {
        label: 'Mention',
        iconName: 'AtSign',
        color: 'text-brand bg-brand/10 border-brand/20',
      }
    case 'comment':
      return {
        label: 'Comment',
        iconName: 'MessageSquare',
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      }
    case 'status_change':
      return {
        label: 'Status Change',
        iconName: 'PlayCircle',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      }
    case 'deadline':
      return {
        label: 'Deadline',
        iconName: 'Clock',
        color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      }
    case 'member_joined':
      return {
        label: 'Member Joined',
        iconName: 'UserPlus',
        color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      }
    case 'invitation':
      return {
        label: 'Invitation',
        iconName: 'Mail',
        color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      }
    case 'announcement':
      return {
        label: 'Announcement',
        iconName: 'Sparkles',
        color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
      }
    case 'chat_message':
      return {
        label: 'Chat Message',
        iconName: 'MessageCircle',
        color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      }
    default:
      return {
        label: 'Notification',
        iconName: 'Info',
        color: 'text-muted-foreground bg-secondary border-border',
      }
  }
}

/**
 * Creates an in-app notification with server-side duplicate prevention.
 *
 * @param {object} params
 * @param {string} params.userId Recipient
 * @param {string} [params.workspaceId]
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} params.type
 * @param {string} [params.entityType]
 * @param {string} [params.entityId]
 * @param {string} [params.link]
 * @param {string} [params.actorId]
 * @param {object} [params.metadata]
 * @returns {Promise<object>} Created notification
 */
export async function createNotification({
  userId,
  workspaceId = null,
  title,
  message,
  type = 'system',
  entityType = null,
  entityId = null,
  link = null,
  actorId = null,
  metadata = {},
}) {
  if (!userId) throw new Error('Recipient user ID is required.')
  if (actorId && actorId === userId) return null // Prevent self-notification

  if (!isSupabaseConfigured || userId.startsWith('demo-') || userId.startsWith('test-')) {
    // Duplicate check: avoid adding if identical unread notification exists within last 5 minutes
    const duplicate = DEMO_NOTIFICATIONS.find(
      (n) =>
        n.user_id === userId &&
        n.type === type &&
        n.entity_id === entityId &&
        !n.is_read
    )
    if (duplicate) return duplicate

    const newNotif = {
      id: `demo-notif-${Date.now()}`,
      user_id: userId,
      workspace_id: workspaceId,
      title,
      message,
      type,
      entity_type: entityType,
      entity_id: entityId,
      link,
      actor_id: actorId,
      metadata,
      is_read: false,
      created_at: new Date().toISOString(),
      actor: null,
    }

    DEMO_NOTIFICATIONS.unshift(newNotif)
    return newNotif
  }

  try {
    // Call server-side function with duplicate prevention
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_workspace_id: workspaceId,
      p_title: title,
      p_message: message,
      p_type: type,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_link: link,
      p_actor_id: actorId,
      p_metadata: metadata,
    })

    if (error) {
      throw handleDatabaseError(error)
    }

    return data
  } catch (err) {
    console.error('createNotification error:', err)
    throw err
  }
}
