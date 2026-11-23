import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'

/**
 * Storage key for persisting last read timestamps per channel/project.
 */
const LAST_READ_STORAGE_KEY_PREFIX = 'collabspace_chat_last_read_'

/**
 * Demo seed messages for preview, development, and offline modes.
 * Adheres strictly to AGENTS.md rules separating demo and real data.
 */
export const DEMO_MESSAGES = [
  {
    id: 'demo-msg-1',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-apollo',
    channel_name: 'general',
    sender_id: 'demo-user-sarah',
    content: 'Good morning team! We are kicking off sprint 4 deliverables today. Please review the updated milestones in the project dashboard.',
    parent_id: null,
    attachments: [],
    is_pinned: false,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    sender: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
    parent: null,
  },
  {
    id: 'demo-msg-2',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-apollo',
    channel_name: 'general',
    sender_id: 'demo-user-david',
    content: 'Reviewing now. The API contracts look solid! I attached the revised OpenAPI specs preview below.',
    parent_id: null,
    attachments: [
      {
        id: 'demo-att-1',
        name: 'api_specs_v2.json',
        size: 24500,
        type: 'application/json',
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop',
      },
    ],
    is_pinned: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    sender: {
      id: 'demo-user-david',
      full_name: 'David Chen',
      username: 'david_c',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
    },
    parent: null,
  },
  {
    id: 'demo-msg-3',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-apollo',
    channel_name: 'general',
    sender_id: 'demo-user-collabspace-uuid',
    content: 'Awesome work @david_c! I will integrate the endpoints into the client service layer this afternoon.',
    parent_id: 'demo-msg-2',
    attachments: [],
    is_pinned: false,
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    sender: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
    parent: {
      id: 'demo-msg-2',
      sender_id: 'demo-user-david',
      content: 'Reviewing now. The API contracts look solid! I attached the revised OpenAPI specs preview below.',
      sender: {
        id: 'demo-user-david',
        full_name: 'David Chen',
        username: 'david_c',
      },
    },
  },
]

/**
 * Retrieves paginated messages for a project or workspace channel.
 *
 * @param {string} projectId
 * @param {object} options
 * @param {number} [options.limit=40]
 * @param {string} [options.beforeTimestamp=null]
 * @param {string} [options.channelName='general']
 * @returns {Promise<Array<object>>} Chronologically sorted messages (oldest to newest)
 */
