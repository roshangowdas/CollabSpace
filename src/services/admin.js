// ==============================================================================
// CollabSpace Service: Workspace Administration & RBAC Management
// File: src/services/admin.js
// Description:
//   Administrative control panel services for workspace owners and admins.
//   Enforces both frontend and database-level authorization:
//   - Prevents self-promotion to owner
//   - Prevents unauthorized role modifications across workspaces
//   - Prevents removing the workspace owner
//   - Enforces role-based administration restrictions
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'
import { consumeRateLimit, RATE_LIMIT_PRESETS } from '@/utils/rateLimiter'
import { DEMO_PROJECTS } from './projects'
import { DEMO_TASKS } from './tasks'
import { DEMO_ACTIVITIES } from './discussions'

export const ADMIN_ROLES = [
  'Owner',
  'Admin',
  'Developer',
  'Designer',
  'Tester',
  'Member',
  'Viewer',
]

export const ROLE_CONFIG = {
  Owner: {
    label: 'Owner',
    description: 'Full workspace ownership, billing, destructive actions, and ownership transfer',
    badgeVariant: 'purple',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    level: 100,
  },
  Admin: {
    label: 'Admin',
    description: 'Manage members, projects, invitations, and workspace settings',
    badgeVariant: 'blue',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    level: 80,
  },
  Developer: {
    label: 'Developer',
    description: 'Create tasks, write documentation, manage pull requests, and deploy integrations',
    badgeVariant: 'cyan',
    badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    level: 50,
  },
  Designer: {
    label: 'Designer',
    description: 'Design system specs, canvas whiteboards, wireframes, and design task reviews',
    badgeVariant: 'pink',
    badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    level: 50,
  },
  Tester: {
    label: 'Tester',
    description: 'QA testing, issue bug tracking, acceptance criteria, and task verification',
    badgeVariant: 'orange',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    level: 50,
  },
  Member: {
    label: 'Member',
    description: 'General collaboration, real-time chat, task execution, and team docs',
    badgeVariant: 'secondary',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    level: 30,
  },
  Viewer: {
    label: 'Viewer',
    description: 'Read-only visibility into projects, documents, tasks, and whiteboards',
    badgeVariant: 'outline',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    level: 10,
  },
}

