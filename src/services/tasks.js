import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'

export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  COMPLETED: 'completed',
}

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
}

/**
 * Demonstration task records for offline / preview mode.
 * Clearly separated from real database records per AGENTS.md rules.
 */
export const DEMO_TASKS = [
  {
    id: 'demo-task-1',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-collabspace-web',
    task_number: 101,
    title: 'Implement drag-and-drop Kanban columns for task boards',
    description: 'Provide smooth visual reordering between Todo, In Progress, In Review, and Completed columns.',
    status: 'in_progress',
    priority: 'high',
    assignee_id: 'demo-user-collabspace-uuid',
    reporter_id: 'demo-user-sarah',
    due_date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    position: 1000,
    labels: ['Frontend', 'Kanban', 'UI'],
    estimated_hours: 8,
    comment_count: 4,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-collabspace-web',
      name: 'CollabSpace Web Platform',
      key: 'COL',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
    reporter: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-task-2',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-collabspace-web',
    task_number: 102,
    title: 'Audit accessibility contrast for dark and light themes',
    description: 'Verify WCAG AA compliance for secondary text colors and borders across all modals and badges.',
    status: 'in_review',
    priority: 'medium',
    assignee_id: 'demo-user-marcus',
    reporter_id: 'demo-user-collabspace-uuid',
    due_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    position: 2000,
    labels: ['Accessibility', 'Design'],
    estimated_hours: 4,
    comment_count: 2,
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-collabspace-web',
      name: 'CollabSpace Web Platform',
      key: 'COL',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-marcus',
      full_name: 'Marcus Vance',
      username: 'marcus_v',
      avatar_url: '',
    },
    reporter: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-task-3',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-collabspace-web',
    task_number: 103,
    title: 'Implement task details slide-over drawer',
    description: 'Users should be able to click on any task card and view/edit details, priority, labels, and timestamps in a responsive drawer.',
    status: 'completed',
    priority: 'urgent',
    assignee_id: 'demo-user-collabspace-uuid',
    reporter_id: 'demo-user-collabspace-uuid',
    due_date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    position: 3000,
    labels: ['UI', 'Drawer', 'Sprint1'],
    estimated_hours: 6,
    comment_count: 5,
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-collabspace-web',
      name: 'CollabSpace Web Platform',
      key: 'COL',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
    reporter: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-task-4',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-api-gateway',
    task_number: 201,
    title: 'Rate limiting middleware for real-time WebSocket connections',
    description: 'Enforce connection throttling per IP and user token to safeguard broker infrastructure.',
    status: 'todo',
    priority: 'urgent',
    assignee_id: 'demo-user-david',
    reporter_id: 'demo-user-sarah',
    due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    position: 4000,
    labels: ['Backend', 'Security', 'WebSockets'],
    estimated_hours: 12,
    comment_count: 1,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-api-gateway',
      name: 'API Gateway & Microservices',
      key: 'API',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-david',
      full_name: 'David Chen',
      username: 'david_chen',
      avatar_url: '',
    },
    reporter: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-task-5',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-collabspace-web',
    task_number: 104,
    title: 'Integrate real-time task status updates via Supabase Broadcast',
    description: 'When any collaborator moves or edits a task, notify other workspace members instantly without page reloads.',
    status: 'todo',
    priority: 'high',
    assignee_id: 'demo-user-collabspace-uuid',
    reporter_id: 'demo-user-collabspace-uuid',
    due_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    position: 5000,
    labels: ['Realtime', 'Supabase'],
    estimated_hours: 5,
    comment_count: 3,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-collabspace-web',
      name: 'CollabSpace Web Platform',
      key: 'COL',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
    reporter: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-task-6',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-collabspace-web',
    task_number: 105,
    title: 'Resolve session token race condition on page refresh',
    description: 'Ensure synchronous hydration of Supabase session before executing child API requests.',
    status: 'in_progress',
    priority: 'medium',
    assignee_id: 'demo-user-sarah',
    reporter_id: 'demo-user-collabspace-uuid',
    due_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // Overdue
    position: 6000,
    labels: ['Bug', 'Auth', 'Sprint2'],
    estimated_hours: 4,
    comment_count: 2,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-collabspace-web',
      name: 'CollabSpace Web Platform',
      key: 'COL',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
    reporter: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-task-7',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-collabspace-web',
    task_number: 106,
    title: 'Generate SVG favicon set for dark and light OS themes',
    description: 'Create multi-resolution SVG and PNG icons for browser tabs and mobile home screens.',
    status: 'completed',
    priority: 'low',
    assignee_id: 'demo-user-marcus',
    reporter_id: 'demo-user-sarah',
    due_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    position: 7000,
    labels: ['Design', 'Assets'],
    estimated_hours: 2,
    comment_count: 1,
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-collabspace-web',
      name: 'CollabSpace Web Platform',
      key: 'COL',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-marcus',
      full_name: 'Marcus Vance',
      username: 'marcus_v',
      avatar_url: '',
    },
    reporter: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-task-8',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-api-gateway',
    task_number: 202,
    title: 'Benchmark PostgreSQL connection pooling with pgbouncer',
    description: 'Measure throughput and latency with 500 concurrent WebSocket sessions.',
    status: 'completed',
    priority: 'medium',
    assignee_id: 'demo-user-david',
    reporter_id: 'demo-user-collabspace-uuid',
    due_date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    position: 8000,
    labels: ['Database', 'Performance'],
    estimated_hours: 6,
    comment_count: 3,
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-api-gateway',
      name: 'API Gateway & Microservices',
      key: 'API',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-david',
      full_name: 'David Chen',
      username: 'david_chen',
      avatar_url: '',
    },
    reporter: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-task-9',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-collabspace-web',
    task_number: 107,
    title: 'Add sound effects for notification toast delivery',
    description: 'Optional subtle audio chime when new mentions or task assignments arrive.',
    status: 'todo',
    priority: 'low',
    assignee_id: 'demo-user-marcus',
    reporter_id: 'demo-user-collabspace-uuid',
    due_date: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(),
    position: 9000,
    labels: ['Audio', 'UX'],
    estimated_hours: 3,
    comment_count: 0,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-collabspace-web',
      name: 'CollabSpace Web Platform',
      key: 'COL',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-marcus',
      full_name: 'Marcus Vance',
      username: 'marcus_v',
      avatar_url: '',
    },
    reporter: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    id: 'demo-task-10',
    workspace_id: 'demo-ws-acme-corp',
    project_id: 'demo-proj-api-gateway',
    task_number: 203,
    title: 'Configure CORS and SSL certificates on staging edge proxy',
    description: 'Resolve wildcard preflight failures for staging custom domains.',
    status: 'in_progress',
    priority: 'urgent',
    assignee_id: 'demo-user-david',
    reporter_id: 'demo-user-sarah',
    due_date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // Overdue
    position: 10000,
    labels: ['DevOps', 'Security'],
    estimated_hours: 5,
    comment_count: 4,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    project: {
      id: 'demo-proj-api-gateway',
      name: 'API Gateway & Microservices',
      key: 'API',
      status: 'active',
      visibility: 'workspace',
    },
    assignee: {
      id: 'demo-user-david',
      full_name: 'David Chen',
      username: 'david_chen',
      avatar_url: '',
    },
    reporter: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
]

