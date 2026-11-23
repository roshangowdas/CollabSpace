import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'

/**
 * Default demonstration workspaces for offline / test preview mode.
 * Clearly separated from real database data per AGENTS.md rules.
 */
const DEMO_WORKSPACES = [
  {
    id: 'demo-ws-acme-corp',
    name: 'Acme Corp',
    slug: 'acme-corp',
    description: 'Next-generation team collaboration and cross-functional operations.',
    logo_url: '',
    role: 'Owner',
    plan: 'pro',
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    member_count: 5,
  },
  {
    id: 'demo-ws-nextgen-labs',
    name: 'NextGen Labs',
    slug: 'nextgen-labs',
    description: 'Experimental AI tools, research documentation, and real-time canvas.',
    logo_url: '',
    role: 'Admin',
    plan: 'starter',
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    member_count: 3,
  },
]

const DEMO_MEMBERS = [
  {
    id: 'demo-member-1',
    user_id: 'demo-user-collabspace-uuid',
    email: 'alex.rivera@collabspace.demo',
    full_name: 'Alex Rivera (You)',
    username: 'alex_rivera',
    role: 'Owner',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    bio: 'Lead product architect & collaborative systems engineer.',
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-member-2',
    user_id: 'demo-user-sarah',
    email: 'sarah.jenkins@acme.inc',
    full_name: 'Sarah Jenkins',
    username: 'sarah_j',
    role: 'Admin',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    bio: 'Frontend platform lead & design systems steward.',
    created_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-member-3',
    user_id: 'demo-user-david',
    email: 'david.chen@acme.inc',
    full_name: 'David Chen',
    username: 'david_chen',
    role: 'Member',
    avatar_url: '',
    bio: 'Distributed infrastructure and backend database specialist.',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-member-4',
    user_id: 'demo-user-elena',
    email: 'elena.rostova@acme.inc',
    full_name: 'Elena Rostova',
    username: 'elena_r',
    role: 'Member',
    avatar_url: '',
    bio: 'Product manager for core search, task workflows, and notifications.',
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-member-5',
    user_id: 'demo-user-marcus',
    email: 'marcus.vance@acme.inc',
    full_name: 'Marcus Vance',
    username: 'marcus_v',
    role: 'Viewer',
    avatar_url: '',
    bio: 'Quality assurance and usability auditing.',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
]

/**
 * Fetches all workspaces where the given user is a member.
 *
 * @param {string} userId
 * @returns {Promise<Array<object>>}
 */
export async function getUserWorkspaces(userId) {
  if (!userId) return []

  if (!isSupabaseConfigured || userId.startsWith('demo-')) {
    return DEMO_WORKSPACES
  }

  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        role,
        workspace:workspaces (
          id,
          name,
          slug,
          description,
          logo_url,
          owner_id,
          plan,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)

    if (error) throw error

    // Format workspaces and append role
    const workspaces = (data || [])
      .filter((item) => item.workspace !== null)
      .map((item) => ({
        ...item.workspace,
        role: item.role,
      }))

    return workspaces
  } catch (err) {
    console.warn('[CollabSpace Workspaces] Error loading workspaces from Supabase:', err.message)
    return []
  }
}

/**
 * Checks if a proposed workspace slug is available.
 *
 * @param {string} slug
 * @param {string} [currentWorkspaceId]
 * @returns {Promise<{ available: boolean, reason?: string }>}
 */
export async function checkWorkspaceSlugAvailability(slug, currentWorkspaceId = null) {
  if (!slug) return { available: false, reason: 'Slug is required' }
  const clean = slug.toLowerCase().trim()

  if (clean.length < 2 || clean.length > 60 || !/^[a-z0-9-]+$/.test(clean)) {
    return { available: false, reason: 'Must be 2-60 lowercase letters, numbers, or hyphens' }
  }

  if (!isSupabaseConfigured || clean.startsWith('demo-')) {
    const isTaken = DEMO_WORKSPACES.some((w) => w.slug === clean && w.id !== currentWorkspaceId)
    return { available: !isTaken, reason: isTaken ? 'Workspace URL is already taken' : undefined }
  }

  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, slug')
      .eq('slug', clean)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('[CollabSpace Workspaces] Slug check warning:', error.message)
    }

    if (data) {
      if (currentWorkspaceId && data.id === currentWorkspaceId) {
        return { available: true }
      }
      return { available: false, reason: 'This workspace URL slug is already taken' }
    }

    return { available: true }
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('fetch failed')) {
      const isTaken = DEMO_WORKSPACES.some((w) => w.slug === clean && w.id !== currentWorkspaceId)
      return { available: !isTaken }
    }
    console.warn('[CollabSpace Workspaces] Slug check exception:', err.message)
    return { available: true }
  }
}