let demoAdminMembers = [
  {
    id: 'demo-member-1',
    workspace_id: 'demo-ws-acme-corp',
    user_id: 'demo-user-collabspace-uuid',
    email: 'alex.rivera@collabspace.demo',
    full_name: 'Alex Rivera',
    username: 'alex_rivera',
    role: 'Owner',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    bio: 'Lead product architect & collaborative systems engineer.',
    joined_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-member-2',
    workspace_id: 'demo-ws-acme-corp',
    user_id: 'demo-user-sarah',
    email: 'sarah.jenkins@acme.inc',
    full_name: 'Sarah Jenkins',
    username: 'sarah_j',
    role: 'Admin',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    bio: 'Frontend platform lead & design systems steward.',
    joined_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-member-3',
    workspace_id: 'demo-ws-acme-corp',
    user_id: 'demo-user-david',
    email: 'david.chen@acme.inc',
    full_name: 'David Chen',
    username: 'david_chen',
    role: 'Developer',
    avatar_url: '',
    bio: 'Distributed infrastructure and backend database specialist.',
    joined_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-member-4',
    workspace_id: 'demo-ws-acme-corp',
    user_id: 'demo-user-elena',
    email: 'elena.rostova@acme.inc',
    full_name: 'Elena Rostova',
    username: 'elena_r',
    role: 'Designer',
    avatar_url: '',
    bio: 'Product manager for core search, task workflows, and notifications.',
    joined_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-member-5',
    workspace_id: 'demo-ws-acme-corp',
    user_id: 'demo-user-marcus',
    email: 'marcus.vance@acme.inc',
    full_name: 'Marcus Vance',
    username: 'marcus_v',
    role: 'Tester',
    avatar_url: '',
    bio: 'Quality assurance and usability auditing.',
    joined_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
]

let demoAdminInvites = [
  {
    id: 'demo-inv-1',
    workspace_id: 'demo-ws-acme-corp',
    email: 'developer.jane@partner.io',
    role: 'Developer',
    token: 'demo-token-jane-dev-2026',
    status: 'pending',
    invited_by: 'demo-user-collabspace-uuid',
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
    invited_by: 'demo-user-sarah',
    expires_at: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
]

let demoAdminActivities = [...DEMO_ACTIVITIES]

/**
 * Validates whether the caller has workspace administrative rights (Owner or Admin).
 */
export function assertAdminAccess(callerRole) {
  if (!callerRole || !['Owner', 'Admin'].includes(callerRole)) {
    throw new Error('Access denied: You do not have administrative privileges for this workspace.')
  }
}

/**
 * Fetches comprehensive workspace administration overview and statistics.
 *
 * @param {string} workspaceId
 * @param {object} caller - { id, role }
 * @returns {Promise<object>}
 */
export async function getWorkspaceAdminOverview(workspaceId, caller = {}) {
  if (!workspaceId) throw new Error('Workspace ID is required.')
  assertAdminAccess(caller.role)

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    return {
      workspace: { id: workspaceId, name: 'Workspace', slug: 'workspace', plan: 'Pro' },
      callerRole: caller.role,
      totalMembers: 0,
      totalProjects: 0,
      activeProjects: 0,
      pendingInvites: 0,
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
    }
  }

  try {
    // Direct real queries against Supabase PostgreSQL database tables
    const [membersRes, projectsRes, tasksRes, invitesRes, wsRes] = await Promise.all([
      supabase
        .from('workspace_members')
        .select('id, role', { count: 'exact' })
        .eq('workspace_id', workspaceId),
      supabase
        .from('projects')
        .select('id, name, status, color')
        .eq('workspace_id', workspaceId),
      supabase
        .from('tasks')
        .select('id, status, priority, due_date, project_id')
        .eq('workspace_id', workspaceId),
      supabase
        .from('invitations')
        .select('id', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending'),
      supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single(),
    ])

    const projects = projectsRes.data || []
    const tasks = tasksRes.data || []
    const totalMembers = membersRes.count ?? membersRes.data?.length ?? 0
    const totalProjects = projects.length
    const activeProjects = projects.filter((p) => p.status === 'active').length
    const pendingInvites = invitesRes.count ?? invitesRes.data?.length ?? 0
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'done').length
    const inProgressTasks = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length
    const now = new Date()
    const overdueTasks = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && t.status !== 'completed' && t.status !== 'done'
    ).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      workspace: wsRes.data || { id: workspaceId, name: 'Workspace', slug: 'workspace' },
      callerRole: caller.role,
      totalMembers,
      totalProjects,
      activeProjects,
      pendingInvites,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
    }
  } catch (err) {
    console.error('getWorkspaceAdminOverview error:', err)
    throw err
  }
}

/**
 * Fetches all members in the workspace for administration.
 */
export async function getAdminWorkspaceMembers(workspaceId, caller = {}) {
  if (!workspaceId) throw new Error('Workspace ID is required.')
  assertAdminAccess(caller.role)

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    return demoAdminMembers.filter((m) => m.workspace_id === workspaceId || workspaceId === 'demo-ws-acme-corp')
  }

  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        id,
        role,
        created_at,
        user_id,
        profile:profiles (
          id,
          full_name,
          username,
          avatar_url,
          bio
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) throw handleDatabaseError(error)

    return (data || []).map((m) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.created_at,
      full_name: m.profile?.full_name || 'Team Member',
      username: m.profile?.username || 'member',
      avatar_url: m.profile?.avatar_url || '',
      bio: m.profile?.bio || '',
    }))
  } catch (err) {
    console.error('getAdminWorkspaceMembers error:', err)
    throw err
  }
}

/**
 * Updates a member's role with strict RBAC rules:
 * - Cannot promote oneself to Owner
 * - Cannot modify the workspace owner unless caller is Owner
 * - Admin cannot promote anyone to Owner
 * - Admin cannot modify another Admin
 * - Scoped strictly to the specified workspace
 */
