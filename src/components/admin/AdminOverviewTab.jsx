import React from 'react'
import {
  Users,
  FolderKanban,
  CheckSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Calendar,
  Activity,
  Layers,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export function AdminOverviewTab({
  overview = {},
  projects = [],
  tasks = [],
  activities = [],
  onNavigateTab,
}) {
  const totalMembers = overview.totalMembers || 0
  const totalProjects = overview.totalProjects || projects.length || 0
  const totalTasks = overview.totalTasks || tasks.length || 0
  const completedTasks = overview.completedTasks || tasks.filter((t) => t.status === 'completed' || t.status === 'done').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calculate task status distribution
  const statusCounts = {
    todo: tasks.filter((t) => t.status === 'todo' || !t.status).length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    in_review: tasks.filter((t) => t.status === 'in_review').length,
    completed: completedTasks,
    cancelled: tasks.filter((t) => t.status === 'cancelled').length,
  }

  // Calculate upcoming deadlines (tasks with due dates in future or recently overdue)
  const now = new Date()
  const tasksWithDates = tasks
    .filter((t) => t.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))

  const upcomingDeadlines = tasksWithDates.slice(0, 5)

  // Top 4 KPIs
  const kpis = [
    {
      label: 'Total Members',
      value: totalMembers,
      subtext: 'Active collaborators',
      icon: Users,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      actionTab: 'members',
    },
    {
      label: 'Total Projects',
      value: totalProjects,
      subtext: `${projects.filter((p) => p.status === 'active').length || totalProjects} active`,
      icon: FolderKanban,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      actionTab: 'projects',
    },
    {
      label: 'Total Tasks',
      value: totalTasks,
      subtext: `${totalTasks - completedTasks} remaining`,
      icon: CheckSquare,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      actionTab: 'tasks',
    },
    {
      label: 'Completed Tasks',
      value: completedTasks,
      subtext: `${completionRate}% completion rate`,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      actionTab: 'tasks',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <Card
              key={idx}
              className="border-border/60 hover:border-border transition-all cursor-pointer"
              onClick={() => kpi.actionTab && onNavigateTab && onNavigateTab(kpi.actionTab)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {kpi.label}
                  </span>
                  <div className={`p-2 rounded-lg border ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {kpi.value}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span>{kpi.subtext}</span>
                  <span className="text-primary font-medium flex items-center gap-0.5 hover:underline">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 2. Middle Row: Task Status Distribution Chart & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Chart */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Task Status Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Overall status breakdown across all workspace tasks.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-medium">
                {totalTasks} Total
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {/* Multi-segment Progress Bar */}
            <div className="h-3.5 w-full rounded-full bg-muted/60 overflow-hidden flex border border-border/40 shadow-inner">
              {totalTasks > 0 ? (
                <>
                  <div
                    style={{ width: `${(statusCounts.completed / totalTasks) * 100}%` }}
                    className="bg-emerald-500 transition-all"
                    title={`Completed: ${statusCounts.completed}`}
                  />
                  <div
                    style={{ width: `${(statusCounts.in_progress / totalTasks) * 100}%` }}
                    className="bg-blue-500 transition-all"
                    title={`In Progress: ${statusCounts.in_progress}`}
                  />
                  <div
                    style={{ width: `${(statusCounts.in_review / totalTasks) * 100}%` }}
                    className="bg-purple-500 transition-all"
                    title={`In Review: ${statusCounts.in_review}`}
                  />
                  <div
                    style={{ width: `${(statusCounts.todo / totalTasks) * 100}%` }}
                    className="bg-amber-500 transition-all"
                    title={`Todo: ${statusCounts.todo}`}
                  />
                  <div
                    style={{ width: `${(statusCounts.cancelled / totalTasks) * 100}%` }}
                    className="bg-rose-500 transition-all"
                    title={`Cancelled: ${statusCounts.cancelled}`}
                  />
                </>
              ) : (
                <div className="w-full bg-muted" />
              )}
            </div>

            {/* Status Legend Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Completed
                </span>
                <span className="font-bold text-foreground">{statusCounts.completed}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  In Progress
                </span>
                <span className="font-bold text-foreground">{statusCounts.in_progress}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                  In Review
                </span>
                <span className="font-bold text-foreground">{statusCounts.in_review}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  To Do
                </span>
                <span className="font-bold text-foreground">{statusCounts.todo}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  Cancelled
                </span>
                <span className="font-bold text-foreground">{statusCounts.cancelled}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  Completion
                </span>
                <span className="font-bold text-foreground">{completionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription className="text-xs">
                  Immediate deliverable dates and task milestones.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => onNavigateTab && onNavigateTab('tasks')}
              >
                All Tasks <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-1">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-medium text-foreground">No pending deadlines</p>
                <p className="text-[11px] mt-0.5">All scheduled tasks are on track.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.map((task) => {
                  const dueDate = new Date(task.due_date)
                  const isOverdue = dueDate < now && task.status !== 'completed'
                  const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-semibold text-foreground truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{task.status?.replace('_', ' ') || 'Todo'}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isOverdue ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-medium">
                            Overdue
                          </Badge>
                        ) : daysDiff === 0 ? (
                          <Badge variant="warning" className="text-[10px] px-1.5 py-0 font-medium">
                            Due Today
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium text-muted-foreground">
                            {daysDiff}d left
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Bottom Row: Project Progress & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-primary" />
                  Project Progress
                </CardTitle>
                <CardDescription className="text-xs">
                  Active initiative trajectories and completion stages.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => onNavigateTab && onNavigateTab('projects')}
              >
                All Projects <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-1">
            {projects.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <FolderKanban className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-medium text-foreground">No projects created yet</p>
                <p className="text-[11px] mt-0.5">Create your first workspace project to track delivery.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {projects.slice(0, 5).map((proj) => {
                  const projTasks = tasks.filter((t) => t.project_id === proj.id)
                  const projDone = projTasks.filter((t) => t.status === 'completed' || t.status === 'done').length
                  const progress = proj.progress || (projTasks.length > 0 ? Math.round((projDone / projTasks.length) * 100) : 0)

                  return (
                    <div key={proj.id} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: proj.color || '#6366f1' }}
                          />
                          <span className="font-semibold text-foreground truncate">{proj.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">({proj.key})</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={proj.status === 'active' ? 'outline' : 'secondary'}
                            className="text-[10px] px-1.5 py-0 uppercase"
                          >
                            {proj.status || 'Active'}
                          </Badge>
                          <span className="font-bold text-foreground min-w-[36px] text-right">
                            {progress}%
                          </span>
                        </div>
                      </div>

                      <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Recent Activities
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest collaborative actions and workspace events.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => onNavigateTab && onNavigateTab('activity')}
              >
                Audit Log <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-1">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-medium text-foreground">No recent activities</p>
                <p className="text-[11px] mt-0.5">Workspace actions will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map((act) => {
                  const actor = act.user?.full_name || act.user?.username || 'Team Member'
                  const timeAgo = new Date(act.created_at || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <div key={act.id} className="flex items-start gap-2.5 text-xs">
                      <Avatar
                        name={actor}
                        src={act.user?.avatar_url}
                        className="w-6 h-6 text-[10px] shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-foreground leading-snug">
                          <strong className="font-semibold">{actor}</strong>{' '}
                          <span className="text-muted-foreground">
                            {act.entity_title || act.action?.replace('_', ' ') || 'updated an item'}
                          </span>
                        </p>
                        <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
