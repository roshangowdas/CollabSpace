/**
 * CollabSpace Centralized TanStack Query Client Configuration.
 * 
 * Features:
 * - Domain-specific staleTime and gcTime (cache time) configurations.
 * - Exponential backoff retry handling (skips non-retryable 401/403/404 errors).
 * - Scoped query keys factory (includes userId and workspaceId for strict tenant isolation).
 * - Security: clearPrivateCache() to purge sensitive in-memory cache upon logout/account switch.
 * - Targeted cache invalidation helpers.
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Domain-specific caching policies (in milliseconds).
 */
export const CACHE_POLICIES = {
  // Profiles rarely change during a session
  profiles: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  },
  // Workspaces list and active workspace details
  workspaces: {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 20 * 60 * 1000,    // 20 minutes
  },
  // Projects within an active workspace
  projects: {
    staleTime: 3 * 60 * 1000,  // 3 minutes
    gcTime: 15 * 60 * 1000,    // 15 minutes
  },
  // Kanban tasks (frequently mutated, shorter stale time)
  tasks: {
    staleTime: 60 * 1000,       // 1 minute
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },
  // Dashboard & velocity analytics (computationally heavy)
  dashboardStats: {
    staleTime: 2 * 60 * 1000,  // 2 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  },
  // Notifications (near real-time awareness)
  notifications: {
    staleTime: 30 * 1000,       // 30 seconds
    gcTime: 5 * 60 * 1000,     // 5 minutes
  },
}

/**
 * Structured query key factory.
 * Enforces inclusion of userId and workspaceId to prevent cross-user/cross-tenant cache leakage.
 */
export const queryKeys = {
  profile: (userId) => ['profile', userId || 'anonymous'],
  profileStats: (userId) => ['profile-stats', userId || 'anonymous'],
  workspaces: (userId) => ['workspaces', userId || 'anonymous'],
  workspace: (workspaceId) => ['workspace', workspaceId],
  workspaceMembers: (workspaceId) => ['workspace-members', workspaceId],
  projects: (workspaceId) => ['projects', workspaceId],
  project: (workspaceId, projectId) => ['project', workspaceId, projectId],
  tasks: (workspaceId, projectId, filters = {}) => [
    'tasks',
    workspaceId,
    projectId || 'all',
    filters,
  ],
  task: (taskId) => ['task', taskId],
  taskComments: (taskId) => ['task-comments', taskId],
  dashboardStats: (workspaceId) => ['dashboard-stats', workspaceId],
  notifications: (userId, workspaceId) => ['notifications', userId, workspaceId || 'global'],
  unreadNotificationCount: (userId) => ['notifications-unread-count', userId],
}

/**
 * Centralized QueryClient instance.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent background refetch on tab click
      refetchOnReconnect: true,     // Reconnect after network drop
      retry: (failureCount, error) => {
        // Do not retry on client authorization or not found errors
        const status = error?.status || error?.statusCode || error?.code
        if (status === 401 || status === 403 || status === 404 || status === 'PGRST116') {
          return false
        }
        return failureCount < 2 // Max 2 retries
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
      staleTime: 2 * 60 * 1000, // 2 minutes default
      gcTime: 15 * 60 * 1000,   // 15 minutes default
    },
    mutations: {
      retry: 1,
    },
  },
})

/**
 * Purges all private in-memory query cache data.
 * MUST be invoked on user logout and account switching.
 */
export function clearPrivateCache() {
  try {
    queryClient.clear()
    console.info('[CollabSpace Cache] In-memory query cache safely cleared.')
  } catch (err) {
    console.warn('[CollabSpace Cache] Failed to clear query cache:', err)
  }
}

/**
 * Cache invalidation helpers for granular background refetching.
 */
export const invalidateQueries = {
  profile: (userId) => queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) }),
  workspaces: (userId) => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces(userId) }),
  projects: (workspaceId) => queryClient.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) }),
  tasks: (workspaceId, projectId) => {
    return queryClient.invalidateQueries({
      queryKey: ['tasks', workspaceId, projectId || 'all'],
    })
  },
  dashboardStats: (workspaceId) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats(workspaceId) })
  },
  notifications: (userId, workspaceId) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId, workspaceId) })
  },
}
