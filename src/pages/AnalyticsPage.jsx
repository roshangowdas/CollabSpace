import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/common/AppLayout'
import {
  AnalyticsHeader,
  AnalyticsStatCards,
  ProjectCompletionChart,
  WeeklyCompletionChart,
  TaskPriorityChart,
  MemberDistributionChart,
  RecentActivityFeed,
  AnalyticsSkeleton,
  AnalyticsEmptyState,
  AnalyticsErrorState,
} from '@/components/analytics'
import { CreateTaskModal } from '@/components/task/CreateTaskModal'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getWorkspaceProjects } from '@/services/projects'
import { getWorkspaceAnalytics, subscribeToAnalytics } from '@/services/analytics'

export function AnalyticsPage() {
  const navigate = useNavigate()
  const { currentWorkspace, workspaces } = useWorkspace()
  const workspaceId = currentWorkspace?.id || null

  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedRange, setSelectedRange] = useState('30d')
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)

  // 1. Fetch available projects for the filter dropdown
  useEffect(() => {
    let isMounted = true

    async function loadProjects() {
      try {
        const projs = await getWorkspaceProjects(workspaceId)
        if (isMounted) {
          setProjects(projs || [])
        }
      } catch (err) {
        console.error('Failed to load projects for analytics filter:', err)
      }
    }

    if (workspaceId) {
      loadProjects()
    }

    return () => {
      isMounted = false
    }
  }, [workspaceId])

  // 2. Fetch computed analytics
  const fetchAnalytics = useCallback(async () => {
    if (!workspaceId) {
      setMetrics(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const data = await getWorkspaceAnalytics(workspaceId, {
        projectId: selectedProject,
        dateRange: selectedRange,
      })
      setMetrics(data)
    } catch (err) {
      console.error('Analytics load error:', err)
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, selectedProject, selectedRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // 3. Real-Time Subscription: auto-refresh metrics when tasks/projects update
  useEffect(() => {
    if (!workspaceId) return

    const sub = subscribeToAnalytics(workspaceId, (table) => {
      // Refresh analytics in background on live db events
      getWorkspaceAnalytics(workspaceId, {
        projectId: selectedProject,
        dateRange: selectedRange,
      })
        .then((freshData) => setMetrics(freshData))
        .catch((err) => console.error('Realtime analytics refresh failed:', err))
    })

    return () => {
      sub.unsubscribe()
    }
  }, [workspaceId, selectedProject, selectedRange])

  const handleResetFilters = () => {
    setSelectedProject('all')
    setSelectedRange('30d')
  }

  const isEmpty =
    !isLoading &&
    !error &&
    metrics &&
    metrics.totalProjects === 0 &&
    metrics.totalTasks === 0

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Project, Workspace, and Date Filters */}
        <AnalyticsHeader
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
          selectedRange={selectedRange}
          onSelectRange={setSelectedRange}
          onRefresh={fetchAnalytics}
          isLoading={isLoading}
          isLive={true}
        />

        {/* Loading State */}
        {isLoading && !metrics && <AnalyticsSkeleton />}

        {/* Error State */}
        {error && !isLoading && (
          <AnalyticsErrorState error={error} onRetry={fetchAnalytics} />
        )}

        {/* Empty State */}
        {isEmpty && (
          <AnalyticsEmptyState
            onResetFilters={handleResetFilters}
            onNewTask={() => setIsCreateTaskOpen(true)}
          />
        )}

        {/* Main Analytics Dashboard */}
        {metrics && !error && (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <AnalyticsStatCards metrics={metrics} />

            {/* Row 1: Project Completion & Weekly Completion Velocity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProjectCompletionChart projects={metrics.projectCompletionPercentages} />
              <WeeklyCompletionChart data={metrics.weeklyTaskCompletion} />
            </div>

            {/* Row 2: Priority Donut, Member Distribution & Recent Activities */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <TaskPriorityChart data={metrics.taskPriorityDistribution} />
              <MemberDistributionChart members={metrics.memberTaskDistribution} />
              <RecentActivityFeed activities={metrics.recentActivities} />
            </div>
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          defaultProjectId={selectedProject !== 'all' ? selectedProject : projects[0]?.id}
          onTaskCreated={() => {
            setIsCreateTaskOpen(false)
            fetchAnalytics()
          }}
        />
      )}
    </AppLayout>
  )
}

export default AnalyticsPage
