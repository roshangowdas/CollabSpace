import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'

export const PROJECT_STATUSES = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
}

/**
 * Default demonstration projects for preview/fallback mode.
 * Clearly separated from real database records per AGENTS.md rules.
 */
export const DEMO_PROJECTS = [
  {
    id: 'demo-proj-collabspace-web',
    workspace_id: 'demo-ws-acme-corp',
    name: 'CollabSpace Web Platform',
    key: 'COL',
    description: 'Core web application including workspace management, real-time messaging, and interactive canvas.',
    status: 'active',
    visibility: 'workspace',
    start_date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    due_date: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
    created_by: 'demo-user-collabspace-uuid',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    creator: {
      full_name: 'Alex Rivera',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
    member_count: 5,
    task_stats: {
      total: 32,
      done: 22,
      in_progress: 6,
      todo: 4,
    },
    progress: 69,
  },
  {
    id: 'demo-proj-api-gateway',
    workspace_id: 'demo-ws-acme-corp',
    name: 'API Gateway & Microservices',
    key: 'API',
    description: 'High-throughput real-time WebSocket broker, Edge functions, and webhook orchestration layer.',
    status: 'active',
    visibility: 'workspace',
    start_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    due_date: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
    created_by: 'demo-user-sarah',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    creator: {
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
    member_count: 3,
    task_stats: {
      total: 18,
      done: 14,
      in_progress: 3,
      todo: 1,
    },
    progress: 78,
  },
  {
    id: 'demo-proj-mobile-client',
    workspace_id: 'demo-ws-acme-corp',
    name: 'Mobile Client (iOS & Android)',
    key: 'MOB',
    description: 'Native mobile client experience with offline caching, optimistic sync, and push notifications.',
    status: 'paused',
    visibility: 'private',
    start_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    due_date: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    created_by: 'demo-user-collabspace-uuid',
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    creator: {
      full_name: 'Alex Rivera',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
    member_count: 2,
    task_stats: {
      total: 12,
      done: 3,
      in_progress: 2,
      todo: 7,
    },
    progress: 25,
  },
  {
    id: 'demo-proj-design-tokens',
    workspace_id: 'demo-ws-acme-corp',
    name: 'Design System & Tokens v2',
    key: 'DSN',
    description: 'Component architecture, theme tokens, accessible navigation patterns, and animation guidelines.',
    status: 'completed',
    visibility: 'workspace',
    start_date: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    due_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    created_by: 'demo-user-sarah',
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    creator: {
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
    member_count: 4,
    task_stats: {
      total: 24,
      done: 24,
      in_progress: 0,
      todo: 0,
    },
    progress: 100,
  },
]

export const DEMO_PROJECT_MEMBERS = [
  {
    id: 'demo-pm-1',
    project_id: 'demo-proj-collabspace-web',
    user_id: 'demo-user-collabspace-uuid',
    role: 'Lead',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    profile: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      email: 'alex.rivera@collabspace.demo',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
      bio: 'Lead product architect & collaborative systems engineer.',
    },
  },
  {
    id: 'demo-pm-2',
    project_id: 'demo-proj-collabspace-web',
    user_id: 'demo-user-sarah',
    role: 'Contributor',
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    profile: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      email: 'sarah.jenkins@acme.inc',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
      bio: 'Frontend platform lead & design systems steward.',
    },
  },
  {
    id: 'demo-pm-3',
    project_id: 'demo-proj-collabspace-web',
    user_id: 'demo-user-david',
    role: 'Contributor',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    profile: {
      id: 'demo-user-david',
      full_name: 'David Chen',
      username: 'david_chen',
      email: 'david.chen@acme.inc',
      avatar_url: '',
      bio: 'Distributed infrastructure and backend database specialist.',
    },
  },
  {
    id: 'demo-pm-4',
    project_id: 'demo-proj-collabspace-web',
    user_id: 'demo-user-marcus',
    role: 'Viewer',
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    profile: {
      id: 'demo-user-marcus',
      full_name: 'Marcus Vance',
      username: 'marcus_v',
      email: 'marcus.vance@acme.inc',
      avatar_url: '',
      bio: 'Quality assurance and usability auditing.',
    },
  },
]

/**
 * Computes progress percentage from total and done tasks.
 *
 * @param {number} total
 * @param {number} done
 * @returns {number}
 */
export function calculateProjectProgress(total, done) {
  if (!total || total <= 0) return 0
  const progress = Math.round((done / total) * 100)
  return Math.min(100, Math.max(0, progress))
}

/**
 * Generates an uppercase project key recommendation from a project name.
 * e.g., "CollabSpace Core" -> "CSC", "Payments Gateway" -> "PG", "Analytics" -> "ANA"
 *
 * @param {string} name
 * @returns {string}
 */
export function generateProjectKey(name) {
  if (!name || typeof name !== 'string') return ''
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '')
  const words = clean.split(/\s+/).filter(Boolean)

  if (words.length >= 2) {
    const letters = words.map((w) => w[0].toUpperCase()).join('')
    return letters.slice(0, 5)
  }
  if (words.length === 1) {
    const word = words[0].toUpperCase()
    return word.slice(0, 4)
  }
  return 'PRJ'
}

/**
 * Fetches all projects in a workspace accessible to the current user.
 * Includes task summary statistics to compute progress.
 *
 * @param {string} workspaceId
 * @returns {Promise<Array<object>>}
 */
export async function getWorkspaceProjects(workspaceId) {
  if (!workspaceId) return []

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    return DEMO_PROJECTS.filter((p) => p.workspace_id === workspaceId || workspaceId === 'demo-ws-acme-corp')
  }

  try {
    // 1. Fetch projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        workspace_id,
        name,
        key,
        description,
        status,
        visibility,
        start_date,
        due_date,
        created_by,
        created_at,
        updated_at,
        creator:created_by (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      throw handleDatabaseError(error)
    }

    if (!projects || projects.length === 0) {
      return []
    }

    // 2. Fetch task counts & member counts concurrently in parallel to avoid waterfall latency
    const projectIds = projects.map((p) => p.id)
    const [
      { data: tasks, error: tasksError },
      { data: members, error: membersError },
    ] = await Promise.all([
      supabase.from('tasks').select('id, project_id, status').in('project_id', projectIds),
      supabase.from('project_members').select('project_id, user_id').in('project_id', projectIds),
    ])

    if (tasksError) {
      console.warn('Error fetching project task counts:', tasksError.message)
    }
    if (membersError) {
      console.warn('Error fetching project member counts:', membersError.message)
    }

    // Build stats maps
    const tasksMap = {}
    if (tasks) {
      for (const t of tasks) {
        if (!tasksMap[t.project_id]) {
          tasksMap[t.project_id] = { total: 0, done: 0 }
        }
        tasksMap[t.project_id].total += 1
        if (t.status === 'done') {
          tasksMap[t.project_id].done += 1
        }
      }
    }

    const membersMap = {}
    if (members) {
      for (const m of members) {
        membersMap[m.project_id] = (membersMap[m.project_id] || 0) + 1
      }
    }

    return projects.map((proj) => {
      const stats = tasksMap[proj.id] || { total: 0, done: 0 }
      const memberCount = membersMap[proj.id] || 0
      return {
        ...proj,
        task_stats: stats,
        member_count: memberCount,
        progress: calculateProjectProgress(stats.total, stats.done),
      }
    })
  } catch (err) {
    console.error('getWorkspaceProjects error:', err)
    return []
  }
}

