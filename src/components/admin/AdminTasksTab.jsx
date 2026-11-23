import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckSquare,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  User,
  ArrowUpDown,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { updateTaskStatus } from '@/services/tasks'
import { toast } from 'sonner'

export function AdminTasksTab({
  tasks = [],
  projects = [],
  members = [],
  workspaceId,
  onTaskUpdated,
}) {
  const [search, setSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)

  const now = new Date()

  // Project map for quick lookup
  const projectMap = projects.reduce((acc, p) => {
    acc[p.id] = p
    return acc
  }, {})

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q || task.title?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q)

    const matchesProject = selectedProject === 'all' || task.project_id === selectedProject
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus

    const dueDate = task.due_date ? new Date(task.due_date) : null
    const isOverdue = dueDate && dueDate < now && task.status !== 'completed' && task.status !== 'done'
    const matchesOverdue = !showOverdueOnly || isOverdue

    return matchesSearch && matchesProject && matchesPriority && matchesStatus && matchesOverdue
  })

  // Quick stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'done').length
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length
  const overdueTasksCount = tasks.filter((t) => {
    const d = t.due_date ? new Date(t.due_date) : null
    return d && d < now && t.status !== 'completed' && t.status !== 'done'
  }).length

  // Handle Quick Status Change
  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingTaskId(taskId)
    try {
      await updateTaskStatus(taskId, newStatus)
      toast.success('Task status updated.')
      if (onTaskUpdated) onTaskUpdated()
    } catch (err) {
      toast.error(err.message || 'Failed to update task status.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold">Urgent</Badge>
      case 'high':
        return <Badge variant="warning" className="text-[10px] uppercase font-bold">High</Badge>
      case 'medium':
        return <Badge variant="secondary" className="text-[10px] uppercase">Medium</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">Low</Badge>
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'done':
        return <Badge variant="success" className="text-[10px] uppercase">Completed</Badge>
      case 'in_progress':
        return <Badge variant="brand" className="text-[10px] uppercase">In Progress</Badge>
      case 'in_review':
        return <Badge variant="outline" className="text-[10px] uppercase text-purple-600 border-purple-500/20 bg-purple-500/10">In Review</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="text-[10px] uppercase">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">To Do</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Quick Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border/60">
          <p className="text-[11px] text-muted-foreground font-medium">Total Tasks</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{totalTasks}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/60">
          <p className="text-[11px] text-muted-foreground font-medium">In Progress</p>
          <p className="text-xl font-bold text-blue-500 mt-0.5">{inProgressTasks}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/60">
          <p className="text-[11px] text-muted-foreground font-medium">Completed</p>
          <p className="text-xl font-bold text-emerald-500 mt-0.5">{completedTasks}</p>
        </div>
        <div
          className={`p-3 rounded-xl border cursor-pointer transition-colors ${
            showOverdueOnly
              ? 'bg-rose-500/10 border-rose-500 text-rose-600'
              : 'bg-card border-border/60 hover:border-rose-500/40'
          }`}
          onClick={() => setShowOverdueOnly(!showOverdueOnly)}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium">Overdue Tasks</p>
            {overdueTasksCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
          </div>
          <p className="text-xl font-bold text-rose-500 mt-0.5">{overdueTasksCount}</p>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks by title or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-background border border-border rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Project Filter */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.key})
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Overdue Toggle */}
        <Button
          variant={showOverdueOnly ? 'destructive' : 'outline'}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setShowOverdueOnly(!showOverdueOnly)}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Overdue Only</span>
        </Button>
      </div>

      {/* 3. Tasks Table */}
      <Card className="border-border/60 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
            <CheckSquare className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">No Tasks Found</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
              {search || selectedProject !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all' || showOverdueOnly
                ? 'No tasks match your selected filter criteria.'
                : 'Tasks created in projects will show up here.'}
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTasks.map((task) => {
                  const proj = projectMap[task.project_id]
                  const dueDate = task.due_date ? new Date(task.due_date) : null
                  const isCompleted = task.status === 'completed' || task.status === 'done'
                  const isOverdue = dueDate && dueDate < now && !isCompleted

                  // Resolve Assignee name and avatar
                  const assigneeName =
                    task.assignee?.full_name ||
                    task.assignee?.username ||
                    task.assigned_to_name ||
                    'Unassigned'
                  const assigneeAvatar = task.assignee?.avatar_url || ''

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        isOverdue ? 'bg-destructive/5' : ''
                      }`}
                    >
                      {/* Title */}
                      <td className="py-3 px-4">
                        <div className="min-w-0 max-w-md">
                          <p className="font-semibold text-foreground truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4">
                        {proj ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: proj.color || '#6366f1' }}
                            />
                            <span className="font-medium text-foreground truncate max-w-[120px]">
                              {proj.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <select
                          value={task.status || 'todo'}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          disabled={updatingTaskId === task.id}
                          className="text-[11px] bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="in_review">In Review</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        {getPriorityBadge(task.priority)}
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={assigneeName}
                            src={assigneeAvatar}
                            className="w-6 h-6 text-[10px] shrink-0"
                          />
                          <span className="text-foreground truncate max-w-[110px]">
                            {assigneeName}
                          </span>
                        </div>
                      </td>

                      {/* Due Date & Overdue Flag */}
                      <td className="py-3 px-4">
                        {dueDate ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[11px] font-medium ${isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                              {dueDate.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 font-bold uppercase">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Action Link */}
                      <td className="py-3 px-4 text-right">
                        <Link to="/tasks">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
