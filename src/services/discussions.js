import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'

/**
 * Demonstration task comments for offline / test preview mode.
 * Clearly separated from real database records per AGENTS.md rules.
 */
export const DEMO_COMMENTS = [
  {
    id: 'demo-comment-1',
    task_id: 'demo-task-1',
    user_id: 'demo-user-sarah',
    content: 'Great progress on this! Please make sure @alex_rivera reviews the touch sensitivity constraints for mobile tablets.',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    user: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-comment-2',
    task_id: 'demo-task-1',
    user_id: 'demo-user-collabspace-uuid',
    content: 'Working on that now @sarah_j. Touch sensor has 200ms delay with 5px tolerance so scrolling works seamlessly.',
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    user: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
]

/**
 * Demonstration activity audit log events.
 */
export const DEMO_ACTIVITY = [
  {
    id: 'demo-act-1',
    workspace_id: 'demo-ws-acme-corp',
    user_id: 'demo-user-collabspace-uuid',
    action: 'status_changed',
    entity_type: 'task',
    entity_id: 'demo-task-1',
    entity_title: 'Implement drag-and-drop Kanban columns for task boards',
    details: {
      old_status: 'todo',
      new_status: 'in_progress',
    },
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    user: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-act-2',
    workspace_id: 'demo-ws-acme-corp',
    user_id: 'demo-user-sarah',
    action: 'assigned',
    entity_type: 'task',
    entity_id: 'demo-task-1',
    entity_title: 'Implement drag-and-drop Kanban columns for task boards',
    details: {
      old_assignee_id: null,
      new_assignee_id: 'demo-user-collabspace-uuid',
    },
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    user: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-act-3',
    workspace_id: 'demo-ws-acme-corp',
    user_id: 'demo-user-sarah',
    action: 'created',
    entity_type: 'task',
    entity_id: 'demo-task-1',
    entity_title: 'Implement drag-and-drop Kanban columns for task boards',
    details: {},
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    user: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
]

export const DEMO_ACTIVITIES = DEMO_ACTIVITY


/**
 * Fetches all comments for a specific task.
 *
 * @param {string} taskId
 * @returns {Promise<Array<object>>}
 */
export async function getTaskComments(taskId) {
  if (!taskId) return []

  if (!isSupabaseConfigured || taskId.startsWith('demo-')) {
    return DEMO_COMMENTS.filter((c) => c.task_id === taskId || taskId === 'demo-task-1')
  }

  try {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        id,
        task_id,
        user_id,
        content,
        created_at,
        updated_at,
        user:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) {
      throw handleDatabaseError(error)
    }

    return data || []
  } catch (err) {
    console.error('getTaskComments error:', err)
    return []
  }
}

/**
 * Creates a new comment on a task.
 *
 * @param {object} params
 * @param {string} params.taskId
 * @param {string} params.content
 * @param {string} params.userId
 * @param {string} [params.workspaceId]
 * @param {object} [params.currentUserProfile]
 * @returns {Promise<object>}
 */
export async function createTaskComment({
  taskId,
  content,
  userId,
  workspaceId,
  currentUserProfile,
}) {
  const trimmed = content?.trim()
  if (!trimmed) {
    throw new Error('Comment content cannot be empty.')
  }

  if (!isSupabaseConfigured || taskId.startsWith('demo-')) {
    const newDemoComment = {
      id: `demo-comment-${Date.now()}`,
      task_id: taskId,
      user_id: userId || 'demo-user-collabspace-uuid',
      content: trimmed,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: userId || 'demo-user-collabspace-uuid',
        full_name: currentUserProfile?.full_name || 'Alex Rivera (You)',
        username: currentUserProfile?.username || 'alex_rivera',
        avatar_url: currentUserProfile?.avatar_url || '',
      },
    }
    DEMO_COMMENTS.push(newDemoComment)

    // Add demo activity log
    DEMO_ACTIVITY.unshift({
      id: `demo-act-${Date.now()}`,
      workspace_id: workspaceId || 'demo-ws-acme-corp',
      user_id: userId || 'demo-user-collabspace-uuid',
      action: 'commented',
      entity_type: 'task',
      entity_id: taskId,
      entity_title: 'Task Comment',
      details: { comment_id: newDemoComment.id },
      created_at: new Date().toISOString(),
      user: newDemoComment.user,
    })

    return newDemoComment
  }

  try {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: userId,
        content: trimmed,
      })
      .select(`
        id,
        task_id,
        user_id,
        content,
        created_at,
        updated_at,
        user:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    // Broadcast new comment to peers via Supabase Realtime
    try {
      const channel = supabase.channel(`task-comments:${taskId}`)
      await channel.send({
        type: 'broadcast',
        event: 'new_comment',
        payload: { comment: data },
      })
    } catch (realtimeErr) {
      console.warn('Realtime comment broadcast warning:', realtimeErr)
    }

    return data
  } catch (err) {
    console.error('createTaskComment error:', err)
    throw err
  }
}

/**
 * Updates an existing comment (strictly author-only or RLS enforced).
 *
 * @param {string} commentId
 * @param {string} content
 * @param {string} currentUserId
 * @returns {Promise<object>}
 */
export async function updateTaskComment(commentId, content, currentUserId) {
  const trimmed = content?.trim()
  if (!trimmed) {
    throw new Error('Comment cannot be empty.')
  }

  if (!isSupabaseConfigured || commentId.startsWith('demo-')) {
    const idx = DEMO_COMMENTS.findIndex((c) => c.id === commentId)
    if (idx !== -1) {
      // Authorization check
      if (DEMO_COMMENTS[idx].user_id !== currentUserId) {
        throw new Error('You do not have permission to modify another user\'s comment.')
      }
      DEMO_COMMENTS[idx] = {
        ...DEMO_COMMENTS[idx],
        content: trimmed,
        updated_at: new Date().toISOString(),
      }
      return DEMO_COMMENTS[idx]
    }
    throw new Error('Comment not found.')
  }

  try {
    const { data, error } = await supabase
      .from('task_comments')
      .update({
        content: trimmed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', currentUserId) // Enforce author ownership
      .select(`
        id,
        task_id,
        user_id,
        content,
        created_at,
        updated_at,
        user:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    // Broadcast update to peers
    if (data?.task_id) {
      try {
        const channel = supabase.channel(`task-comments:${data.task_id}`)
        await channel.send({
          type: 'broadcast',
          event: 'update_comment',
          payload: { comment: data },
        })
      } catch (realtimeErr) {
        console.warn('Realtime comment update broadcast warning:', realtimeErr)
      }
    }

    return data
  } catch (err) {
    console.error('updateTaskComment error:', err)
    throw err
  }
}

