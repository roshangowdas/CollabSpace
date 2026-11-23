// ==============================================================================
// CollabSpace Service: Real-Time Project Analytics
// File: src/services/analytics.js
// Description:
//   Fetches and computes live project and task analytics, completion rates,
//   member distributions, priority charts, weekly completion velocity, and recent
//   audit activities from actual Supabase records with workspace and project scoping.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'
import { DEMO_PROJECTS } from './projects'
import { DEMO_TASKS } from './tasks'
import { DEMO_ACTIVITIES } from './discussions'

export const DATE_RANGE_PRESETS = [
  { id: '7d', label: 'Last 7 Days', days: 7 },
  { id: '14d', label: 'Last 14 Days', days: 14 },
  { id: '30d', label: 'Last 30 Days', days: 30 },
  { id: '90d', label: 'Last 90 Days', days: 90 },
  { id: 'all', label: 'All Time', days: null },
]

export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#ef4444', border: '#b91c1c' },
  high: { label: 'High', color: '#f97316', border: '#c2410c' },
  medium: { label: 'Medium', color: '#3b82f6', border: '#1d4ed8' },
  low: { label: 'Low', color: '#10b981', border: '#047857' },
}

export const STATUS_CONFIG = {
  todo: { label: 'To Do', color: '#94a3b8' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  in_review: { label: 'In Review', color: '#a855f7' },
  completed: { label: 'Completed', color: '#10b981' },
}

const DEMO_MEMBERS = [
  {
    user_id: 'demo-user-collabspace-uuid',
    profile: {
      id: 'demo-user-collabspace-uuid',
      full_name: 'Alex Rivera (You)',
      username: 'alex_rivera',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    user_id: 'demo-user-sarah',
    profile: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Jenkins',
      username: 'sarah_j',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    },
  },
  {
    user_id: 'demo-user-marcus',
    profile: {
      id: 'demo-user-marcus',
      full_name: 'Marcus Vance',
      username: 'marcus_v',
      avatar_url: '',
    },
  },
  {
    user_id: 'demo-user-david',
    profile: {
      id: 'demo-user-david',
      full_name: 'David Chen',
      username: 'david_chen',
      avatar_url: '',
    },
  },
]

/**
 * Calculates date range boundary timestamps.
 */
export function getDateRangeBoundaries(dateRange = '30d', customStart = null, customEnd = null) {
  const now = new Date()
  let startDate = null
  let endDate = new Date(now.getTime() + 86400 * 1000) // End of current day

  if (customStart) {
    startDate = new Date(customStart)
    if (customEnd) endDate = new Date(customEnd)
    return { startDate, endDate }
  }

  const preset = DATE_RANGE_PRESETS.find((p) => p.id === dateRange)
  if (preset && preset.days) {
    startDate = new Date(now.getTime() - preset.days * 86400 * 1000)
  }

  return { startDate, endDate }
}

/**
 * Normalizes a task status into standard buckets: 'todo', 'in_progress', 'completed'.
 */
export function normalizeStatus(status) {
  if (!status) return 'todo'
  const s = status.toLowerCase()
  if (s === 'completed' || s === 'done') return 'completed'
  if (s === 'in_progress' || s === 'in_review') return 'in_progress'
  return 'todo'
}

/**
 * Computes analytics summary metrics from raw project and task arrays.
 */
export function computeAnalyticsMetrics({ projects = [], tasks = [], members = [], activities = [], dateRange = '30d' }) {
  const now = new Date()
  const { startDate, endDate } = getDateRangeBoundaries(dateRange)

  // 1. Filter tasks by date range if applicable
  const filteredTasks = tasks.filter((task) => {
    if (!startDate) return true
    const taskDate = new Date(task.created_at || task.updated_at || now)
    return taskDate >= startDate && taskDate <= endDate
  })

  // 2. Summary KPI Counts
  const totalProjects = projects.length
  const totalTasks = filteredTasks.length

  let completedTasks = 0
  let pendingTasks = 0
  let inProgressTasks = 0
  let overdueTasks = 0

  filteredTasks.forEach((task) => {
    const norm = normalizeStatus(task.status)
    if (norm === 'completed') {
      completedTasks += 1
    } else if (norm === 'in_progress') {
      inProgressTasks += 1
    } else {
      pendingTasks += 1
    }

    // Overdue check: task has due_date in the past and is not completed
    if (task.due_date && norm !== 'completed') {
      const due = new Date(task.due_date)
      if (due < now) {
        overdueTasks += 1
      }
    }
  })

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // 3. Project Completion Percentages
  const projectCompletionPercentages = projects.map((p) => {
    const pTasks = tasks.filter((t) => t.project_id === p.id)
    const pTotal = pTasks.length
    const pCompleted = pTasks.filter((t) => normalizeStatus(t.status) === 'completed').length
    const pInProgress = pTasks.filter((t) => normalizeStatus(t.status) === 'in_progress').length
    const pPending = pTasks.filter((t) => normalizeStatus(t.status) === 'todo').length
    const pOverdue = pTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && normalizeStatus(t.status) !== 'completed'
    ).length
    const percentage = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0

    return {
      id: p.id,
      name: p.name,
      key: p.key || p.name.slice(0, 3).toUpperCase(),
      color: p.color || '#6366f1',
      total: pTotal,
      completed: pCompleted,
      inProgress: pInProgress,
      pending: pPending,
      overdue: pOverdue,
      percentage,
    }
  })

  // 4. Member Task Distribution
  // Map members to their assigned tasks
  const memberMap = new Map()

  // Initialize from known workspace members
  members.forEach((m) => {
    const uId = m.user_id || m.profile?.id || m.id
    if (!uId) return
    memberMap.set(uId, {
      userId: uId,
      name: m.profile?.full_name || m.name || 'Member',
      username: m.profile?.username || '',
      avatar: m.profile?.avatar_url || m.avatar_url || '',
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      overdue: 0,
    })
  })

  // Aggregate tasks by assignee
  let unassignedCount = 0
  filteredTasks.forEach((task) => {
    const aId = task.assignee_id || task.assignee?.id
    if (!aId) {
      unassignedCount += 1
      return
    }

    if (!memberMap.has(aId)) {
      const aName = task.assignee?.full_name || task.assignee?.name || 'Unknown Member'
      memberMap.set(aId, {
        userId: aId,
        name: aName,
        username: task.assignee?.username || '',
        avatar: task.assignee?.avatar_url || '',
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
      })
    }

    const memberEntry = memberMap.get(aId)
    memberEntry.total += 1
    const norm = normalizeStatus(task.status)
    if (norm === 'completed') memberEntry.completed += 1
    else if (norm === 'in_progress') memberEntry.inProgress += 1
    else memberEntry.pending += 1

    if (task.due_date && new Date(task.due_date) < now && norm !== 'completed') {
      memberEntry.overdue += 1
    }
  })

  const memberTaskDistribution = Array.from(memberMap.values())
    .filter((m) => m.total > 0 || members.length <= 4)
    .sort((a, b) => b.total - a.total)

  if (unassignedCount > 0) {
    memberTaskDistribution.push({
      userId: 'unassigned',
      name: 'Unassigned',
      username: '',
      avatar: '',
      total: unassignedCount,
      completed: 0,
      inProgress: 0,
      pending: unassignedCount,
      overdue: 0,
    })
  }

  // 5. Task Priority Distribution
  const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 }
  filteredTasks.forEach((t) => {
    const p = (t.priority || 'medium').toLowerCase()
    if (priorityCounts[p] !== undefined) {
      priorityCounts[p] += 1
    } else {
      priorityCounts.medium += 1
    }
  })

  const taskPriorityDistribution = [
    {
      priority: 'urgent',
      name: PRIORITY_CONFIG.urgent.label,
      value: priorityCounts.urgent,
      color: PRIORITY_CONFIG.urgent.color,
    },
    {
      priority: 'high',
      name: PRIORITY_CONFIG.high.label,
      value: priorityCounts.high,
      color: PRIORITY_CONFIG.high.color,
    },
    {
      priority: 'medium',
      name: PRIORITY_CONFIG.medium.label,
      value: priorityCounts.medium,
      color: PRIORITY_CONFIG.medium.color,
    },
    {
      priority: 'low',
      name: PRIORITY_CONFIG.low.label,
      value: priorityCounts.low,
      color: PRIORITY_CONFIG.low.color,
    },
  ]

  // 6. Weekly / Periodic Task Completion Velocity
  // Construct dynamic date buckets for past 7 days (or weeks depending on dateRange)
  const daysSpan = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 7
  const weeklyTaskCompletion = []

  for (let i = daysSpan - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400 * 1000)
    const dateStr = d.toISOString().split('T')[0]
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dayLabel = daysSpan <= 7 ? weekday : `${weekday} ${d.getDate()}`

    // Count tasks completed on this day
    const completedOnDay = filteredTasks.filter((t) => {
      if (normalizeStatus(t.status) !== 'completed') return false
      const updateDate = (t.updated_at || t.created_at || '').split('T')[0]
      return updateDate === dateStr
    }).length

    // Count tasks created on this day
    const createdOnDay = filteredTasks.filter((t) => {
      const createDate = (t.created_at || '').split('T')[0]
      return createDate === dateStr
    }).length

    weeklyTaskCompletion.push({
      date: dayLabel,
      fullDate: dateStr,
      completed: completedOnDay,
      created: createdOnDay,
    })
  }

  // 7. Recent Activities
  const recentActivities = activities.slice(0, 10).map((act) => ({
    id: act.id,
    action: act.action || 'updated',
    entityType: act.entity_type || 'task',
    entityTitle: act.entity_title || act.details?.title || 'Task update',
    userName: act.user?.full_name || act.user?.username || 'Team Member',
    userAvatar: act.user?.avatar_url || '',
    createdAt: act.created_at,
    details: act.details || {},
  }))

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    completionPercentage,
    projectCompletionPercentages,
    memberTaskDistribution,
    taskPriorityDistribution,
    weeklyTaskCompletion,
    recentActivities,
  }
}