/**
 * Fetches a single project by ID with full details, members, and task summary.
 *
 * @param {string} projectId
 * @returns {Promise<object>}
 */
export async function getProjectById(projectId) {
  if (!projectId) return null

  if (!isSupabaseConfigured || projectId.startsWith('demo-')) {
    const demo = DEMO_PROJECTS.find((p) => p.id === projectId)
    if (!demo) return null
    return {
      ...demo,
      members: DEMO_PROJECT_MEMBERS.filter((m) => m.project_id === demo.id),
    }
  }

  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        id,
        workspace_id,
        name,
        key,
        description,
        status,
        visibility,
        start_date,
        due_date,
        created_by,
        created_at,
        updated_at,
        creator:created_by (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('id', projectId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw handleDatabaseError(error)
    }

    if (!project) return null

    // Fetch members
    const members = await getProjectMembers(projectId)

    // Fetch task statistics
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('project_id', projectId)

    let totalTasks = 0
    let doneTasks = 0
    let inProgressTasks = 0
    let todoTasks = 0

    if (!taskError && tasks) {
      totalTasks = tasks.length
      doneTasks = tasks.filter((t) => t.status === 'done').length
      inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
      todoTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'backlog').length
    }

    return {
      ...project,
      members,
      member_count: members.length,
      task_stats: {
        total: totalTasks,
        done: doneTasks,
        in_progress: inProgressTasks,
        todo: todoTasks,
      },
      progress: calculateProjectProgress(totalTasks, doneTasks),
    }
  } catch (err) {
    console.error('getProjectById error:', err)
    return null
  }
}