/**
 * Deletes a comment (author or workspace admin/owner).
 *
 * @param {string} commentId
 * @param {string} currentUserId
 * @param {boolean} [isAdmin=false]
 * @param {string} [taskId]
 * @returns {Promise<boolean>}
 */
export async function deleteTaskComment(commentId, currentUserId, isAdmin = false, taskId = null) {
  if (!isSupabaseConfigured || commentId.startsWith('demo-')) {
    const idx = DEMO_COMMENTS.findIndex((c) => c.id === commentId)
    if (idx !== -1) {
      if (DEMO_COMMENTS[idx].user_id !== currentUserId && !isAdmin) {
        throw new Error('You do not have permission to delete this comment.')
      }
      DEMO_COMMENTS.splice(idx, 1)
      return true
    }
    return true
  }

  try {
    let query = supabase.from('task_comments').delete().eq('id', commentId)

    // If not admin, RLS requires author ownership
    if (!isAdmin) {
      query = query.eq('user_id', currentUserId)
    }

    const { error } = await query
    if (error) {
      throw handleDatabaseError(error)
    }

    // Broadcast deletion
    if (taskId) {
      try {
        const channel = supabase.channel(`task-comments:${taskId}`)
        await channel.send({
          type: 'broadcast',
          event: 'delete_comment',
          payload: { commentId },
        })
      } catch (realtimeErr) {
        console.warn('Realtime comment delete broadcast warning:', realtimeErr)
      }
    }

    return true
  } catch (err) {
    console.error('deleteTaskComment error:', err)
    throw err
  }
}

/**
 * Fetches the audit activity history for a specific task.
 *
 * @param {string} taskId
 * @returns {Promise<Array<object>>}
 */
export async function getTaskActivityHistory(taskId) {
  if (!taskId) return []

  if (!isSupabaseConfigured || taskId.startsWith('demo-')) {
    return DEMO_ACTIVITY.filter((a) => a.entity_id === taskId || taskId === 'demo-task-1')
  }

  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        workspace_id,
        user_id,
        action,
        entity_type,
        entity_id,
        entity_title,
        details,
        created_at,
        user:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('entity_type', 'task')
      .eq('entity_id', taskId)
      .order('created_at', { ascending: false })

    if (error) {
      throw handleDatabaseError(error)
    }

    return data || []
  } catch (err) {
    console.error('getTaskActivityHistory error:', err)
    return []
  }
}

/**
 * Formats activity action details into human-readable descriptions.
 *
 * @param {object} activity
 * @returns {string}
 */
export function formatActivityDescription(activity) {
  const { action, details = {} } = activity
  switch (action) {
    case 'status_changed':
      return `changed status from "${details.old_status?.replace('_', ' ') || 'Todo'}" to "${details.new_status?.replace('_', ' ') || 'In Progress'}"`
    case 'assigned':
      if (!details.new_assignee_id) {
        return 'unassigned this task'
      }
      return 'reassigned this task'
    case 'updated':
      if (details.field === 'due_date') {
        const oldDate = details.old_due_date ? new Date(details.old_due_date).toLocaleDateString() : 'None'
        const newDate = details.new_due_date ? new Date(details.new_due_date).toLocaleDateString() : 'None'
        return `changed due date from ${oldDate} to ${newDate}`
      }
      return 'updated task details'
    case 'commented':
      return 'added a comment'
    case 'created':
      return 'created this task'
    default:
      return `${action.replace('_', ' ')}`
  }
}

/**
 * Extracts mentioned usernames from comment text (e.g. "@alex_rivera", "@sarah_j").
 *
 * @param {string} text
 * @returns {Array<string>}
 */
export function extractMentions(text) {
  if (!text) return []
  const matches = text.match(/@([a-zA-Z0-9_]+)/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.substring(1).toLowerCase()))]
}

