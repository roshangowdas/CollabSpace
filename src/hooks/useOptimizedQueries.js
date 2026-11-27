/**
 * CollabSpace Optimized TanStack Query Hooks.
 * 
 * Provides hook wrappers around Supabase service calls with:
 * - Domain-specific stale times & caching policies.
 * - Tenant-scoped query keys (userId + workspaceId).
 * - Automatic loading, error, and empty states.
 * - Granular invalidation triggers.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  queryKeys,
  CACHE_POLICIES,
  invalidateQueries,
} from '@/lib/queryClient'
import {
  getProfile,
  getUserProfileStats,
  getUserWorkspaces,
  getProjects,
  getWorkspaceTasks,
  getDashboardMetrics,
  getNotifications,
  getUnreadCount,
} from '@/services'

/**
 * 1. User Profile Query
 */
export function useProfileQuery(userId) {
  return useQuery({
    queryKey: queryKeys.profile(userId),
    queryFn: () => getProfile(userId),
    enabled: Boolean(userId),
    staleTime: CACHE_POLICIES.profiles.staleTime,
    gcTime: CACHE_POLICIES.profiles.gcTime,
  })
}

/**
 * 2. User Profile Live Statistics Query
 */
export function useProfileStatsQuery(userId) {
  return useQuery({
    queryKey: queryKeys.profileStats(userId),
    queryFn: () => getUserProfileStats(userId),
    enabled: Boolean(userId),
    staleTime: CACHE_POLICIES.dashboardStats.staleTime,
    gcTime: CACHE_POLICIES.dashboardStats.gcTime,
  })
}

/**
 * 3. User Workspaces Query
 */
export function useWorkspacesQuery(userId) {
  return useQuery({
    queryKey: queryKeys.workspaces(userId),
    queryFn: () => getUserWorkspaces(userId),
    enabled: Boolean(userId),
    staleTime: CACHE_POLICIES.workspaces.staleTime,
    gcTime: CACHE_POLICIES.workspaces.gcTime,
  })
}

/**
 * 4. Workspace Projects Query
 */
export function useProjectsQuery(workspaceId) {
  return useQuery({
    queryKey: queryKeys.projects(workspaceId),
    queryFn: () => getProjects(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: CACHE_POLICIES.projects.staleTime,
    gcTime: CACHE_POLICIES.projects.gcTime,
  })
}

/**
 * 5. Kanban & Task Query with Multi-Factor Filtering & Pagination
 */
export function useTasksQuery(workspaceId, projectId, filters = {}, pagination = { page: 1, limit: 50 }) {
  return useQuery({
    queryKey: queryKeys.tasks(workspaceId, projectId, { ...filters, ...pagination }),
    queryFn: async () => {
      const allFilters = { ...filters }
      if (projectId && projectId !== 'all') {
        allFilters.projectId = projectId
      }
      return await getWorkspaceTasks(workspaceId, allFilters, pagination)
    },
    enabled: Boolean(workspaceId),
    staleTime: CACHE_POLICIES.tasks.staleTime,
    gcTime: CACHE_POLICIES.tasks.gcTime,
  })
}

/**
 * 6. Dashboard Velocity & Analytics Statistics Query
 */
export function useDashboardStatsQuery(workspaceId) {
  return useQuery({
    queryKey: queryKeys.dashboardStats(workspaceId),
    queryFn: () => getDashboardMetrics(workspaceId),
    enabled: Boolean(workspaceId),
    staleTime: CACHE_POLICIES.dashboardStats.staleTime,
    gcTime: CACHE_POLICIES.dashboardStats.gcTime,
  })
}

/**
 * 7. In-App Notifications Query
 */
export function useNotificationsQuery(userId, workspaceId, options = { limit: 30 }) {
  return useQuery({
    queryKey: queryKeys.notifications(userId, workspaceId),
    queryFn: () => getNotifications(userId, options),
    enabled: Boolean(userId),
    staleTime: CACHE_POLICIES.notifications.staleTime,
    gcTime: CACHE_POLICIES.notifications.gcTime,
  })
}

/**
 * 8. Unread Notification Count Query (for nav badge)
 */
export function useUnreadNotificationCountQuery(userId) {
  return useQuery({
    queryKey: queryKeys.unreadNotificationCount(userId),
    queryFn: () => getUnreadCount(userId),
    enabled: Boolean(userId),
    staleTime: CACHE_POLICIES.notifications.staleTime,
    gcTime: CACHE_POLICIES.notifications.gcTime,
  })
}

/**
 * Export Invalidation and Cache Utilities
 */
export { invalidateQueries, queryKeys }