/**
 * Checks whether a project key is already taken within a workspace.
 *
 * @param {string} workspaceId
 * @param {string} key
 * @param {string} [excludeProjectId]
 * @returns {Promise<boolean>}
 */
export async function isProjectKeyAvailable(workspaceId, key, excludeProjectId = null) {
  if (!isSupabaseConfigured || !workspaceId || workspaceId.startsWith('demo-')) {
    const match = DEMO_PROJECTS.find(
      (p) => p.key.toUpperCase() === key.toUpperCase() && p.id !== excludeProjectId
    )
    return !match
  }

  try {
    let query = supabase
      .from('projects')
      .select('id')
      .eq('workspace_id', workspaceId)
      .ilike('key', key.trim())

    if (excludeProjectId) {
      query = query.neq('id', excludeProjectId)
    }

    const { data, error } = await query
    if (error) throw handleDatabaseError(error)

    return !data || data.length === 0
  } catch (err) {
    console.error('isProjectKeyAvailable error:', err)
    return false
  }
}

/**
 * Creates a new project in the given workspace.
 *
 * @param {object} params
 * @param {string} params.workspaceId
 * @param {string} params.name
 * @param {string} params.key
 * @param {string} [params.description]
 * @param {string} [params.startDate]
 * @param {string} [params.dueDate]
 * @param {'workspace'|'private'} [params.visibility]
 * @param {'active'|'paused'|'completed'|'archived'} [params.status]
 * @param {string} params.userId
 * @returns {Promise<object>}
 */
export async function createProject({
  workspaceId,
  name,
  key,
  description = '',
  startDate = null,
  dueDate = null,
  visibility = 'workspace',
  status = 'active',
  userId,
}) {
  const upperKey = key.trim().toUpperCase()

  if (!isSupabaseConfigured || !workspaceId || workspaceId.startsWith('demo-')) {
    const newDemoProject = {
      id: `demo-proj-${Date.now()}`,
      workspace_id: workspaceId || 'demo-ws-acme-corp',
      name: name.trim(),
      key: upperKey,
      description: description?.trim() || '',
      status,
      visibility,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      created_by: userId || 'demo-user-collabspace-uuid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: {
        full_name: 'Alex Rivera',
        username: 'alex_rivera',
        avatar_url: '',
      },
      member_count: 1,
      task_stats: { total: 0, done: 0 },
      progress: 0,
    }
    DEMO_PROJECTS.unshift(newDemoProject)
    return newDemoProject
  }

  try {
    const insertPayload = {
      workspace_id: workspaceId,
      name: name.trim(),
      key: upperKey,
      description: description ? description.trim() : '',
      visibility,
      status,
      created_by: userId,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(insertPayload)
      .select(`
        id,
        workspace_id,
        name,
        key,
        description,
        status,
        visibility,
        start_date,
        due_date,
        created_by,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    // Note: The PostgreSQL trigger `handle_new_project` will automatically insert
    // the creator as 'Lead' in `project_members`. We also do an idempotent upsert
    // to guarantee assignment in case trigger is disabled.
    try {
      await supabase
        .from('project_members')
        .upsert(
          { project_id: data.id, user_id: userId, role: 'Lead' },
          { onConflict: 'project_id, user_id' }
        )
    } catch (memberErr) {
      console.warn('Project member creator assignment notice:', memberErr.message)
    }

    return {
      ...data,
      task_stats: { total: 0, done: 0 },
      member_count: 1,
      progress: 0,
    }
  } catch (err) {
    console.error('createProject error:', err)
    throw err
  }
}

/**
 * Updates an existing project's metadata.
 *
 * @param {string} projectId
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateProject(projectId, updates) {
  if (!isSupabaseConfigured || !projectId || projectId.startsWith('demo-')) {
    const idx = DEMO_PROJECTS.findIndex((p) => p.id === projectId)
    if (idx !== -1) {
      DEMO_PROJECTS[idx] = {
        ...DEMO_PROJECTS[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      }
      return DEMO_PROJECTS[idx]
    }
    return { id: projectId, ...updates }
  }

  try {
    const payload = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) payload.name = updates.name.trim()
    if (updates.description !== undefined) payload.description = updates.description.trim()
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.visibility !== undefined) payload.visibility = updates.visibility
    if (updates.startDate !== undefined) {
      payload.start_date = updates.startDate ? new Date(updates.startDate).toISOString() : null
    }
    if (updates.dueDate !== undefined) {
      payload.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null
    }

    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', projectId)
      .select(`
        id,
        workspace_id,
        name,
        key,
        description,
        status,
        visibility,
        start_date,
        due_date,
        created_by,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    return data
  } catch (err) {
    console.error('updateProject error:', err)
    throw err
  }
}

/**
 * Archives a project (shortcut to set status to 'archived').
 *
 * @param {string} projectId
 * @returns {Promise<object>}
 */
export async function archiveProject(projectId) {
  return updateProject(projectId, { status: 'archived' })
}

/**
 * Restores an archived or paused project to 'active'.
 *
 * @param {string} projectId
 * @returns {Promise<object>}
 */
export async function restoreProject(projectId) {
  return updateProject(projectId, { status: 'active' })
}

/**
 * Permanently deletes a project.
 * Cascades to project_members, tasks, and linked resources.
 *
 * @param {string} projectId
 * @returns {Promise<boolean>}
 */
export async function deleteProject(projectId) {
  if (!isSupabaseConfigured || !projectId || projectId.startsWith('demo-')) {
    const idx = DEMO_PROJECTS.findIndex((p) => p.id === projectId)
    if (idx !== -1) {
      DEMO_PROJECTS.splice(idx, 1)
    }
    return true
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      throw handleDatabaseError(error)
    }

    return true
  } catch (err) {
    console.error('deleteProject error:', err)
    throw err
  }
}