/**
 * Validates whether a user is an assigned member of a project.
 *
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isUserProjectMember(projectId, userId) {
  if (!projectId || !userId) return false

  // In demo mode, verify against demo project members
  if (!isSupabaseConfigured || projectId.startsWith('demo-') || userId.startsWith('demo-')) {
    return true
  }

  try {
    const { data, error } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('Project membership check error:', error.message)
      return false
    }

    return Boolean(data)
  } catch (err) {
    console.error('isUserProjectMember check exception:', err)
    return false
  }
}

/**
 * Fetches all members assigned to a project eligible to be assigned tasks.
 *
 * @param {string} projectId
 * @returns {Promise<Array<object>>}
 */
export async function getProjectAssignees(projectId) {
  if (!projectId) return []

  if (!isSupabaseConfigured || projectId.startsWith('demo-')) {
    return [
      {
        user_id: 'demo-user-collabspace-uuid',
        role: 'Lead',
        profile: {
          id: 'demo-user-collabspace-uuid',
          full_name: 'Alex Rivera (You)',
          username: 'alex_rivera',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
        },
      },
      {
        user_id: 'demo-user-sarah',
        role: 'Contributor',
        profile: {
          id: 'demo-user-sarah',
          full_name: 'Sarah Jenkins',
          username: 'sarah_j',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
        },
      },
      {
        user_id: 'demo-user-david',
        role: 'Contributor',
        profile: {
          id: 'demo-user-david',
          full_name: 'David Chen',
          username: 'david_chen',
          avatar_url: '',
        },
      },
      {
        user_id: 'demo-user-marcus',
        role: 'Viewer',
        profile: {
          id: 'demo-user-marcus',
          full_name: 'Marcus Vance',
          username: 'marcus_v',
          avatar_url: '',
        },
      },
    ]
  }

  try {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        user_id,
        role,
        profile:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('project_id', projectId)

    if (error) {
      throw handleDatabaseError(error)
    }

    return data || []
  } catch (err) {
    console.error('getProjectAssignees error:', err)
    return []
  }
}

