import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  CheckSquare,
  Calendar,
  Layers,
  Sparkles,
  Smile,
  Circle,
  PlayCircle,
  Eye,
  X,
} from 'lucide-react'
import { AppLayout } from '@/components/common/AppLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  TaskCard,
  CreateTaskModal,
  TaskDetailsDrawer,
  TaskPriorityBadge,
  TaskStatusBadge,
} from '@/components/task'
import {
  getMyTasks,
  updateTaskStatus,
} from '@/services/tasks'
import { getWorkspaceProjects } from '@/services/projects'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { cn } from '@/utils/cn'

export function MyTasksPage() {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()

  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, todo, in_progress, in_review, completed
  const [projectFilter, setProjectFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('due_date')

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  const loadMyTasks = useCallback(async () => {
    if (!currentWorkspace?.id || !user?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const [fetchedTasks, fetchedProjects] = await Promise.all([
        getMyTasks(user.id, currentWorkspace.id),
        getWorkspaceProjects(currentWorkspace.id),
      ])
      setTasks(fetchedTasks || [])
      setProjects(fetchedProjects || [])
    } catch (err) {
      console.error('Failed to load my tasks:', err)
      setError(err.message || 'Unable to load assigned tasks.')
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace?.id, user?.id])

  useEffect(() => {
    loadMyTasks()
  }, [loadMyTasks])

  // Handlers
  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev])
    toast.success('Task created and assigned.')
  }

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
    )
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask)
    }
  }

  const handleTaskDeleted = (deletedTaskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== deletedTaskId))
    if (selectedTask?.id === deletedTaskId) {
      setSelectedTask(null)
    }
  }

  const handleToggleComplete = async (task, e) => {
    if (e) e.stopPropagation()
    const isCompleted = task.status === 'completed' || task.status === 'done'
    const newStatus = isCompleted ? 'todo' : 'completed'
    try {
      await updateTaskStatus(task.id, newStatus)
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      )
      toast.success(
        isCompleted
          ? `Task marked as Todo.`
          : `Great job! Task completed.`
      )
    } catch (err) {
      console.error('Status toggle failed:', err)
      toast.error('Failed to update task status.')
    }
  }

  // Summary counts
  const stats = useMemo(() => {
    const total = tasks.length
    const todo = tasks.filter((t) => t.status === 'todo').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const inReview = tasks.filter((t) => t.status === 'in_review').length
    const completed = tasks.filter((t) => t.status === 'completed' || t.status === 'done').length

    const now = new Date().getTime()
    const overdue = tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'done' || !t.due_date) return false
      return new Date(t.due_date).getTime() < now
    }).length

    return { total, todo, inProgress, inReview, completed, overdue }
  }, [tasks])

  // Filter & Sort
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Status filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'completed') {
            if (t.status !== 'completed' && t.status !== 'done') return false
          } else if (t.status !== statusFilter) {
            return false
          }
        }
        // Project filter
        if (projectFilter !== 'all' && t.project_id !== projectFilter) {
          return false
        }
        // Priority filter
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
          return false
        }
        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const titleMatch = t.title?.toLowerCase().includes(q)
          const descMatch = t.description?.toLowerCase().includes(q)
          const keyMatch = `${t.project?.key}-${t.task_number}`.toLowerCase().includes(q)
          if (!titleMatch && !descMatch && !keyMatch) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'due_date') {
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        }
        if (sortBy === 'priority') {
          const rank = { urgent: 4, high: 3, medium: 2, low: 1 }
          return (rank[b.priority] || 0) - (rank[a.priority] || 0)
        }
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })
  }, [tasks, statusFilter, projectFilter, priorityFilter, searchQuery, sortBy])

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">
                {currentWorkspace?.name || 'Workspace'}
              </Link>
              <span>/</span>
              <span className="font-semibold text-foreground">My Tasks</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Assigned to Me
              </h1>
              <Badge variant="brand" size="sm">
                {tasks.length} Assigned
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your personalized task queue and deliverable priorities across all workspace projects.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={loadMyTasks}
              title="Refresh my tasks"
            >
              Refresh
            </Button>
            <Button
              variant="brand"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsCreateOpen(true)}
            >
              New Task
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Assigned to Me</span>
              <CheckSquare className="h-4 w-4 text-brand" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Across all projects</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">In Progress</span>
              <PlayCircle className="h-4 w-4 text-brand" />
            </div>
            <p className="text-2xl font-bold text-brand">{stats.inProgress}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Currently active</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Overdue</span>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {stats.overdue}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Needs attention</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Completed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.completed}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Done deliverables</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="space-y-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
            {[
              { id: 'all', label: 'All Tasks', count: stats.total },
              { id: 'todo', label: 'Todo', count: stats.todo },
              { id: 'in_progress', label: 'In Progress', count: stats.inProgress },
              { id: 'in_review', label: 'In Review', count: stats.inReview },
              { id: 'completed', label: 'Completed', count: stats.completed },
            ].map((tab) => {
              const isActive = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0',
                    isActive
                      ? 'bg-secondary text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] font-mono',
                      isActive ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search and Secondary Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search assigned tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-40">
                <Select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Projects' },
                    ...projects.map((p) => ({
                      value: p.id,
                      label: `[${p.key}] ${p.name}`,
                    })),
                  ]}
                />
              </div>

              <div className="w-32">
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Priorities' },
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ]}
                />
              </div>

              <div className="w-36">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'due_date', label: 'Due Date' },
                    { value: 'priority', label: 'Priority' },
                    { value: 'recent', label: 'Newest First' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="xs" onClick={loadMyTasks}>
              Try Again
            </Button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State: No assigned tasks at all */}
        {!isLoading && !error && tasks.length === 0 && (
          <EmptyState
            icon={Smile}
            title="You're all caught up!"
            description="You currently have no open deliverables assigned to you in this workspace."
            action={
              <Button
                variant="brand"
                size="default"
                leftIcon={Plus}
                onClick={() => setIsCreateOpen(true)}
              >
                Create a Task
              </Button>
            }
          />
        )}

        {/* Empty State: Filter matched nothing */}
        {!isLoading && !error && tasks.length > 0 && filteredTasks.length === 0 && (
          <EmptyState
            icon={CheckSquare}
            title="No tasks match your filters"
            description="Try resetting your status or project filters to view all assigned tasks."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setProjectFilter('all')
                  setPriorityFilter('all')
                }}
              >
                Reset Filters
              </Button>
            }
          />
        )}

        {/* Tasks List */}
        {!isLoading && !error && filteredTasks.length > 0 && (
          <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden shadow-subtle">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed' || task.status === 'done'
              const taskKey = task.project?.key ? `${task.project.key}-${task.task_number}` : `#${task.task_number}`

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer gap-3',
                    isCompleted && 'bg-muted/10 opacity-75'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Quick Completion Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleComplete(task, e)}
                      className={cn(
                        'mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors shrink-0',
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-muted-foreground/50 hover:border-brand hover:bg-brand/10'
                      )}
                      title={isCompleted ? 'Mark as todo' : 'Mark as complete'}
                    >
                      {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                          {taskKey}
                        </span>
                        {task.project?.name && (
                          <span className="text-[11px] text-muted-foreground font-medium">
                            • {task.project.name}
                          </span>
                        )}
                        <TaskPriorityBadge priority={task.priority} />
                      </div>

                      <h4
                        className={cn(
                          'text-sm font-semibold text-foreground tracking-tight line-clamp-1',
                          isCompleted && 'line-through text-muted-foreground font-normal'
                        )}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Meta Column */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <TaskStatusBadge status={task.status} />

                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(task.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Details Drawer */}
      <TaskDetailsDrawer
        isOpen={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </AppLayout>
  )
}

