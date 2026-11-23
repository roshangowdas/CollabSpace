import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'
import { consumeRateLimit, RATE_LIMIT_PRESETS } from '@/utils/rateLimiter'

/**
 * Permitted member invitation roles.
 * Owner role is strictly prohibited from invitations per project requirements.
 */
export const INVITATION_ROLES = [
  { value: 'Admin', label: 'Admin (Manage workspace members, projects & settings)' },
  { value: 'Developer', label: 'Developer (Code integrations, create tasks, PRs & docs)' },
  { value: 'Designer', label: 'Designer (UI/UX specs, canvas whiteboards & designs)' },
  { value: 'Tester', label: 'Tester (Issue QA, bug reports, and task verification)' },
  { value: 'Member', label: 'Member (General collaboration, chat, tasks & docs)' },
]

// Mock demo pending invitations (clearly separated per AGENTS.md rules)
const DEMO_PENDING_INVITATIONS = [
  {
    id: 'demo-inv-1',
    workspace_id: 'demo-ws-acme-corp',
    email: 'developer.jane@partner.io',
    role: 'Developer',
    token: 'demo-token-jane-dev-2026',
    status: 'pending',
    expires_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-inv-2',
    workspace_id: 'demo-ws-acme-corp',
    email: 'ux.sam@designhouse.com',
    role: 'Designer',
    token: 'demo-token-sam-design-2026',
    status: 'pending',
    expires_at: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
]

/**
 * Creates and dispatches a workspace invitation.
 * Uses a secure server-side mechanism (Supabase Edge Function 'send-invitation')
 * with graceful database RPC fallback.
 * Never exposes the service_role key to client browsers.
 *
 * @param {{
 *   workspaceId: string,
 *   email: string,
 *   role: 'Admin'|'Developer'|'Designer'|'Tester'|'Member'
 * }} params
 * @returns {Promise<{ success: boolean, invitation: object, inviteUrl: string }>}
 */
export async function inviteWorkspaceMember({ workspaceId, email, role }) {
  if (!workspaceId || !email || !role) {
    throw new Error('Workspace ID, email, and role are required.')
  }

  // Rate limiting check
  consumeRateLimit(`invite:${workspaceId}`, RATE_LIMIT_PRESETS.WORKSPACE_INVITATION)

  const cleanEmail = email.trim().toLowerCase()
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://collabspace.app'

  // 1. Demo Mode Simulation
  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    const demoToken = `demo-token-${Date.now()}`
    const demoInvite = {
      id: `demo-inv-${Date.now()}`,
      workspace_id: workspaceId,
      email: cleanEmail,
      role,
      token: demoToken,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    }
    DEMO_PENDING_INVITATIONS.unshift(demoInvite)
    return {
      success: true,
      invitation: demoInvite,
      inviteUrl: `${origin}/invite/${demoToken}`,
    }
  }

  // 2. Attempt Edge Function invocation first (Secure server-side execution)
  try {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
      'send-invitation',
      {
        body: {
          workspaceId,
          email: cleanEmail,
          role,
          appOrigin: origin,
        },
      }
    )

    if (!edgeError && edgeData?.success) {
      return edgeData
    }
    if (edgeError && !edgeError.message?.includes('Failed to send')) {
      console.warn('[CollabSpace Invitations] Edge Function unavailable, falling back to database RPC:', edgeError.message)
    }
  } catch (err) {
    console.warn('[CollabSpace Invitations] Edge Function call skipped or offline, falling back to database RPC')
  }

  // 3. Direct Database RPC Fallback (create_workspace_invitation)
  try {
    const { data, error } = await supabase.rpc('create_workspace_invitation', {
      p_workspace_id: workspaceId,
      p_email: cleanEmail,
      p_role: role,
    })

    if (error) throw error

    return {
      success: true,
      invitation: data,
      inviteUrl: `${origin}/invite/${data.token}`,
    }
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Fetches invitation details by token for display on the public invitation acceptance page.
 *
 * @param {string} token
 * @returns {Promise<{
 *   valid: boolean,
 *   id?: string,
 *   workspace_id?: string,
 *   workspace_name?: string,
 *   workspace_slug?: string,
 *   workspace_logo?: string,
 *   email?: string,
 *   role?: string,
 *   expires_at?: string,
 *   inviter_name?: string,
 *   reason?: string
 * }>}
 */
export async function getInvitationDetails(token) {
  if (!token) {
    return { valid: false, reason: 'No invitation token provided.' }
  }

  // Handle Demo tokens
  if (!isSupabaseConfigured || token.startsWith('demo-token-')) {
    const found = DEMO_PENDING_INVITATIONS.find((i) => i.token === token)
    if (found) {
      if (new Date(found.expires_at) < new Date() || found.status !== 'pending') {
        return { valid: false, reason: 'Invitation has expired or already been accepted.' }
      }
      return {
        valid: true,
        id: found.id,
        workspace_id: found.workspace_id,
        workspace_name: 'Acme Corp',
        workspace_slug: 'acme-corp',
        workspace_logo: '',
        email: found.email,
        role: found.role,
        expires_at: found.expires_at,
        inviter_name: 'Alex Rivera (Workspace Owner)',
      }
    }
    // Token not found
    return {
      valid: false,
      reason: 'Invalid or expired invitation token.',
    }
  }

  try {
    const { data, error } = await supabase.rpc('get_invitation_by_token', {
      p_token: token,
    })

    if (error) throw error
    return data
  } catch (err) {
    console.warn('[CollabSpace Invitations] Failed to verify token:', err.message)
    return { valid: false, reason: err.message || 'Failed to verify invitation token.' }
  }
}

/**
 * Accepts a workspace invitation and joins the workspace.
 * Verifies that the authenticated user's email matches the invitation target.
 *
 * @param {string} token
 * @returns {Promise<{
 *   success: boolean,
 *   workspace_id: string,
 *   workspace_name: string,
 *   workspace_slug: string,
 *   role: string
 * }>}
 */
export async function acceptInvitation(token) {
  if (!token) throw new Error('Invitation token is required.')

  // Demo acceptance simulation
  if (!isSupabaseConfigured || token.startsWith('demo-token-')) {
    const inv = DEMO_PENDING_INVITATIONS.find((i) => i.token === token)
    if (inv) inv.status = 'accepted'
    return {
      success: true,
      workspace_id: 'demo-ws-acme-corp',
      workspace_name: 'Acme Corp',
      workspace_slug: 'acme-corp',
      role: inv?.role || 'Developer',
    }
  }

  try {
    const { data, error } = await supabase.rpc('accept_workspace_invitation', {
      p_token: token,
    })

    if (error) throw error
    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Fetches all pending invitations for a given workspace.
 *
 * @param {string} workspaceId
 * @returns {Promise<Array<object>>}
 */
export async function getPendingInvitations(workspaceId) {
  if (!workspaceId) return []

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    return DEMO_PENDING_INVITATIONS.filter(
      (inv) => inv.workspace_id === workspaceId && inv.status === 'pending'
    )
  }

  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('id, workspace_id, email, role, token, status, expires_at, created_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.warn('[CollabSpace Invitations] Error loading pending invitations:', err.message)
    return []
  }
}

/**
 * Revokes a pending workspace invitation (Owners and Admins only).
 *
 * @param {string} invitationId
 * @returns {Promise<boolean>}
 */
export async function revokeInvitation(invitationId) {
  if (!invitationId) throw new Error('Invitation ID is required.')

  if (!isSupabaseConfigured || invitationId.startsWith('demo-')) {
    const idx = DEMO_PENDING_INVITATIONS.findIndex((i) => i.id === invitationId)
    if (idx !== -1) {
      DEMO_PENDING_INVITATIONS[idx].status = 'revoked'
      DEMO_PENDING_INVITATIONS.splice(idx, 1)
    }
    return true
  }

  try {
    const { data, error } = await supabase.rpc('revoke_workspace_invitation', {
      p_invitation_id: invitationId,
    })

    if (error) throw error
    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Alias for getInvitationDetails to maintain semantic compatibility.
 */
export const verifyInvitationToken = getInvitationDetails