/**
 * Fetches all members assigned to a project.
 *
 * @param {string} projectId
 * @returns {Promise<Array<object>>}
 */
export async function getProjectMembers(projectId) {
  if (!projectId) return []

  if (!isSupabaseConfigured || projectId.startsWith('demo-')) {
    return DEMO_PROJECT_MEMBERS.filter((m) => m.project_id === projectId)
  }

  try {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        id,
        project_id,
        user_id,
        role,
        created_at,
        profile:user_id (
          id,
          full_name,
          username,
          avatar_url,
          bio
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      throw handleDatabaseError(error)
    }

    return data || []
  } catch (err) {
    console.error('getProjectMembers error:', err)
    return []
  }
}

/**
 * Assigns or updates a member in a project.
 *
 * @param {string} projectId
 * @param {string} userId
 * @param {'Lead'|'Contributor'|'Viewer'} [role='Contributor']
 * @returns {Promise<object>}
 */
export async function assignProjectMember(projectId, userId, role = 'Contributor') {
  if (!isSupabaseConfigured || !projectId || projectId.startsWith('demo-')) {
    const newMember = {
      id: `demo-pm-${Date.now()}`,
      project_id: projectId,
      user_id: userId,
      role,
      created_at: new Date().toISOString(),
      profile: {
        id: userId,
        full_name: 'Assigned Member',
        username: 'assigned_user',
        avatar_url: '',
      },
    }
    DEMO_PROJECT_MEMBERS.push(newMember)
    return newMember
  }

  try {
    const { data, error } = await supabase
      .from('project_members')
      .upsert(
        { project_id: projectId, user_id: userId, role },
        { onConflict: 'project_id, user_id' }
      )
      .select(`
        id,
        project_id,
        user_id,
        role,
        created_at,
        profile:user_id (
          id,
          full_name,
          username,
          avatar_url,
          bio
        )
      `)
      .single()

    if (error) {
      throw handleDatabaseError(error)
    }

    return data
  } catch (err) {
    console.error('assignProjectMember error:', err)
    throw err
  }
}

/**
 * Removes a member from a project.
 *
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function removeProjectMember(projectId, userId) {
  if (!isSupabaseConfigured || !projectId || projectId.startsWith('demo-')) {
    const idx = DEMO_PROJECT_MEMBERS.findIndex(
      (m) => m.project_id === projectId && m.user_id === userId
    )
    if (idx !== -1) {
      DEMO_PROJECT_MEMBERS.splice(idx, 1)
    }
    return true
  }

  try {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) {
      throw handleDatabaseError(error)
    }

    return true
  } catch (err) {
    console.error('removeProjectMember error:', err)
    throw err
  }
}

/**
 * Checks if the current user can modify (edit/delete/archive) a project.
 * Users can modify if they are workspace Owner or Admin, or if they have the Lead role in the project.
 *
 * @param {string} workspaceRole
 * @param {Array<object>} projectMembers
 * @param {string} currentUserId
 * @returns {boolean}
 */
export function canUserModifyProject(workspaceRole, projectMembers = [], currentUserId) {
  if (workspaceRole === 'Owner' || workspaceRole === 'Admin') {
    return true
  }
  if (!currentUserId || !projectMembers) return false

  const member = projectMembers.find((m) => m.user_id === currentUserId)
  return member?.role === 'Lead'
}

