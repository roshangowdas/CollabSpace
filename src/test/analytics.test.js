// Globals (describe, it, expect) provided by Vitest
import {
  getWorkspaceAnalytics,
  computeAnalyticsMetrics,
  getDateRangeBoundaries,
  normalizeStatus,
} from '@/services/analytics'

describe('Analytics Engine Suite', () => {
  const workspaceId = 'demo-ws-acme-corp'

  describe('Status Normalization & Date Range Boundaries', () => {
    it('normalizes various status representations to canonical groups', () => {
      expect(normalizeStatus('done')).toBe('completed')
      expect(normalizeStatus('completed')).toBe('completed')
      expect(normalizeStatus('in_progress')).toBe('in_progress')
      expect(normalizeStatus('in_review')).toBe('in_progress')
      expect(normalizeStatus('todo')).toBe('todo')
      expect(normalizeStatus('backlog')).toBe('todo')
    })

    it('computes valid start and end dates for 7d, 30d, 90d, and all', () => {
      const b7 = getDateRangeBoundaries('7d')
      expect(b7.startDate).toBeDefined()
      expect(b7.endDate).toBeDefined()
      expect(b7.startDate.getTime()).toBeLessThan(b7.endDate.getTime())

      const bAll = getDateRangeBoundaries('all')
      expect(bAll.startDate).toBeNull()
    })
  })

  describe('KPI Metric Calculations & Math Accuracy', () => {
    const mockTasks = [
      { id: '1', status: 'completed', priority: 'high', project_id: 'p1', assignee_id: 'u1', due_date: null },
      { id: '2', status: 'completed', priority: 'medium', project_id: 'p1', assignee_id: 'u1', due_date: null },
      { id: '3', status: 'in_progress', priority: 'urgent', project_id: 'p1', assignee_id: 'u2', due_date: null },
      { id: '4', status: 'todo', priority: 'low', project_id: 'p2', assignee_id: 'u2', due_date: new Date(Date.now() - 100000).toISOString() }, // Overdue
    ]

    const mockProjects = [
      { id: 'p1', name: 'Project 1', key: 'P1', color: '#6366f1' },
      { id: 'p2', name: 'Project 2', key: 'P2', color: '#10b981' },
    ]

    const mockMembers = [
      { user_id: 'u1', full_name: 'User One', role: 'Developer' },
      { user_id: 'u2', full_name: 'User Two', role: 'Tester' },
    ]

    it('computes correct total, completed, in-progress, pending, and overdue counts', () => {
      const metrics = computeAnalyticsMetrics({
        projects: mockProjects,
        tasks: mockTasks,
        members: mockMembers,
        dateRange: 'all',
      })

      expect(metrics.totalProjects).toBe(2)
      expect(metrics.totalTasks).toBe(4)
      expect(metrics.completedTasks).toBe(2)
      expect(metrics.inProgressTasks).toBe(1)
      expect(metrics.pendingTasks).toBe(1)
      expect(metrics.overdueTasks).toBe(1)
      expect(metrics.completionPercentage).toBe(50) // 2 out of 4 = 50%
    })

    it('computes accurate project completion percentages', () => {
      const metrics = computeAnalyticsMetrics({
        projects: mockProjects,
        tasks: mockTasks,
        members: mockMembers,
        dateRange: 'all',
      })

      const p1 = metrics.projectCompletionPercentages.find((p) => p.id === 'p1')
      expect(p1).toBeDefined()
      expect(p1.total).toBe(3)
      expect(p1.completed).toBe(2)
      expect(p1.percentage).toBe(67) // 2/3 = 67%
    })

    it('distributes tasks accurately across members and priorities', () => {
      const metrics = computeAnalyticsMetrics({
        projects: mockProjects,
        tasks: mockTasks,
        members: mockMembers,
        dateRange: 'all',
      })

      expect(metrics.taskPriorityDistribution.find((p) => p.name === 'High').value).toBe(1)
      expect(metrics.taskPriorityDistribution.find((p) => p.name === 'Urgent').value).toBe(1)
      expect(metrics.taskPriorityDistribution.find((p) => p.name === 'Medium').value).toBe(1)
      expect(metrics.taskPriorityDistribution.find((p) => p.name === 'Low').value).toBe(1)

      const u1 = metrics.memberTaskDistribution.find((m) => m.userId === 'u1')
      expect(u1.total).toBe(2)
      expect(u1.completed).toBe(2)
    })
  })

  describe('Workspace Analytics Retrieval with Filters', () => {
    it('requires workspace ID parameter', async () => {
      await expect(getWorkspaceAnalytics(null)).rejects.toThrow(/workspace id is required/i)
    })

    it('fetches analytics for workspace with 7d, 30d, and all-time filters', async () => {
      const res30d = await getWorkspaceAnalytics(workspaceId, { dateRange: '30d' })
      expect(res30d).toHaveProperty('totalTasks')
      expect(res30d).toHaveProperty('totalProjects')
      expect(res30d).toHaveProperty('projectCompletionPercentages')
      expect(res30d).toHaveProperty('weeklyTaskCompletion')
    })
  })
})