/**
 * Fetches workspace and project records from Supabase and calculates full real-time analytics.
 *
 * @param {string} workspaceId
 * @param {object} [options={}]
 * @param {string} [options.projectId='all']
 * @param {string} [options.dateRange='30d']
 * @param {string} [options.startDate=null]
 * @param {string} [options.endDate=null]
 * @returns {Promise<object>} Computed analytics dashboard statistics
 */
export async function getWorkspaceAnalytics(workspaceId, options = {}) {
  const { projectId = 'all', dateRange = '30d', startDate = null, endDate = null } = options

  if (!workspaceId) {
    throw new Error('A valid workspace ID is required to retrieve analytics.')
  }

  // Handle Demo / Preview fallback
  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    let projects = [...DEMO_PROJECTS].filter((p) => p.workspace_id === workspaceId || p.workspace_id === 'demo-ws-acme-corp')
    if (projectId && projectId !== 'all') {
      projects = projects.filter((p) => p.id === projectId)
    }

    let tasks = [...DEMO_TASKS].filter((t) => t.workspace_id === workspaceId || t.workspace_id === 'demo-ws-acme-corp')
    if (projectId && projectId !== 'all') {
      tasks = tasks.filter((t) => t.project_id === projectId)
    }

    const members = [...DEMO_MEMBERS]
    const activities = [...DEMO_ACTIVITIES].filter((a) => a.workspace_id === workspaceId || a.workspace_id === 'demo-ws-acme-corp')

    return computeAnalyticsMetrics({
      projects,
      tasks,
      members,
      activities,
      dateRange,
    })
  }

  try {
    // 1. Fetch authorized projects in workspace
    let projectsQuery = supabase
      .from('projects')
      .select('id, name, key, status, color, created_at, updated_at')
      .eq('workspace_id', workspaceId)

    if (projectId && projectId !== 'all') {
      projectsQuery = projectsQuery.eq('id', projectId)
    }

    const { data: projectsData, error: projectsError } = await projectsQuery
    if (projectsError) throw handleDatabaseError(projectsError)
    const projects = projectsData || []

    // 2. Fetch authorized tasks in workspace
    let tasksQuery = supabase
      .from('tasks')
      .select(`
        id,
        workspace_id,
        project_id,
        title,
        status,
        priority,
        due_date,
        assignee_id,
        created_at,
        updated_at,
        assignee:assignee_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)

    if (projectId && projectId !== 'all') {
      tasksQuery = tasksQuery.eq('project_id', projectId)
    }

    const { data: tasksData, error: tasksError } = await tasksQuery
    if (tasksError) throw handleDatabaseError(tasksError)
    const tasks = tasksData || []

    // 3. Fetch workspace members
    const { data: membersData, error: membersError } = await supabase
      .from('workspace_members')
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
      .eq('workspace_id', workspaceId)

    if (membersError) throw handleDatabaseError(membersError)
    const members = membersData || []

    // 4. Fetch recent activity logs
    let activitiesQuery = supabase
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
      .limit(20)

    const { data: activitiesData } = await activitiesQuery
    const activities = activitiesData || []

    return computeAnalyticsMetrics({
      projects,
      tasks,
      members,
      activities,
      dateRange,
    })
  } catch (err) {
    console.error('getWorkspaceAnalytics error:', err)
    return computeAnalyticsMetrics({
      projects: [],
      tasks: [],
      members: [],
      activities: [],
      dateRange,
    })
  }
}

/**
 * Subscribes to Supabase Realtime changes across tasks and projects for live analytics recalculation.
 *
 * @param {string} workspaceId
 * @param {Function} onDataChanged Callback invoked when any relevant record changes
 * @returns {object} Subscription object with an `unsubscribe` method
 */
export function subscribeToAnalytics(workspaceId, onDataChanged) {
  if (!workspaceId || !isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    return { unsubscribe: () => {} }
  }

  const channelName = `analytics:${workspaceId}`
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      () => {
        if (onDataChanged) onDataChanged('tasks')
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      () => {
        if (onDataChanged) onDataChanged('projects')
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_logs',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      () => {
        if (onDataChanged) onDataChanged('activities')
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    },
  }
}