export async function getProjectMessages(
  projectId,
  { limit = 40, beforeTimestamp = null, channelName = 'general', workspaceId = null } = {}
) {
  if (!projectId && !workspaceId) return []

  const isDemo =
    (projectId && projectId.startsWith('demo-')) ||
    (workspaceId && workspaceId.startsWith('demo-')) ||
    (!isSupabaseConfigured)

  if (isDemo) {
    let filtered = DEMO_MESSAGES.filter(
      (m) => (projectId ? m.project_id === projectId : m.channel_name === channelName)
    )

    if (beforeTimestamp) {
      filtered = filtered.filter(
        (m) => new Date(m.created_at).getTime() < new Date(beforeTimestamp).getTime()
      )
    }

    // Sort descending to take the latest 'limit', then reverse to return chronological
    const sortedDesc = [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const page = sortedDesc.slice(0, limit)
    return page.reverse()
  }

  try {
    let query = supabase
      .from('messages')
      .select(`
        id,
        workspace_id,
        project_id,
        channel_name,
        sender_id,
        content,
        parent_id,
        attachments,
        is_pinned,
        created_at,
        updated_at,
        sender:sender_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        parent:parent_id (
          id,
          sender_id,
          content,
          sender:sender_id (
            id,
            full_name,
            username
          )
        )
      `)

    if (projectId) {
      query = query.eq('project_id', projectId)
    } else {
      query = query.is('project_id', null).eq('channel_name', channelName)
    }

    if (beforeTimestamp) {
      query = query.lt('created_at', beforeTimestamp)
    }

    query = query.order('created_at', { ascending: false }).limit(limit)

    const { data, error } = await query

    if (error) {
      throw handleDatabaseError(error)
    }

    // Data is retrieved descending, reverse to ascending for chat flow
    return (data || []).reverse()
  } catch (err) {
    console.error('getProjectMessages error:', err)
    return []
  }
}

/**
 * Sends a message in a project chat room or channel.
 *
 * @param {object} params
 * @param {string} [params.projectId]
 * @param {string} params.workspaceId
 * @param {string} params.content
 * @param {string} params.senderId
 * @param {string} [params.parentId]
 * @param {Array<object>} [params.attachments]
 * @param {string} [params.channelName='general']
 * @param {object} [params.senderProfile]
 * @returns {Promise<object>}
 */
export async function sendChatMessage({
  projectId,
  workspaceId,
  content,
  senderId,
  parentId = null,
  attachments = [],
  channelName = 'general',
  senderProfile = null,
}) {
  const trimmed = content?.trim()
  if (!trimmed && (!attachments || attachments.length === 0)) {
    throw new Error('Message cannot be empty.')
  }

  if (!isSupabaseConfigured || (projectId && projectId.startsWith('demo-'))) {
    // Find parent message if replying
    let parentInfo = null
    if (parentId) {
      const p = DEMO_MESSAGES.find((m) => m.id === parentId)
      if (p) {
        parentInfo = {
          id: p.id,
          sender_id: p.sender_id,
          content: p.content,
          sender: {
            id: p.sender?.id || p.sender_id,
            full_name: p.sender?.full_name || 'Member',
            username: p.sender?.username || 'member',
          },
        }
      }
    }

    const newMsg = {
      id: `demo-msg-${Date.now()}`,
      workspace_id: workspaceId || 'demo-ws-acme-corp',
      project_id: projectId || 'demo-proj-apollo',
      channel_name: channelName || 'general',
      sender_id: senderId || 'demo-user-collabspace-uuid',
      content: trimmed || '',
      parent_id: parentId || null,
      attachments: attachments || [],
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: senderId || 'demo-user-collabspace-uuid',
        full_name: senderProfile?.full_name || 'Alex Rivera (You)',
        username: senderProfile?.username || 'alex_rivera',
        avatar_url: senderProfile?.avatar_url || '',
      },
      parent: parentInfo,
    }

    DEMO_MESSAGES.push(newMsg)
    return newMsg
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId || null,
        channel_name: channelName || 'general',
        sender_id: senderId,
        content: trimmed || '',
        parent_id: parentId || null,
        attachments: attachments || [],
      })
      .select(`
        id,
        workspace_id,
        project_id,
        channel_name,
        sender_id,
        content,
        parent_id,
        attachments,
        is_pinned,
        created_at,
        updated_at,
        sender:sender_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        parent:parent_id (
          id,
          sender_id,
          content,
          sender:sender_id (
            id,
            full_name,
            username
          )
        )
      `)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    // Broadcast to peer sessions via Realtime channel
    const channelKey = projectId ? `project-chat:${projectId}` : `workspace-chat:${channelName}`
    try {
      const channel = supabase.channel(channelKey)
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: { message: data },
      })
    } catch (realtimeErr) {
      console.warn('Realtime chat broadcast warning:', realtimeErr)
    }

    return data
  } catch (err) {
    console.error('sendChatMessage error:', err)
    throw err
  }
}

/**
 * Updates an existing message (strictly author-only).
 *
 * @param {string} messageId
 * @param {string} content
 * @param {string} currentUserId
 * @param {string} [projectId]
 * @returns {Promise<object>}
 */