/**
 * Creates a new workspace and provisions the creator as the Owner.
 *
 * @param {{
 *   name: string,
 *   slug: string,
 *   description?: string,
 *   logoUrl?: string,
 *   userId: string
 * }} params
 * @returns {Promise<object>}
 */
export async function createWorkspace({ name, slug, description = '', logoUrl = '', userId }) {
  if (!userId) throw new Error('User ID is required to create a workspace')
  if (!name || name.trim().length < 2) throw new Error('Workspace name must be at least 2 characters')

  const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'))
    .replace(/^-+|-+$/g, '')

  if (!isSupabaseConfigured || userId.startsWith('demo-')) {
    const newDemo = {
      id: `demo-ws-${Date.now()}`,
      name: name.trim(),
      slug: cleanSlug,
      description: description.trim(),
      logo_url: logoUrl,
      role: 'Owner',
      plan: 'free',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 1,
    }
    DEMO_WORKSPACES.unshift(newDemo)
    return newDemo
  }

  try {
    // 1. Insert into workspaces table
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        description: description.trim(),
        logo_url: logoUrl || null,
        owner_id: userId,
        plan: 'free',
      })
      .select()
      .single()

    if (wsError) throw wsError

    // 2. Safeguard: ensure membership record exists (trigger handles this, but upsert confirms)
    await supabase.from('workspace_members').upsert({
      workspace_id: workspace.id,
      user_id: userId,
      role: 'Owner',
    }, { onConflict: 'workspace_id,user_id' })

    // 3. Log initial creation activity
    try {
      await supabase.from('activity_logs').insert({
        workspace_id: workspace.id,
        user_id: userId,
        action: 'created',
        entity_type: 'workspace',
        entity_id: workspace.id,
        entity_title: workspace.name,
        details: { plan: 'free' },
      })
    } catch (e) {
      // Activity logging error should not block workspace creation
    }

    return {
      ...workspace,
      role: 'Owner',
    }
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Updates an existing workspace's details (Owner / Admin only).
 *
 * @param {string} workspaceId
 * @param {{
 *   name?: string,
 *   slug?: string,
 *   description?: string,
 *   logoUrl?: string
 * }} updates
 * @returns {Promise<object>}
 */
