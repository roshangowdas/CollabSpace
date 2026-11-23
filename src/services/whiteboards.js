// ==============================================================================
// CollabSpace Service: Collaborative Whiteboard & Realtime Canvas
// File: src/services/whiteboards.js
// Description:
//   Handles whiteboard CRUD, element-level operational persistence (avoiding whole-board
//   overwriting), Supabase Realtime Broadcast for live element sync and collaborator cursors,
//   and Supabase Presence for active participant tracking.
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase.js'

export const STICKY_COLORS = [
  { id: 'yellow', bg: '#fef08a', border: '#fde047', text: '#713f12', name: 'Yellow' },
  { id: 'green', bg: '#bbf7d0', border: '#86efac', text: '#14532d', name: 'Green' },
  { id: 'blue', bg: '#bfdbfe', border: '#93c5fd', text: '#1e3a8a', name: 'Blue' },
  { id: 'pink', bg: '#fbcfe8', border: '#f472b6', text: '#831843', name: 'Pink' },
  { id: 'purple', bg: '#e9d5ff', border: '#c084fc', text: '#581c87', name: 'Purple' },
  { id: 'orange', bg: '#fed7aa', border: '#fdba74', text: '#7c2d12', name: 'Orange' },
]

export const SHAPE_TYPES = {
  SELECT: 'select',
  PAN: 'pan',
  STICKY: 'sticky_note',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  ARROW: 'arrow',
  FREEHAND: 'path',
  TEXT: 'text',
}

export const DEMO_WHITEBOARDS = [
  {
    id: 'demo-wb-1',
    workspace_id: 'demo-workspace-uuid',
    project_id: 'demo-project-alpha',
    name: 'Sprint 24 Architecture Brainstorming',
    description: 'Service decomposition, event streaming, and API gateways',
    thumbnail_url: null,
    created_by: 'demo-user-sarah',
    created_at: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    canvas_state: { viewport: { x: 0, y: 0, zoom: 1 } },
    creator: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Connor',
      email: 'sarah@collabspace.app',
      avatar_url: '',
    },
    project: {
      id: 'demo-project-alpha',
      name: 'Project Alpha',
      color: '#6366f1',
    },
  },
  {
    id: 'demo-wb-2',
    workspace_id: 'demo-workspace-uuid',
    project_id: 'demo-project-beta',
    name: 'Mobile App Wireframes & User Journey',
    description: 'Onboarding funnel and checkout flow UX wireframing',
    thumbnail_url: null,
    created_by: 'demo-user-elena',
    created_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    canvas_state: { viewport: { x: 0, y: 0, zoom: 1 } },
    creator: {
      id: 'demo-user-elena',
      full_name: 'Elena Rostova',
      email: 'elena@collabspace.app',
      avatar_url: '',
    },
    project: {
      id: 'demo-project-beta',
      name: 'Mobile App Redesign',
      color: '#06b6d4',
    },
  },
]

export const DEMO_ELEMENTS = [
  {
    id: 'elem-sticky-1',
    whiteboard_id: 'demo-wb-1',
    element_type: 'sticky_note',
    properties: {
      x: 120,
      y: 100,
      width: 180,
      height: 160,
      color: '#fef08a',
      text: '🚀 Auth & RBAC Service:\nSupabase Auth + Row-Level Security',
      fontSize: 14,
    },
    z_index: 1,
    created_by: 'demo-user-sarah',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'elem-sticky-2',
    whiteboard_id: 'demo-wb-1',
    element_type: 'sticky_note',
    properties: {
      x: 360,
      y: 100,
      width: 180,
      height: 160,
      color: '#bbf7d0',
      text: '⚡ Realtime WebSockets:\nPresence + Cursors + Broadcast',
      fontSize: 14,
    },
    z_index: 2,
    created_by: 'demo-user-alex',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'elem-rect-1',
    whiteboard_id: 'demo-wb-1',
    element_type: 'rectangle',
    properties: {
      x: 200,
      y: 320,
      width: 260,
      height: 120,
      fill: '#f8fafc',
      stroke: '#64748b',
      strokeWidth: 2,
      text: 'PostgreSQL Core DB Cluster',
      fontSize: 14,
    },
    z_index: 3,
    created_by: 'demo-user-sarah',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'elem-arrow-1',
    whiteboard_id: 'demo-wb-1',
    element_type: 'arrow',
    properties: {
      startX: 210,
      startY: 260,
      endX: 280,
      endY: 320,
      stroke: '#6366f1',
      strokeWidth: 2,
    },
    z_index: 4,
    created_by: 'demo-user-sarah',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'elem-arrow-2',
    whiteboard_id: 'demo-wb-1',
    element_type: 'arrow',
    properties: {
      startX: 450,
      startY: 260,
      endX: 380,
      endY: 320,
      stroke: '#06b6d4',
      strokeWidth: 2,
    },
    z_index: 5,
    created_by: 'demo-user-alex',
    updated_at: new Date().toISOString(),
  },
]