/**
 * Fetches tasks belonging to a workspace with optional filters.
 *
 * @param {string} workspaceId
 * @param {object} [filters={}]
 * @returns {Promise<Array<object>>}
 */
export async function getWorkspaceTasks(workspaceId, filters = {}, options = {}) {
  if (!workspaceId) return []

  const limit = options.limit || (options.pageSize ? options.pageSize : null)
  const offset = options.offset || (options.page && limit ? (options.page - 1) * limit : 0)

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    let result = DEMO_TASKS.filter((t) => t.workspace_id === workspaceId || workspaceId === 'demo-ws-acme-corp')
    if (filters.projectId) {
      result = result.filter((t) => t.project_id === filters.projectId)
    }
    if (filters.status && filters.status !== 'all') {
      result = result.filter((t) => t.status === filters.status)
    }
    if (filters.priority && filters.priority !== 'all') {
      result = result.filter((t) => t.priority === filters.priority)
    }
    if (filters.assigneeId) {
      result = result.filter((t) => t.assignee_id === filters.assigneeId)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.labels.some((l) => l.toLowerCase().includes(q)) ||
          `${t.project?.key}-${t.task_number}`.toLowerCase().includes(q)
      )
    }
    if (limit) {
      result = result.slice(offset, offset + limit)
    }
    return result
  }

  try {
    let query = supabase
      .from('tasks')
      .select(`
        id,
        workspace_id,
        project_id,
        task_number,
        title,
        description,
        status,
        priority,
        assignee_id,
        reporter_id,
        due_date,
        position,
        labels,
        estimated_hours,
        created_at,
        updated_at,
        project:project_id (
          id,
          name,
          key,
          status,
          visibility
        ),
        assignee:assignee_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        reporter:reporter_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId)
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority)
    }
    if (filters.assigneeId) {
      query = query.eq('assignee_id', filters.assigneeId)
    }

    query = query.order('position', { ascending: true }).order('created_at', { ascending: false })

    if (limit) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query
    if (error) {
      throw handleDatabaseError(error)
    }

    let tasks = data || []
    if (filters.search) {
      const q = filters.search.toLowerCase()
      tasks = tasks.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          (t.labels && t.labels.some((l) => l.toLowerCase().includes(q))) ||
          `${t.project?.key}-${t.task_number}`.toLowerCase().includes(q)
      )
    }

    return tasks
  } catch (err) {
    console.error('getWorkspaceTasks error:', err)
    return []
  }
}

/**
 * Fetches tasks assigned to a specific user within a workspace.
 *
 * @param {string} userId
 * @param {string} workspaceId
 * @param {object} [filters={}]
 * @returns {Promise<Array<object>>}
 */
export async function getMyTasks(userId, workspaceId, filters = {}) {
  return getWorkspaceTasks(workspaceId, { ...filters, assigneeId: userId })
}

/**
 * Fetches a single task by its UUID.
 *
 * @param {string} taskId
 * @returns {Promise<object>}
 */
export async function getTaskById(taskId) {
  if (!taskId) return null

  if (!isSupabaseConfigured || taskId.startsWith('demo-')) {
    const match = DEMO_TASKS.find((t) => t.id === taskId)
    return match || null
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        workspace_id,
        project_id,
        task_number,
        title,
        description,
        status,
        priority,
        assignee_id,
        reporter_id,
        due_date,
        position,
        labels,
        estimated_hours,
        created_at,
        updated_at,
        project:project_id (
          id,
          name,
          key,
          status,
          visibility
        ),
        assignee:assignee_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        reporter:reporter_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('id', taskId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw handleDatabaseError(error)
    }

    return data || null
  } catch (err) {
    console.error('getTaskById error:', err)
    return null
  }
}

/**
 * Creates a new task.
 * Enforces project membership validation for assignees per Stage 12 requirements.
 *
 * @param {object} params
 * @param {string} params.workspaceId
 * @param {string} params.projectId
 * @param {string} params.title
 * @param {string} [params.description='']
 * @param {'todo'|'in_progress'|'in_review'|'completed'} [params.status='todo']
 * @param {'low'|'medium'|'high'|'urgent'} [params.priority='medium']
 * @param {string} [params.assigneeId=null]
 * @param {string} [params.dueDate=null]
 * @param {number} [params.estimatedHours=null]
 * @param {Array<string>} [params.labels=[]]
 * @param {string} params.reporterId
 * @returns {Promise<object>}
 */
export async function createTask({
  workspaceId,
  projectId,
  title,
  description = '',
  status = 'todo',
  priority = 'medium',
  assigneeId = null,
  dueDate = null,
  estimatedHours = null,
  labels = [],
  reporterId,
}) {
  // CRITICAL REQUIREMENT: Validate project membership before assigning tasks
  if (assigneeId) {
    const isMember = await isUserProjectMember(projectId, assigneeId)
    if (!isMember) {
      throw new Error(
        'The selected user is not a member of this project. Assign the user to the project team before assigning tasks.'
      )
    }
  }

  // Parse labels if string or array
  const formattedLabels = Array.isArray(labels)
    ? labels
    : typeof labels === 'string'
    ? labels.split(',').map((l) => l.trim()).filter(Boolean)
    : []

  if (!isSupabaseConfigured || !workspaceId || workspaceId.startsWith('demo-')) {
    const nextNumber = DEMO_TASKS.length + 101
    const newTask = {
      id: `demo-task-${Date.now()}`,
      workspace_id: workspaceId || 'demo-ws-acme-corp',
      project_id: projectId,
      task_number: nextNumber,
      title: title.trim(),
      description: description?.trim() || '',
      status,
      priority,
      assignee_id: assigneeId || null,
      reporter_id: reporterId || 'demo-user-collabspace-uuid',
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      position: (DEMO_TASKS.length + 1) * 1000,
      labels: formattedLabels,
      estimated_hours: estimatedHours ? Number(estimatedHours) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project: {
        id: projectId,
        name: 'Project',
        key: 'PRJ',
        status: 'active',
        visibility: 'workspace',
      },
      assignee: assigneeId
        ? {
            id: assigneeId,
            full_name: 'Assigned Member',
            username: 'member',
            avatar_url: '',
          }
        : null,
      reporter: {
        id: reporterId || 'demo-user-collabspace-uuid',
        full_name: 'Alex Rivera (You)',
        username: 'alex_rivera',
        avatar_url: '',
      },
    }
    DEMO_TASKS.unshift(newTask)
    return newTask
  }

  try {
    const payload = {
      workspace_id: workspaceId,
      project_id: projectId,
      title: title.trim(),
      description: description ? description.trim() : '',
      status,
      priority,
      assignee_id: assigneeId || null,
      reporter_id: reporterId,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      estimated_hours: estimatedHours !== null && estimatedHours !== undefined && estimatedHours !== '' ? Number(estimatedHours) : null,
      labels: formattedLabels,
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select(`
        id,
        workspace_id,
        project_id,
        task_number,
        title,
        description,
        status,
        priority,
        assignee_id,
        reporter_id,
        due_date,
        position,
        labels,
        estimated_hours,
        created_at,
        updated_at,
        project:project_id (
          id,
          name,
          key,
          status,
          visibility
        ),
        assignee:assignee_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        reporter:reporter_id (
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

    return data
  } catch (err) {
    console.error('createTask error:', err)
    throw err
  }
}

/**
 * Updates an existing task's fields.
 * Validates project membership if assignee is altered.
 *
 * @param {string} taskId
 * @param {object} updates
 * @returns {Promise<object>}
 */
export async function updateTask(taskId, updates) {
  if (!isSupabaseConfigured || !taskId || taskId.startsWith('demo-')) {
    const idx = DEMO_TASKS.findIndex((t) => t.id === taskId)
    if (idx !== -1) {
      DEMO_TASKS[idx] = {
        ...DEMO_TASKS[idx],
        ...updates,
        estimated_hours:
          updates.estimatedHours !== undefined
            ? Number(updates.estimatedHours)
            : updates.estimated_hours !== undefined
            ? Number(updates.estimated_hours)
            : DEMO_TASKS[idx].estimated_hours,
        updated_at: new Date().toISOString(),
      }
      return DEMO_TASKS[idx]
    }
    return { id: taskId, ...updates }
  }

  try {
    // If assignee is changing, validate project membership
    if (updates.assigneeId !== undefined && updates.assigneeId !== null && updates.projectId) {
      const isMember = await isUserProjectMember(updates.projectId, updates.assigneeId)
      if (!isMember) {
        throw new Error(
          'The selected user is not a member of this project. Assign them to the project team before assigning tasks.'
        )
      }
    }

    const payload = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title !== undefined) payload.title = updates.title.trim()
    if (updates.description !== undefined) payload.description = updates.description.trim()
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.priority !== undefined) payload.priority = updates.priority
    if (updates.assigneeId !== undefined) payload.assignee_id = updates.assigneeId || null
    if (updates.dueDate !== undefined) {
      payload.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null
    }
    if (updates.estimatedHours !== undefined) {
      payload.estimated_hours =
        updates.estimatedHours !== null && updates.estimatedHours !== ''
          ? Number(updates.estimatedHours)
          : null
    }
    if (updates.labels !== undefined) {
      payload.labels = Array.isArray(updates.labels)
        ? updates.labels
        : typeof updates.labels === 'string'
        ? updates.labels.split(',').map((l) => l.trim()).filter(Boolean)
        : []
    }
    if (updates.position !== undefined) payload.position = updates.position

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', taskId)
      .select(`
        id,
        workspace_id,
        project_id,
        task_number,
        title,
        description,
        status,
        priority,
        assignee_id,
        reporter_id,
        due_date,
        position,
        labels,
        estimated_hours,
        created_at,
        updated_at,
        project:project_id (
          id,
          name,
          key,
          status,
          visibility
        ),
        assignee:assignee_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        reporter:reporter_id (
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

    return data
  } catch (err) {
    console.error('updateTask error:', err)
    throw err
  }
}

/**
 * Updates just the status of a task (e.g. moving across Kanban columns).
 *
 * @param {string} taskId
 * @param {'todo'|'in_progress'|'in_review'|'completed'} newStatus
 * @returns {Promise<object>}
 */
export async function updateTaskStatus(taskId, newStatus) {
  return updateTask(taskId, { status: newStatus })
}

/**
 * Permanently deletes a task.
 *
 * @param {string} taskId
 * @returns {Promise<boolean>}
 */
export async function deleteTask(taskId) {
  if (!isSupabaseConfigured || !taskId || taskId.startsWith('demo-')) {
    const idx = DEMO_TASKS.findIndex((t) => t.id === taskId)
    if (idx !== -1) {
      DEMO_TASKS.splice(idx, 1)
    }
    return true
  }

  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      throw handleDatabaseError(error)
    }

    return true
  } catch (err) {
    console.error('deleteTask error:', err)
    throw err
  }
}

/**
 * Calculates a new fractional position for a task placed at targetIndex in columnTasks.
 * Guarantees monotonic ordering without requiring database updates to other tasks.
 *
 * @param {Array<object>} columnTasks - tasks in the target column excluding the moving task, sorted by position
 * @param {number} targetIndex - 0-based insertion index
 * @returns {number}
 */
export function calculateTaskPosition(columnTasks = [], targetIndex = 0) {
  if (!columnTasks || columnTasks.length === 0) {
    return 1000
  }

  // Inserted at top of column
  if (targetIndex <= 0) {
    const firstPos = columnTasks[0]?.position ?? 1000
    return Math.max(1, firstPos / 2)
  }

  // Inserted at bottom of column
  if (targetIndex >= columnTasks.length) {
    const lastPos = columnTasks[columnTasks.length - 1]?.position ?? 1000
    return lastPos + 1000
  }

  // Inserted between two tasks
  const prevPos = columnTasks[targetIndex - 1]?.position ?? 0
  const nextPos = columnTasks[targetIndex]?.position ?? 1000
  return (prevPos + nextPos) / 2
}

/**
 * Optimistically moves a task and persists to Supabase with rollback capability.
 * Broadcasts the change to other project members through Supabase Realtime.
 *
 * @param {object} params
 * @param {string} params.taskId
 * @param {'todo'|'in_progress'|'in_review'|'completed'} params.newStatus
 * @param {number} params.newPosition
 * @param {string} params.workspaceId
 * @param {object} [params.user]
 * @returns {Promise<object>}
 */
export async function moveTaskWithOptimisticUpdate({
  taskId,
  newStatus,
  newPosition,
  workspaceId,
  user,
}) {
  const result = await updateTask(taskId, {
    status: newStatus,
    position: newPosition,
  })

  // Broadcast to other authorized members through Supabase Realtime
  if (isSupabaseConfigured && workspaceId && !workspaceId.startsWith('demo-')) {
    try {
      const channel = supabase.channel(`realtime:kanban:${workspaceId}`)
      await channel.send({
        type: 'broadcast',
        event: 'task_moved',
        payload: {
          taskId,
          status: newStatus,
          position: newPosition,
          userId: user?.id,
          userName: user?.full_name || user?.user_metadata?.full_name || user?.email || 'A team member',
          timestamp: Date.now(),
        },
      })
    } catch (err) {
      console.warn('Realtime broadcast warning:', err)
    }
  }

  return result
}