export async function updateChatMessage(messageId, content, currentUserId, projectId = null) {
  const trimmed = content?.trim()
  if (!trimmed) {
    throw new Error('Message cannot be empty.')
  }

  if (!isSupabaseConfigured || messageId.startsWith('demo-')) {
    const idx = DEMO_MESSAGES.findIndex((m) => m.id === messageId)
    if (idx !== -1) {
      if (DEMO_MESSAGES[idx].sender_id !== currentUserId) {
        throw new Error('You do not have permission to modify another user\'s message.')
      }
      DEMO_MESSAGES[idx] = {
        ...DEMO_MESSAGES[idx],
        content: trimmed,
        updated_at: new Date().toISOString(),
      }
      return DEMO_MESSAGES[idx]
    }
    throw new Error('Message not found.')
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .update({
        content: trimmed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', currentUserId) // Enforce author ownership
      .select(`
        id,
        workspace_id,
        project_id,
        channel_name,
        sender_id,
        content,
        parent_id,
        attachments,
        is_pinned,
        created_at,
        updated_at,
        sender:sender_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        parent:parent_id (
          id,
          sender_id,
          content,
          sender:sender_id (
            id,
            full_name,
            username
          )
        )
      `)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    // Broadcast update
    const channelKey = projectId ? `project-chat:${projectId}` : `workspace-chat:${data.channel_name}`
    try {
      const channel = supabase.channel(channelKey)
      await channel.send({
        type: 'broadcast',
        event: 'update_message',
        payload: { message: data },
      })
    } catch (realtimeErr) {
      console.warn('Realtime chat update broadcast warning:', realtimeErr)
    }

    return data
  } catch (err) {
    console.error('updateChatMessage error:', err)
    throw err
  }
}

/**
 * Deletes a message (author or workspace admin/owner).
 *
 * @param {string} messageId
 * @param {string} currentUserId
 * @param {boolean} [isAdmin=false]
 * @param {string} [projectId=null]
 * @returns {Promise<boolean>}
 */
export async function deleteChatMessage(messageId, currentUserId, isAdmin = false, projectId = null) {
  if (!isSupabaseConfigured || messageId.startsWith('demo-')) {
    const idx = DEMO_MESSAGES.findIndex((m) => m.id === messageId)
    if (idx !== -1) {
      if (DEMO_MESSAGES[idx].sender_id !== currentUserId && !isAdmin) {
        throw new Error('You do not have permission to delete this message.')
      }
      DEMO_MESSAGES.splice(idx, 1)
      return true
    }
    return true
  }

  try {
    let query = supabase.from('messages').delete().eq('id', messageId)

    if (!isAdmin) {
      query = query.eq('sender_id', currentUserId)
    }

    const { error } = await query

    if (error) {
      throw handleDatabaseError(error)
    }

    // Broadcast delete
    if (projectId) {
      try {
        const channel = supabase.channel(`project-chat:${projectId}`)
        await channel.send({
          type: 'broadcast',
          event: 'delete_message',
          payload: { messageId },
        })
      } catch (realtimeErr) {
        console.warn('Realtime chat delete broadcast warning:', realtimeErr)
      }
    }

    return true
  } catch (err) {
    console.error('deleteChatMessage error:', err)
    throw err
  }
}

/**
 * Uploads a file attachment to Supabase Storage ('chat-attachments').
 *
 * @param {File} file
 * @param {string} userId
 * @returns {Promise<object>} Attachment object { id, name, size, type, url }
 */
export async function uploadChatAttachment(file, userId) {
  if (!file) throw new Error('No file provided.')

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File exceeds maximum upload size of 10 MB.')
  }

  if (!isSupabaseConfigured) {
    // Generate object URL for preview in offline mode
    const previewUrl = URL.createObjectURL(file)
    return {
      id: `att-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: previewUrl,
    }
  }

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.\.+/g, '')
    const filePath = `${userId || 'general'}/${Date.now()}_${cleanFileName}`

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw handleDatabaseError(error)
    }

    let fileUrl = null
    try {
      const { data: signedData, error: signError } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(data.path, 60 * 60 * 24 * 7) // 7 days signed URL
      if (!signError && signedData?.signedUrl) {
        fileUrl = signedData.signedUrl
      }
    } catch {
      // fallback if signed URL creation not supported
    }

    if (!fileUrl) {
      const { data: publicData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path)
      fileUrl = publicData.publicUrl
    }

    return {
      id: `att-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: fileUrl,
      storage_path: data.path,
    }
  } catch (err) {
    console.error('uploadChatAttachment error:', err)
    throw err
  }
}

/**
 * Gets the stored timestamp for when a channel was last read.
 *
 * @param {string} channelKey
 * @returns {string|null}
 */
export function getChannelLastRead(channelKey) {
  try {
    return localStorage.getItem(`${LAST_READ_STORAGE_KEY_PREFIX}${channelKey}`)
  } catch {
    return null
  }
}

/**
 * Marks a channel or project chat room as read.
 *
 * @param {string} channelKey
 */
export function markChannelAsRead(channelKey) {
  try {
    localStorage.setItem(
      `${LAST_READ_STORAGE_KEY_PREFIX}${channelKey}`,
      new Date().toISOString()
    )
  } catch (err) {
    console.warn('Failed to persist last read timestamp:', err)
  }
}

/**
 * Computes unread message count for a given message list and lastRead timestamp.
 *
 * @param {Array<object>} messages
 * @param {string|null} lastReadTimestamp
 * @param {string} currentUserId
 * @returns {number}
 */
export function countUnreadMessages(messages = [], lastReadTimestamp = null, currentUserId = null) {
  if (!lastReadTimestamp) return messages.filter((m) => m.sender_id !== currentUserId).length

  const readTime = new Date(lastReadTimestamp).getTime()
  return messages.filter(
    (m) =>
      m.sender_id !== currentUserId &&
      new Date(m.created_at).getTime() > readTime
  ).length
}