let demoWhiteboardsStore = [...DEMO_WHITEBOARDS]
let demoElementsStore = [...DEMO_ELEMENTS]

/**
 * Retrieves whiteboards for a workspace with optional filters.
 */
export async function getWorkspaceWhiteboards(workspaceId, options = {}) {
  const { projectId, search } = options

  if (!workspaceId) return []

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    let results = demoWhiteboardsStore.filter((wb) => wb.workspace_id === workspaceId)

    if (projectId && projectId !== 'all') {
      results = results.filter((wb) => wb.project_id === projectId)
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim()
      results = results.filter(
        (wb) =>
          wb.name.toLowerCase().includes(q) ||
          (wb.description && wb.description.toLowerCase().includes(q))
      )
    }

    return results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  }

  try {
    let query = supabase
      .from('whiteboards')
      .select(`
        *,
        creator:created_by (
          id,
          full_name,
          email,
          avatar_url
        ),
        project:project_id (
          id,
          name,
          color
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })

    if (projectId && projectId !== 'all') {
      query = query.eq('project_id', projectId)
    }

    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching workspace whiteboards:', error)
      throw error
    }

    return data || []
  } catch (err) {
    console.error('getWorkspaceWhiteboards failed:', err)
    return []
  }
}

/**
 * Retrieves a single whiteboard by ID.
 */
export async function getWhiteboardById(whiteboardId) {
  if (!whiteboardId) throw new Error('Whiteboard ID is required.')

  if (!isSupabaseConfigured || whiteboardId.startsWith('demo-')) {
    const wb = demoWhiteboardsStore.find((w) => w.id === whiteboardId)
    if (!wb) throw new Error('Whiteboard not found.')
    return wb
  }

  const { data, error } = await supabase
    .from('whiteboards')
    .select(`
      *,
      creator:created_by (
        id,
        full_name,
        email,
        avatar_url
      ),
      project:project_id (
        id,
        name,
        color
      )
    `)
    .eq('id', whiteboardId)
    .single()

  if (error || !data) {
    throw new Error(`Whiteboard not found: ${error?.message || ''}`)
  }

  return data
}

/**
 * Creates a new whiteboard in a workspace.
 */
export async function createWhiteboard({
  workspaceId,
  projectId = null,
  name,
  description = '',
  userId,
}) {
  if (!workspaceId) throw new Error('Workspace ID is required.')
  const trimmedName = (name || '').trim()
  if (!trimmedName) throw new Error('Whiteboard name is required.')

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-') || userId?.startsWith('demo-') || userId?.startsWith('test-')) {
    const newBoard = {
      id: `demo-wb-${Date.now()}`,
      workspace_id: workspaceId,
      project_id: projectId || null,
      name: trimmedName,
      description: description || '',
      thumbnail_url: null,
      created_by: userId || 'demo-user-sarah',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      canvas_state: { viewport: { x: 0, y: 0, zoom: 1 } },
      creator: {
        id: userId || 'demo-user-sarah',
        full_name: 'Current User',
        email: 'user@collabspace.app',
        avatar_url: '',
      },
      project: null,
    }

    demoWhiteboardsStore.unshift(newBoard)
    return newBoard
  }

  const { data, error } = await supabase
    .from('whiteboards')
    .insert({
      workspace_id: workspaceId,
      project_id: projectId || null,
      name: trimmedName,
      description,
      created_by: userId,
    })
    .select(`
      *,
      creator:created_by (
        id,
        full_name,
        email,
        avatar_url
      ),
      project:project_id (
        id,
        name,
        color
      )
    `)
    .single()

  if (error) {
    console.error('Error creating whiteboard:', error)
    throw new Error(`Failed to create whiteboard: ${error.message}`)
  }

  return data
}

/**
 * Updates whiteboard metadata or canvas state.
 */
export async function updateWhiteboard(whiteboardId, updates = {}) {
  if (!whiteboardId) throw new Error('Whiteboard ID is required.')

  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  if (updates.name) {
    const trimmed = updates.name.trim()
    if (!trimmed) throw new Error('Whiteboard name cannot be empty.')
    payload.name = trimmed
  }

  if (!isSupabaseConfigured || whiteboardId.startsWith('demo-')) {
    const idx = demoWhiteboardsStore.findIndex((w) => w.id === whiteboardId)
    if (idx === -1) throw new Error('Whiteboard not found.')

    demoWhiteboardsStore[idx] = {
      ...demoWhiteboardsStore[idx],
      ...payload,
    }
    return demoWhiteboardsStore[idx]
  }

  const { data, error } = await supabase
    .from('whiteboards')
    .update(payload)
    .eq('id', whiteboardId)
    .select(`
      *,
      creator:created_by (
        id,
        full_name,
        email,
        avatar_url
      ),
      project:project_id (
        id,
        name,
        color
      )
    `)
    .single()

  if (error) {
    console.error('Error updating whiteboard:', error)
    throw new Error(`Failed to update whiteboard: ${error.message}`)
  }

  return data
}

/**
 * Deletes a whiteboard with role authorization.
 */
export async function deleteWhiteboard(whiteboardId, userId, userRole = 'Member') {
  if (!whiteboardId) throw new Error('Whiteboard ID is required.')

  if (!isSupabaseConfigured || whiteboardId.startsWith('demo-')) {
    const board = demoWhiteboardsStore.find((w) => w.id === whiteboardId)
    if (!board) throw new Error('Whiteboard not found.')

    const isCreator = board.created_by === userId
    const isPrivileged = ['Owner', 'Admin'].includes(userRole)

    if (!isCreator && !isPrivileged) {
      throw new Error('Permission denied: Only the board creator or a workspace Admin can delete this board.')
    }

    demoWhiteboardsStore = demoWhiteboardsStore.filter((w) => w.id !== whiteboardId)
    demoElementsStore = demoElementsStore.filter((e) => e.whiteboard_id !== whiteboardId)
    return true
  }

  const { data: board, error: fetchError } = await supabase
    .from('whiteboards')
    .select('id, created_by')
    .eq('id', whiteboardId)
    .single()

  if (fetchError || !board) {
    throw new Error('Whiteboard not found.')
  }

  const isCreator = board.created_by === userId
  const isPrivileged = ['Owner', 'Admin'].includes(userRole)

  if (!isCreator && !isPrivileged) {
    throw new Error('Permission denied: Only the board creator or a workspace Admin can delete this board.')
  }

  const { error } = await supabase
    .from('whiteboards')
    .delete()
    .eq('id', whiteboardId)

  if (error) {
    console.error('Error deleting whiteboard:', error)
    throw new Error(`Failed to delete whiteboard: ${error.message}`)
  }

  return true
}

// ==============================================================================
// Whiteboard Elements (Operational / Event-Based Synchronization)
// ==============================================================================

/**
 * Retrieves all elements for a whiteboard sorted by z_index.
 */
export async function getWhiteboardElements(whiteboardId) {
  if (!whiteboardId) return []

  if (!isSupabaseConfigured || whiteboardId.startsWith('demo-')) {
    return demoElementsStore
      .filter((e) => e.whiteboard_id === whiteboardId)
      .sort((a, b) => (a.z_index || 0) - (b.z_index || 0))
  }

  try {
    const { data, error } = await supabase
      .from('whiteboard_elements')
      .select('*')
      .eq('whiteboard_id', whiteboardId)
      .order('z_index', { ascending: true })

    if (error) {
      console.error('Error fetching whiteboard elements:', error)
      throw error
    }

    return data || []
  } catch (err) {
    console.error('getWhiteboardElements error:', err)
    return []
  }
}

/**
 * Saves a single element operationally (UPSERT without whole-board replacement).
 */
export async function saveWhiteboardElement({
  id,
  whiteboardId,
  elementType,
  properties,
  zIndex = 0,
  userId = null,
}) {
  if (!whiteboardId || !elementType) {
    throw new Error('whiteboardId and elementType are required.')
  }

  const elementId = id || `elem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const elementRecord = {
    id: elementId,
    whiteboard_id: whiteboardId,
    element_type: elementType,
    properties: properties || {},
    z_index: zIndex,
    created_by: userId,
    updated_at: new Date().toISOString(),
  }

  if (!isSupabaseConfigured || whiteboardId.startsWith('demo-') || userId?.startsWith('demo-') || userId?.startsWith('test-')) {
    const idx = demoElementsStore.findIndex((e) => e.id === elementId)
    if (idx >= 0) {
      demoElementsStore[idx] = {
        ...demoElementsStore[idx],
        ...elementRecord,
      }
    } else {
      demoElementsStore.push(elementRecord)
    }
    return elementRecord
  }

  const { data, error } = await supabase
    .from('whiteboard_elements')
    .upsert(elementRecord)
    .select()
    .single()

  if (error) {
    console.error('Error saving whiteboard element:', error)
    throw new Error(`Failed to save element: ${error.message}`)
  }

  return data
}

/**
 * Deletes a single whiteboard element.
 */
export async function deleteWhiteboardElement(elementId) {
  if (!elementId) return false

  if (!isSupabaseConfigured || elementId.startsWith('demo-') || elementId.startsWith('elem-')) {
    demoElementsStore = demoElementsStore.filter((e) => e.id !== elementId)
    return true
  }

  const { error } = await supabase
    .from('whiteboard_elements')
    .delete()
    .eq('id', elementId)

  if (error) {
    console.error('Error deleting whiteboard element:', error)
    throw new Error(`Failed to delete element: ${error.message}`)
  }

  return true
}

// ==============================================================================
// Realtime Collaboration & Participant Awareness Subscriptions
// ==============================================================================

/**
 * Subscribes to Supabase Realtime Broadcast and Presence for a whiteboard.
 *
 * @param {string} whiteboardId
 * @param {object} callbacks
 * @param {Function} callbacks.onElementChange Called when a remote peer creates, updates, or deletes an element
 * @param {Function} callbacks.onCursorMove Called when a peer moves their cursor
 * @param {Function} callbacks.onPresenceSync Called with list of online collaborators
 * @param {object} currentUser Current user profile for presence tracking
 * @returns {object} Subscription channel controller with broadcast and unsubscribe methods
 */
export function subscribeToWhiteboard(whiteboardId, callbacks = {}, currentUser = null) {
  const { onElementChange, onCursorMove, onPresenceSync } = callbacks

  if (!whiteboardId || !isSupabaseConfigured || whiteboardId.startsWith('demo-')) {
    // Offline simulation harness
    return {
      broadcastElement: (action, element) => {
        // No-op or self-trigger
      },
      broadcastCursor: (x, y) => {
        // No-op
      },
      unsubscribe: () => {},
    }
  }

  const channelName = `whiteboard:${whiteboardId}`
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
      presence: { key: currentUser?.id || 'anonymous' },
    },
  })

  // 1. Listen for operational element updates (element_created, element_updated, element_deleted)
  channel.on('broadcast', { event: 'element_change' }, ({ payload }) => {
    if (onElementChange && payload) {
      onElementChange(payload)
    }
  })

  // 2. Listen for collaborator cursor movements
  channel.on('broadcast', { event: 'cursor_move' }, ({ payload }) => {
    if (onCursorMove && payload) {
      onCursorMove(payload)
    }
  })

  // 3. Track participant presence
  channel.on('presence', { event: 'sync' }, () => {
    if (onPresenceSync) {
      const state = channel.presenceState()
      const participants = Object.values(state).flat()
      onPresenceSync(participants)
    }
  })

  // Subscribe and track presence
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED' && currentUser) {
      await channel.track({
        id: currentUser.id,
        name: currentUser.full_name || currentUser.name || 'Collaborator',
        avatar: currentUser.avatar_url || '',
        color: currentUser.color || '#3b82f6',
        onlineAt: new Date().toISOString(),
      })
    }
  })

  return {
    broadcastElement: (action, element) => {
      channel.send({
        type: 'broadcast',
        event: 'element_change',
        payload: { action, element },
      })
    },
    broadcastCursor: (x, y) => {
      if (!currentUser) return
      channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          userId: currentUser.id,
          userName: currentUser.full_name || currentUser.name || 'User',
          userColor: currentUser.color || '#3b82f6',
          x,
          y,
        },
      })
    },
    unsubscribe: () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    },
  }
}

/**
 * Resets demo whiteboard stores for unit testing
 */
export function resetDemoWhiteboards() {
  demoWhiteboardsStore = [...DEMO_WHITEBOARDS]
  demoElementsStore = [...DEMO_ELEMENTS]
}