export async function updateWorkspaceMemberRole({
  workspaceId,
  targetUserId,
  newRole,
  callerId,
  callerRole,
}) {
  if (!workspaceId || !targetUserId || !newRole) {
    throw new Error('Workspace ID, target user ID, and new role are required.')
  }

  assertAdminAccess(callerRole)
  consumeRateLimit(`admin:${workspaceId}`, RATE_LIMIT_PRESETS.ADMIN_ACTION)

  if (!ADMIN_ROLES.includes(newRole)) {
    throw new Error(`Invalid role "${newRole}". Permitted roles: ${ADMIN_ROLES.join(', ')}`)
  }

  // Self-promotion protection: users cannot promote themselves to Owner
  if (targetUserId === callerId && newRole === 'Owner' && callerRole !== 'Owner') {
    throw new Error('Security restriction: You cannot promote yourself to Owner.')
  }

  // Non-owners cannot promote anyone to Owner
  if (newRole === 'Owner' && callerRole !== 'Owner') {
    throw new Error('Permission denied: Only the current workspace Owner can transfer ownership.')
  }

  // Offline / Demo enforcement
  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    const member = demoAdminMembers.find((m) => m.user_id === targetUserId && (m.workspace_id === workspaceId || workspaceId === 'demo-ws-acme-corp'))
    if (!member) {
      throw new Error('Target user is not a member of this workspace.')
    }

    // Owner protection
    if (member.role === 'Owner' && callerRole !== 'Owner') {
      throw new Error('Security restriction: Cannot modify the role of the workspace Owner.')
    }

    // Admin hierarchy protection
    if (callerRole === 'Admin' && member.role === 'Admin' && targetUserId !== callerId) {
      throw new Error('Permission denied: Admins cannot modify the role of another Admin.')
    }

    // Transfer ownership simulation: previous owner becomes Admin
    if (newRole === 'Owner' && callerRole === 'Owner' && targetUserId !== callerId) {
      const prevOwner = demoAdminMembers.find((m) => m.user_id === callerId)
      if (prevOwner) prevOwner.role = 'Admin'
    }

    const oldRole = member.role
    member.role = newRole

    // Log activity
    demoAdminActivities.unshift({
      id: `act-${Date.now()}`,
      workspace_id: workspaceId,
      user_id: callerId,
      action: 'role_changed',
      entity_type: 'workspace_member',
      entity_id: targetUserId,
      entity_title: member.full_name,
      details: { old_role: oldRole, new_role: newRole },
      created_at: new Date().toISOString(),
      user: { full_name: 'Current Admin', avatar_url: '' },
    })

    return { success: true, user_id: targetUserId, old_role: oldRole, new_role: newRole }
  }

  // Supabase execution: RPC with database-level security checks
  try {
    const { data, error } = await supabase.rpc('admin_update_member_role', {
      p_workspace_id: workspaceId,
      p_target_user_id: targetUserId,
      p_new_role: newRole,
    })

    if (error) throw handleDatabaseError(error)
    return data
  } catch (err) {
    console.error('updateWorkspaceMemberRole error:', err)
    throw err
  }
}

/**
 * Removes a member from the workspace with strict RBAC rules:
 * - Cannot remove the workspace Owner
 * - Admins cannot remove other Admins
 * - Scoped strictly to the target workspace
 */
export async function removeWorkspaceMemberAdmin({
  workspaceId,
  targetUserId,
  callerId,
  callerRole,
}) {
  if (!workspaceId || !targetUserId) {
    throw new Error('Workspace ID and target user ID are required.')
  }

  assertAdminAccess(callerRole)
  consumeRateLimit(`admin:${workspaceId}`, RATE_LIMIT_PRESETS.ADMIN_ACTION)

  // Offline / Demo enforcement
  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    const memberIndex = demoAdminMembers.findIndex(
      (m) => m.user_id === targetUserId && (m.workspace_id === workspaceId || workspaceId === 'demo-ws-acme-corp')
    )

    if (memberIndex === -1) {
      throw new Error('Target user is not a member of this workspace.')
    }

    const member = demoAdminMembers[memberIndex]

    // Protection 1: Cannot remove workspace Owner
    if (member.role === 'Owner') {
      throw new Error('Security restriction: Cannot remove the workspace Owner.')
    }

    // Protection 2: Admins cannot remove other Admins
    if (callerRole === 'Admin' && member.role === 'Admin' && targetUserId !== callerId) {
      throw new Error('Permission denied: Admins cannot remove other Admins.')
    }

    const removed = demoAdminMembers.splice(memberIndex, 1)[0]

    // Log audit activity
    demoAdminActivities.unshift({
      id: `act-${Date.now()}`,
      workspace_id: workspaceId,
      user_id: callerId,
      action: 'member_removed',
      entity_type: 'workspace_member',
      entity_id: targetUserId,
      entity_title: removed.full_name,
      details: { previous_role: removed.role },
      created_at: new Date().toISOString(),
      user: { full_name: 'Current Admin', avatar_url: '' },
    })

    return { success: true, removed_user_id: targetUserId, previous_role: removed.role }
  }

  // Supabase execution via RPC
  try {
    const { data, error } = await supabase.rpc('admin_remove_member', {
      p_workspace_id: workspaceId,
      p_target_user_id: targetUserId,
    })

    if (error) throw handleDatabaseError(error)
    return data
  } catch (err) {
    console.error('removeWorkspaceMemberAdmin error:', err)
    throw err
  }
}

