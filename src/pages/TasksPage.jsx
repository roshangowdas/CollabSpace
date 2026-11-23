import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  CheckSquare,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  User,
  Filter,
  PlayCircle,
  Eye,
  Circle,
} from 'lucide-react'
import { AppLayout } from '@/components/common/AppLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  TaskCard,
  TaskFilterBar,
  CreateTaskModal,
  TaskDetailsDrawer,
} from '@/components/task'
import { KanbanBoard } from '@/components/kanban'
import {
  getWorkspaceTasks,
  updateTaskStatus,
} from '@/services/tasks'
import { getWorkspaceProjects } from '@/services/projects'
import { getWorkspaceMembers } from '@/services/workspaces'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'

export function TasksPage() {
  const { user } = useAuth()
  const { currentWorkspace, isOwner, isAdmin, role: workspaceRole } = useWorkspace()

  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, todo, in_progress, in_review, completed
  const [priorityFilter, setPriorityFilter] = useState('all') // all, urgent, high, medium, low
  const [projectFilter, setProjectFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent') // recent, due_date, priority, task_number
  const [viewMode, setViewMode] = useState('board') // 'board' or 'list'

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [createDefaultProjectId, setCreateDefaultProjectId] = useState('')
  const [createDefaultStatus, setCreateDefaultStatus] = useState('todo')

  // Load all tasks, projects, and workspace members
  const loadTasksData = useCallback(async () => {
    if (!currentWorkspace?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const [fetchedTasks, fetchedProjects, fetchedMembers] = await Promise.all([
        getWorkspaceTasks(currentWorkspace.id),
        getWorkspaceProjects(currentWorkspace.id),
        getWorkspaceMembers(currentWorkspace.id),
      ])
      setTasks(fetchedTasks || [])
      setProjects(fetchedProjects || [])
      setMembers(fetchedMembers || [])
    } catch (err) {
      console.error('Failed to load tasks data:', err)
      setError(err.message || 'Unable to load workspace tasks.')
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    loadTasksData()
  }, [loadTasksData])

  // Task event handlers
  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev])
    toast.success(`Task ${newTask.project?.key ? `${newTask.project.key}-${newTask.task_number}` : ''} created.`)
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

  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      await updateTaskStatus(task.id, newStatus)
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      )
      toast.success(`Task status updated to ${newStatus.replace('_', ' ')}.`)
    } catch (err) {
      console.error('Failed to update status:', err)
      toast.error('Failed to update task status.')
    }
  }

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: tasks.length, todo: 0, in_progress: 0, in_review: 0, completed: 0 }
    for (const t of tasks) {
      if (t.status === 'completed' || t.status === 'done') {
        counts.completed += 1
      } else if (counts[t.status] !== undefined) {
        counts[t.status] += 1
      }
    }
    return counts
  }, [tasks])

  // Overdue count
  const overdueCount = useMemo(() => {
    const now = new Date().getTime()
    return tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'done' || !t.due_date) return false
      return new Date(t.due_date).getTime() < now
    }).length
  }, [tasks])

  // Filtered and Sorted Tasks
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

        // Priority filter
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) {
          return false
        }

        // Project filter
        if (projectFilter !== 'all' && t.project_id !== projectFilter) {
          return false
        }

        // Assignee filter
        if (assigneeFilter === 'me') {
          if (t.assignee_id !== user?.id) return false
        } else if (assigneeFilter === 'unassigned') {
          if (t.assignee_id) return false
        } else if (assigneeFilter !== 'all') {
          if (t.assignee_id !== assigneeFilter) return false
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const titleMatch = t.title?.toLowerCase().includes(q)
          const descMatch = t.description?.toLowerCase().includes(q)
          const keyMatch = `${t.project?.key}-${t.task_number}`.toLowerCase().includes(q)
          const labelMatch = t.labels && t.labels.some((l) => l.toLowerCase().includes(q))
          if (!titleMatch && !descMatch && !keyMatch && !labelMatch) return false
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
        if (sortBy === 'task_number') {
          return (b.task_number || 0) - (a.task_number || 0)
        }
        // Default: recent
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })
  }, [tasks, statusFilter, priorityFilter, projectFilter, assigneeFilter, searchQuery, sortBy, user?.id])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">
                {currentWorkspace?.name || 'Workspace'}
              </Link>
              <span>/</span>
              <span className="font-semibold text-foreground">Tasks</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Task Management
              </h1>
              <Badge variant="secondary" size="sm">
                {tasks.length} Total
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track work items, prioritize backlog tickets, assign sprint owners, and verify deliverables.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={loadTasksData}
              title="Refresh tasks"
            >
              Refresh
            </Button>
            <Button
              variant="brand"
              size="sm"
              leftIcon={Plus}
              onClick={() => {
                setCreateDefaultProjectId(projectFilter !== 'all' ? projectFilter : '')
                setIsCreateOpen(true)
              }}
            >
              New Task
            </Button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Total Tasks</span>
              <CheckSquare className="h-4 w-4 text-brand" />
            </div>
            <p className="text-2xl font-bold text-foreground">{statusCounts.all}</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">To Do</span>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{statusCounts.todo}</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">In Progress</span>
              <PlayCircle className="h-4 w-4 text-brand" />
            </div>
            <p className="text-2xl font-bold text-brand">{statusCounts.in_progress}</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Completed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statusCounts.completed}
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Overdue</span>
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {overdueCount}
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <TaskFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          projectFilter={projectFilter}
          onProjectChange={setProjectFilter}
          assigneeFilter={assigneeFilter}
          onAssigneeChange={setAssigneeFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          projects={projects}
          workspaceMembers={members}
          statusCounts={statusCounts}
          onResetFilters={() => {
            setSearchQuery('')
            setStatusFilter('all')
            setPriorityFilter('all')
            setProjectFilter('all')
            setAssigneeFilter('all')
          }}
        />

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="xs" onClick={loadTasksData}>
              Try Again
            </Button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-8 w-full" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State: Workspace has no tasks */}
        {!isLoading && !error && tasks.length === 0 && (
          <EmptyState
            icon={CheckSquare}
            title="No tasks in this workspace"
            description="Create your first task to start organizing team deliverables, assigning owners, and tracking milestones."
            action={
              <Button
                variant="brand"
                size="default"
                leftIcon={Plus}
                onClick={() => setIsCreateOpen(true)}
              >
                Create First Task
              </Button>
            }
          />
        )}

        {/* Empty State: No matching filter results */}
        {!isLoading && !error && tasks.length > 0 && filteredTasks.length === 0 && (
          <EmptyState
            icon={Filter}
            title="No tasks match your filters"
            description="Try clearing your search query or adjusting project, priority, and assignee filters."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setPriorityFilter('all')
                  setProjectFilter('all')
                  setAssigneeFilter('all')
                }}
              >
                Reset All Filters
              </Button>
            }
          />
        )}

        {/* VIEW MODE 1: List View */}
        {!isLoading && !error && viewMode === 'list' && filteredTasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={(t) => setSelectedTask(t)}
                onStatusChange={handleQuickStatusChange}
              />
            ))}
          </div>
        )}

        {/* VIEW MODE 2: Interactive dnd-kit Kanban Board View */}
        {!isLoading && !error && viewMode === 'board' && (
          <KanbanBoard
            tasks={filteredTasks}
            onTasksChange={setTasks}
            onTaskClick={(t) => setSelectedTask(t)}
            onAddTaskToColumn={(columnId) => {
              setCreateDefaultProjectId(projectFilter !== 'all' ? projectFilter : '')
              setCreateDefaultStatus(columnId)
              setIsCreateOpen(true)
            }}
            workspaceId={currentWorkspace?.id}
          />
        )}
      </div>

      {/* Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        defaultProjectId={createDefaultProjectId}
        defaultStatus={createDefaultStatus}
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