export async function updateWorkspace(workspaceId, updates) {
  if (!workspaceId) throw new Error('Workspace ID is required')

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    const ws = DEMO_WORKSPACES.find((w) => w.id === workspaceId)
    if (ws) {
      if (updates.name) ws.name = updates.name.trim()
      if (updates.slug) ws.slug = updates.slug.toLowerCase().trim()
      if (updates.description !== undefined) ws.description = updates.description.trim()
      if (updates.logoUrl !== undefined) ws.logo_url = updates.logoUrl
      ws.updated_at = new Date().toISOString()
    }
    return ws || updates
  }

  try {
    const payload = {
      updated_at: new Date().toISOString(),
    }
    if (updates.name) payload.name = updates.name.trim()
    if (updates.slug) payload.slug = updates.slug.toLowerCase().trim()
    if (updates.description !== undefined) payload.description = updates.description.trim()
    if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl ? updates.logoUrl.trim() : null

    const { data, error } = await supabase
      .from('workspaces')
      .update(payload)
      .eq('id', workspaceId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Uploads a workspace logo to Supabase Storage in the 'workspace-logos' bucket.
 *
 * @param {string} workspaceId
 * @param {File} file
 * @returns {Promise<{ publicUrl: string, path: string }>}
 */
export async function uploadWorkspaceLogo(workspaceId, file) {
  if (!file) throw new Error('No file selected for logo upload')

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please select a valid image file (PNG, JPG, WEBP, or SVG).')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Workspace logo size cannot exceed 5 MB.')
  }

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    const previewUrl = URL.createObjectURL(file)
    await updateWorkspace(workspaceId, { logoUrl: previewUrl })
    return { publicUrl: previewUrl, path: 'demo/workspace-logo.png' }
  }

  try {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase()
    const filePath = `${workspaceId}/${Date.now()}-${sanitizedName}`

    const { error: uploadError } = await supabase.storage
      .from('workspace-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('workspace-logos')
      .getPublicUrl(filePath)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) throw new Error('Failed to retrieve public URL for uploaded logo')

    await updateWorkspace(workspaceId, { logoUrl: publicUrl })

    return { publicUrl, path: filePath }
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Deletes a workspace permanently (Owner only).
 * Cascading foreign keys will automatically delete all linked members, projects, tasks, etc.
 *
 * @param {string} workspaceId
 * @returns {Promise<boolean>}
 */
export async function deleteWorkspace(workspaceId) {
  if (!workspaceId) throw new Error('Workspace ID is required')

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    const index = DEMO_WORKSPACES.findIndex((w) => w.id === workspaceId)
    if (index !== -1) DEMO_WORKSPACES.splice(index, 1)
    return true
  }

  try {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    if (error) throw error
    return true
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Fetches all members of a workspace along with their user profile details.
 *
 * @param {string} workspaceId
 * @returns {Promise<Array<object>>}
 */
export async function getWorkspaceMembers(workspaceId) {
  if (!workspaceId) return []

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    return DEMO_MEMBERS
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

    if (error) throw error

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
    console.warn('[CollabSpace Workspaces] Error loading members:', err.message)
    return []
  }
}

/**
 * Updates a member's role in the workspace (Owner/Admin only).
 *
 * @param {string} workspaceId
 * @param {string} memberUserId
 * @param {'Owner'|'Admin'|'Member'|'Viewer'} newRole
 * @returns {Promise<object>}
 */
export async function updateMemberRole(workspaceId, memberUserId, newRole) {
  if (!workspaceId || !memberUserId) throw new Error('Workspace and User IDs are required')

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    const member = DEMO_MEMBERS.find((m) => m.user_id === memberUserId)
    if (member) member.role = newRole
    return member
  }

  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('user_id', memberUserId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Removes a member from the workspace (Owner/Admin or self-leave).
 *
 * @param {string} workspaceId
 * @param {string} memberUserId
 * @returns {Promise<boolean>}
 */
export async function removeWorkspaceMember(workspaceId, memberUserId) {
  if (!workspaceId || !memberUserId) throw new Error('Workspace and User IDs are required')

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    const index = DEMO_MEMBERS.findIndex((m) => m.user_id === memberUserId)
    if (index !== -1) DEMO_MEMBERS.splice(index, 1)
    return true
  }

  try {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', memberUserId)

    if (error) throw error
    return true
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Invites a new collaborator by email with a designated role.
 *
 * @param {{
 *   workspaceId: string,
 *   email: string,
 *   role?: 'Admin'|'Member'|'Viewer',
 *   invitedBy: string
 * }} params
 * @returns {Promise<object>}
 */
export async function inviteMember({ workspaceId, email, role = 'Member', invitedBy }) {
  if (!workspaceId || !email) throw new Error('Workspace ID and email are required')

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    const newDemoMember = {
      id: `demo-member-${Date.now()}`,
      user_id: `invited-${Date.now()}`,
      email: email.trim().toLowerCase(),
      full_name: email.split('@')[0],
      username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
      role,
      avatar_url: '',
      joined_at: new Date().toISOString(),
    }
    DEMO_MEMBERS.push(newDemoMember)
    return { success: true, member: newDemoMember }
  }

  try {
    const token = crypto.randomUUID()
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase().trim(),
        role,
        token,
        invited_by: invitedBy,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}
