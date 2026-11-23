// ==============================================================================
// CollabSpace Hocuspocus Server: Auth & Authorization
// File: server/auth.js
// Description:
//   Authenticates WebSocket connections using Supabase user identity tokens
//   and authorizes document access through workspace and project membership.
// ==============================================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

let supabaseAdmin = null
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Generate consistent collaborator cursor colors based on user ID
const COLLABORATOR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ef4444', // red
  '#14b8a6', // teal
]

export function getUserColor(userId = '') {
  if (!userId) return COLLABORATOR_COLORS[0]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length
  return COLLABORATOR_COLORS[index]
}

/**
 * Verifies a Supabase JWT authentication token or demo session.
 *
 * @param {string} token Bearer token or demo user identifier
 * @returns {Promise<object|null>} Authenticated user profile or null
 */
export async function verifySupabaseToken(token) {
  if (!token) return null

  // Support demo / offline mode testing tokens
  if (token.startsWith('demo-') || token.startsWith('test-') || token === 'demo-token') {
    const isAlex = token.includes('alex')
    const isElena = token.includes('elena')
    const userId = isAlex ? 'demo-user-alex' : isElena ? 'demo-user-elena' : 'demo-user-sarah'
    const name = isAlex ? 'Alex Rivera' : isElena ? 'Elena Rostova' : 'Sarah Connor'
    const email = isAlex ? 'alex@collabspace.app' : isElena ? 'elena@collabspace.app' : 'sarah@collabspace.app'

    return {
      id: userId,
      name,
      email,
      color: getUserColor(userId),
      avatar: '',
    }
  }

  // Supabase live verification
  if (supabaseAdmin) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !user) {
        console.error('[Hocuspocus Auth] Token verification failed:', error?.message)
        return null
      }

      // Fetch user profile metadata
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .single()

      const displayName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        profile?.username ||
        user.email?.split('@')[0] ||
        'Collaborator'

      return {
        id: user.id,
        name: displayName,
        email: user.email,
        color: getUserColor(user.id),
        avatar: profile?.avatar_url || user.user_metadata?.avatar_url || '',
      }
    } catch (err) {
      console.error('[Hocuspocus Auth] Exception during verification:', err)
      return null
    }
  }

  // Fallback default test user when Supabase is not actively provisioned
  return {
    id: 'test-user-id',
    name: 'Test Collaborator',
    email: 'test@collabspace.app',
    color: COLLABORATOR_COLORS[0],
    avatar: '',
  }
}

/**
 * Authorizes document access by checking workspace and project membership.
 *
 * @param {string} documentId Document UUID
 * @param {string} userId Authenticated User UUID
 * @returns {Promise<boolean>} True if authorized
 */
export async function checkDocumentAccess(documentId, userId) {
  if (!documentId || !userId) return false

  // Allow demo documents in offline/preview testing
  if (documentId.startsWith('demo-') || userId.startsWith('demo-') || userId.startsWith('test-')) {
    return true
  }

  if (!supabaseAdmin) return true

  try {
    // 1. Fetch document's workspace and project
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .select('id, workspace_id, project_id')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      console.warn(`[Hocuspocus Auth] Document ${documentId} not found`)
      return false
    }

    // 2. Check workspace membership
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', doc.workspace_id)
      .eq('user_id', userId)
      .single()

    if (memberError || !membership) {
      console.warn(`[Hocuspocus Auth] User ${userId} is not a member of workspace ${doc.workspace_id}`)
      return false
    }

    // 3. If assigned to a project, check project membership
    if (doc.project_id) {
      const { data: projectMember } = await supabaseAdmin
        .from('project_members')
        .select('role')
        .eq('project_id', doc.project_id)
        .eq('user_id', userId)
        .single()

      // Workspace owners and admins always have access
      const isPrivileged = ['Owner', 'Admin'].includes(membership.role)
      if (!isPrivileged && !projectMember) {
        console.warn(`[Hocuspocus Auth] User ${userId} is not a member of project ${doc.project_id}`)
        return false
      }
    }

    return true
  } catch (err) {
    console.error('[Hocuspocus Auth] Authorization check failed:', err)
    return false
  }
}