/**
 * Fetches workspace invitations for administration.
 */
export async function getAdminWorkspaceInvitations(workspaceId, caller = {}) {
  if (!workspaceId) return []
  assertAdminAccess(caller.role)

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    return demoAdminInvites.filter(
      (i) => (i.workspace_id === workspaceId || workspaceId === 'demo-ws-acme-corp') && i.status === 'pending'
    )
  }

  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('id, workspace_id, email, role, token, status, expires_at, created_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw handleDatabaseError(error)
    return data || []
  } catch (err) {
    console.error('getAdminWorkspaceInvitations error:', err)
    return []
  }
}

/**
 * Revokes a pending workspace invitation.
 */
export async function revokeAdminInvitation(invitationId, workspaceId, caller = {}) {
  if (!invitationId) throw new Error('Invitation ID is required.')
  assertAdminAccess(caller.role)

  if (!isSupabaseConfigured || invitationId.startsWith('demo-')) {
    const idx = demoAdminInvites.findIndex((i) => i.id === invitationId)
    if (idx !== -1) {
      demoAdminInvites[idx].status = 'revoked'
      demoAdminInvites.splice(idx, 1)
    }
    return true
  }

  try {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)
      .eq('workspace_id', workspaceId)

    if (error) throw handleDatabaseError(error)
    return true
  } catch (err) {
    console.error('revokeAdminInvitation error:', err)
    throw err
  }
}

/**
 * Fetches workspace projects for administration view.
 */
export async function getAdminWorkspaceProjects(workspaceId, caller = {}) {
  if (!workspaceId) return []
  assertAdminAccess(caller.role)

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    return DEMO_PROJECTS.filter((p) => p.workspace_id === workspaceId || workspaceId === 'demo-ws-acme-corp')
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        key,
        description,
        status,
        visibility,
        color,
        created_at,
        updated_at,
        start_date,
        due_date
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw handleDatabaseError(error)
    return data || []
  } catch (err) {
    console.error('getAdminWorkspaceProjects error:', err)
    return []
  }
}

/**
 * Fetches workspace administrative activities audit trail.
 */
export async function getAdminWorkspaceActivities(workspaceId, caller = {}) {
  if (!workspaceId) return []
  assertAdminAccess(caller.role)

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    return demoAdminActivities.filter((a) => a.workspace_id === workspaceId || workspaceId === 'demo-ws-acme-corp')
  }

  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
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
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) throw handleDatabaseError(error)
    return data || []
  } catch (err) {
    console.error('getAdminWorkspaceActivities error:', err)
    return []
  }
}

/**
 * Resets demo stores for unit testing.
 */
export function resetDemoAdminStore() {
  demoAdminMembers = [
    {
      id: 'demo-member-1',
      workspace_id: 'demo-ws-acme-corp',
      user_id: 'demo-user-collabspace-uuid',
      email: 'alex.rivera@collabspace.demo',
      full_name: 'Alex Rivera',
      username: 'alex_rivera',
      role: 'Owner',
      avatar_url: '',
      joined_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
    {
      id: 'demo-member-2',
      workspace_id: 'demo-ws-acme-corp',
      user_id: 'demo-user-sarah',
      email: 'sarah.jenkins@acme.inc',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      role: 'Admin',
      avatar_url: '',
      joined_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
    {
      id: 'demo-member-3',
      workspace_id: 'demo-ws-acme-corp',
      user_id: 'demo-user-david',
      email: 'david.chen@acme.inc',
      full_name: 'David Chen',
      username: 'david_chen',
      role: 'Developer',
      avatar_url: '',
      joined_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'demo-member-4',
      workspace_id: 'demo-ws-acme-corp',
      user_id: 'demo-user-marcus',
      email: 'marcus.vance@acme.inc',
      full_name: 'Marcus Vance',
      username: 'marcus_v',
      role: 'Tester',
      avatar_url: '',
      joined_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ]

  demoAdminInvites = [
    {
      id: 'demo-inv-1',
      workspace_id: 'demo-ws-acme-corp',
      email: 'developer.jane@partner.io',
      role: 'Developer',
      token: 'demo-token-jane-dev-2026',
      status: 'pending',
      invited_by: 'demo-user-collabspace-uuid',
      expires_at: new Date(Date.now() + 5 * 86400000).toISOString(),
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ]

  demoAdminActivities = [...DEMO_ACTIVITIES]
}
