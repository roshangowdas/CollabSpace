import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  LogOut,
  Layers,
  ArrowRight,
  Settings,
  Users,
  Plus,
  Briefcase,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Check,
  AlertTriangle,
  Calendar,
  Activity,
  Bell,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCheck,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Avatar,
  Input,
} from '@/components/ui'
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal'
import { WorkspaceSettingsModal } from '@/components/workspace/WorkspaceSettingsModal'
import { InviteMemberModal } from '@/components/workspace/InviteMemberModal'
import { WorkspaceMembersList } from '@/components/workspace/WorkspaceMembersList'
import { getWorkspaceProjects, createProject } from '@/services/projects'
import { getMyTasks, updateTaskStatus } from '@/services/tasks'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notifications'
import { getAdminWorkspaceActivities } from '@/services/admin'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { toast } from 'sonner'

export function DashboardPage() {
  const { user, profile, session, logout, isDemoUser } = useAuth()
  const {
    workspaces,
    currentWorkspace,
    members,
    role: workspaceRole,
    isOwner,
    isAdmin,
    switchWorkspace,
  } = useWorkspace()

  const [activeTab, setActiveTab] = useState('overview')
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  // Real Database State
  const [myTasks, setMyTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [notifications, setNotifications] = useState([])
  const [activities, setActivities] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [taskSearch, setTaskSearch] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')

  const workspaceId = currentWorkspace?.id || null
  const userId = user?.id || null

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const username =
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'user'
  const userEmail = profile?.email || user?.email || 'N/A'

  const wsName = currentWorkspace?.name || 'Workspace'
  const wsSlug = currentWorkspace?.slug || 'workspace'
  const wsInitials = wsName.slice(0, 2).toUpperCase()
  const wsPlan = (currentWorkspace?.plan || 'pro').toUpperCase()

  // Fetch actual data belonging to authenticated user and active workspace
  const loadDashboardData = useCallback(async () => {
    if (!workspaceId || !userId) {
      setIsLoadingData(false)
      return
    }

    setIsLoadingData(true)
    setLoadError(null)

    try {
      const [tasksRes, projsRes, notifsRes, actsRes] = await Promise.all([
        getMyTasks(userId, workspaceId).catch((err) => {
          console.warn('My tasks load warning:', err.message)
          return []
        }),
        getWorkspaceProjects(workspaceId).catch((err) => {
          console.warn('Projects load warning:', err.message)
          return []
        }),
        getUserNotifications(userId, workspaceId).catch((err) => {
          console.warn('Notifications load warning:', err.message)
          return []
        }),
        getAdminWorkspaceActivities(workspaceId, { id: userId, role: workspaceRole }).catch(
          (err) => {
            console.warn('Activities load warning:', err.message)
            return []
          }
        ),
      ])

      setMyTasks(tasksRes || [])
      setProjects(projsRes || [])
      setNotifications(notifsRes || [])
      setActivities(actsRes || [])
    } catch (err) {
      console.error('Failed to load user dashboard data:', err)
      setLoadError(err.message || 'Failed to retrieve workspace data.')
    } finally {
      setIsLoadingData(false)
    }
  }, [workspaceId, userId, workspaceRole])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Real-time Supabase Subscription for dynamic synchronization
  useEffect(() => {
    if (!isSupabaseConfigured || !workspaceId) return

    const channel = supabase
      .channel(`realtime:dashboard:${workspaceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          loadDashboardData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          loadDashboardData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, loadDashboardData])

  // Task Status Update Handler
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus)
      toast.success('Task status updated.')
      loadDashboardData()
    } catch (err) {
      toast.error(err.message || 'Failed to update task status.')
    }
  }

  // Notification Handlers
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId, userId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      )
    } catch (err) {
      toast.error(err.message || 'Failed to mark notification as read.')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(userId, workspaceId)
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      toast.success('All notifications marked as read.')
    } catch (err) {
      toast.error(err.message || 'Failed to mark all as read.')
    }
  }

  // Dynamically computed metrics (Zero hardcoded values)
  const now = new Date()
  const totalAssignedTasks = myTasks.length
  const completedTasksCount = myTasks.filter(
    (t) => t.status === 'completed' || t.status === 'done'
  ).length
  const inProgressTasksCount = myTasks.filter((t) => t.status === 'in_progress').length
  const pendingTasksCount = myTasks.filter(
    (t) => t.status === 'todo' || t.status === 'backlog' || !t.status
  ).length
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length
  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length

  // Upcoming task deadlines
  const upcomingDeadlines = myTasks
    .filter((t) => t.due_date && t.status !== 'completed' && t.status !== 'done')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  // Filtered tasks for My Tasks tab
  const filteredMyTasks = myTasks.filter((task) => {
    const q = taskSearch.toLowerCase().trim()
    const matchesSearch =
      !q || task.title?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q)
    const matchesStatus =
      taskStatusFilter === 'all'
        ? true
        : taskStatusFilter === 'completed'
        ? task.status === 'completed' || task.status === 'done'
        : task.status === taskStatusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header / Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                CollabSpace
              </Link>
              <span>/</span>
              <span className="font-semibold text-foreground">{wsName}</span>
              <span>/</span>
              <span>User Dashboard</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome, {displayName}!
              </h1>
              <Badge variant="brand" size="sm" className="font-mono text-xs">
                @{username}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Live workspace hub for your assigned deliverables, active projects, and collaborative initiatives.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={loadDashboardData}
              disabled={isLoadingData}
              title="Refresh database records"
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsCreateWsOpen(true)}
            >
              New Workspace
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={Settings}
                onClick={() => setIsSettingsOpen(true)}
              >
                Workspace Settings
              </Button>
            )}
            <Link to="/profile">
              <Button variant="outline" size="sm" leftIcon={User}>
                Profile
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} leftIcon={LogOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Workspace Identity Banner */}
        <Card className="overflow-hidden border shadow-card bg-card">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
            {/* Logo and Identity */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {currentWorkspace?.logo_url ? (
                <img
                  src={currentWorkspace.logo_url}
                  alt={wsName}
                  className="h-16 w-16 rounded-xl object-cover border shadow-subtle shrink-0 ring-2 ring-background"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-subtle shrink-0">
                  {wsInitials}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{wsName}</h2>
                  <Badge variant="brand" size="sm" className="font-mono text-[10px]">
                    {wsPlan} PLAN
                  </Badge>
                  <Badge variant={isOwner ? 'warning' : isAdmin ? 'brand' : 'secondary'} size="sm">
                    {workspaceRole}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  collabspace.app/{wsSlug}
                </p>
                <p className="text-xs text-foreground/80 line-clamp-1 max-w-xl">
                  {currentWorkspace?.description || 'Collaborative team workspace on CollabSpace.'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/analytics">
                <Button variant="outline" size="sm" leftIcon={BarChart3}>
                  Analytics
                </Button>
              </Link>
              {isAdmin && (
                <Button
                  variant="brand"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => setIsInviteOpen(true)}
                >
                  Invite Members
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar Dynamically Calculated */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t bg-muted/20 divide-x divide-border">
            <div className="p-3 text-center sm:text-left sm:px-6">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Team Members
              </span>
              <p className="text-lg font-bold text-foreground">{members.length}</p>
            </div>
            <div className="p-3 text-center sm:text-left sm:px-6">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Active Projects
              </span>
              <p className="text-lg font-bold text-foreground">{activeProjectsCount}</p>
            </div>
            <div className="p-3 text-center sm:text-left sm:px-6">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                My Assigned Tasks
              </span>
              <p className="text-lg font-bold text-foreground">{totalAssignedTasks}</p>
            </div>
            <div className="p-3 text-center sm:text-left sm:px-6">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Completed by Me
              </span>
              <p className="text-lg font-bold text-emerald-500">{completedTasksCount}</p>
            </div>
          </div>
        </Card>

        {/* Error State with Retry */}
        {loadError && (
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
            <Button size="xs" variant="outline" onClick={loadDashboardData}>
              Retry Connection
            </Button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b pb-2 overflow-x-auto no-scrollbar">
          <Button
            type="button"
            variant={activeTab === 'overview' ? 'brand' : 'ghost'}
            size="sm"
            leftIcon={Layers}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button
            type="button"
            variant={activeTab === 'my_tasks' ? 'brand' : 'ghost'}
            size="sm"
            leftIcon={CheckSquare}
            onClick={() => setActiveTab('my_tasks')}
          >
            My Tasks ({totalAssignedTasks})
          </Button>
          <Button
            type="button"
            variant={activeTab === 'my_projects' ? 'brand' : 'ghost'}
            size="sm"
            leftIcon={FolderKanban}
            onClick={() => setActiveTab('my_projects')}
          >
            My Projects ({projects.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === 'notifications' ? 'brand' : 'ghost'}
            size="sm"
            leftIcon={Bell}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications {unreadNotificationsCount > 0 && `(${unreadNotificationsCount})`}
          </Button>
          <Button
            type="button"
            variant={activeTab === 'members' ? 'brand' : 'ghost'}
            size="sm"
            leftIcon={Users}
            onClick={() => setActiveTab('members')}
          >
            Team Members ({members.length})
          </Button>
          <Button
            type="button"
            variant={activeTab === 'workspaces' ? 'brand' : 'ghost'}
            size="sm"
            leftIcon={Briefcase}
            onClick={() => setActiveTab('workspaces')}
          >
            Workspaces ({workspaces.length})
          </Button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {isLoadingData ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                <span>Loading your workspace deliverables...</span>
              </div>
            ) : (
              <>
                {/* 4 Assigned Task KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border bg-card">
                    <span className="text-xs text-muted-foreground font-medium">Assigned Tasks</span>
                    <p className="text-2xl font-bold text-foreground mt-1">{totalAssignedTasks}</p>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">Total assigned to you</span>
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <span className="text-xs text-muted-foreground font-medium">In Progress</span>
                    <p className="text-2xl font-bold text-blue-500 mt-1">{inProgressTasksCount}</p>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">Currently executing</span>
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <span className="text-xs text-muted-foreground font-medium">Completed by Me</span>
                    <p className="text-2xl font-bold text-emerald-500 mt-1">{completedTasksCount}</p>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">Finished deliverables</span>
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <span className="text-xs text-muted-foreground font-medium">Pending Tasks</span>
                    <p className="text-2xl font-bold text-amber-500 mt-1">{pendingTasksCount}</p>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">Awaiting start</span>
                  </div>
                </div>

                {/* 2-Column Grid: Active Projects & Upcoming Deadlines */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Active Projects */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-primary" />
                          My Active Projects
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setActiveTab('my_projects')}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-1">
                      {projects.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          <FolderKanban className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="font-medium text-foreground">You haven't created any projects yet.</p>
                          <p className="text-[11px] mt-0.5">Start your first project to collaborate with team members.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {projects.slice(0, 4).map((proj) => (
                            <Link
                              key={proj.id}
                              to={`/projects/${proj.id}`}
                              className="block p-3 rounded-lg border hover:border-primary/50 transition-colors bg-muted/20"
                            >
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-semibold text-foreground truncate flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: proj.color || '#6366f1' }}
                                  />
                                  {proj.name}
                                </span>
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                  {proj.key}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
                                {proj.description || 'No description provided.'}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>Progress</span>
                                <span className="font-bold text-foreground">{proj.progress || 0}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${proj.progress || 0}%` }}
                                />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Upcoming Task Deadlines */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          Upcoming Task Deadlines
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setActiveTab('my_tasks')}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-1">
                      {upcomingDeadlines.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          <CheckCircle2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="font-medium text-foreground">No tasks assigned to you yet.</p>
                          <p className="text-[11px] mt-0.5">Tasks assigned to you will appear with deadlines here.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {upcomingDeadlines.map((task) => {
                            const dueDate = new Date(task.due_date)
                            const isOverdue = dueDate < now && task.status !== 'completed' && task.status !== 'done'
                            const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))

                            return (
                              <div
                                key={task.id}
                                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                  isOverdue ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/20'
                                }`}
                              >
                                <div className="min-w-0 flex-1 pr-3">
                                  <p className="font-semibold text-foreground truncate">{task.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-muted-foreground" />
                                      {dueDate.toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                    <span>•</span>
                                    <span className="capitalize">{task.status?.replace('_', ' ') || 'Todo'}</span>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {isOverdue ? (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-medium">
                                      Overdue
                                    </Badge>
                                  ) : daysDiff === 0 ? (
                                    <Badge variant="warning" className="text-[10px] px-1.5 py-0 font-medium">
                                      Due Today
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
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

                {/* Recent Activities Section */}
                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-1">
                    {activities.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="font-medium text-foreground">No recent activity.</p>
                        <p className="text-[11px] mt-0.5">Workspace actions and updates will appear here.</p>
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
              </>
            )}
          </div>
        )}

        {/* TAB 2: My Tasks */}
        {activeTab === 'my_tasks' && (
          <Card className="p-5 border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">My Assigned Tasks</h3>
                <p className="text-xs text-muted-foreground">
                  Deliverables assigned to you across all authorized projects.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="text-xs bg-background border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <select
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                  className="text-xs bg-background border rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {filteredMyTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <CheckSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm">No tasks assigned to you yet.</p>
                <p className="text-xs mt-0.5">When team members assign tasks to your account, they will display here.</p>
              </div>
            ) : (
              <div className="divide-y border rounded-xl overflow-hidden">
                {filteredMyTasks.map((task) => {
                  const dueDate = task.due_date ? new Date(task.due_date) : null
                  const isCompleted = task.status === 'completed' || task.status === 'done'
                  const isOverdue = dueDate && dueDate < now && !isCompleted

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-muted/20 transition-colors ${
                        isOverdue ? 'bg-destructive/5' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold text-foreground ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {task.project?.key || 'PRJ'}-{task.task_number || '1'}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-[9px] uppercase font-bold">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        {dueDate && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            Due: {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={task.status || 'todo'}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                          className="text-xs bg-background border rounded px-2.5 py-1 focus:outline-none"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Completed</option>
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        {/* TAB 3: My Projects */}
        {activeTab === 'my_projects' && (
          <Card className="p-5 border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Authorized Workspace Projects</h3>
                <p className="text-xs text-muted-foreground">
                  Projects you are authorized to participate in and collaborate on.
                </p>
              </div>
              <Link to="/projects">
                <Button size="sm" leftIcon={Plus}>
                  View All Projects
                </Button>
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <FolderKanban className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm">You haven't created any projects yet.</p>
                <p className="text-xs mt-0.5">Create your first project to start tracking sprints and team tasks.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <Card key={proj.id} className="p-4 border hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || '#6366f1' }}
                        />
                        <h4 className="font-semibold text-xs text-foreground truncate">{proj.name}</h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        {proj.key}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 h-8 mb-3">
                      {proj.description || 'No description provided.'}
                    </p>

                    <div className="space-y-1 pt-2 border-t text-[10px]">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-bold text-foreground">{proj.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${proj.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <Link to={`/projects/${proj.id}`}>
                        <Button variant="ghost" size="xs" className="gap-1">
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 4: Notifications */}
        {activeTab === 'notifications' && (
          <Card className="p-5 border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">User Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  Real-time alerts for task assignments, mentions, and project milestones.
                </p>
              </div>
              {unreadNotificationsCount > 0 && (
                <Button variant="outline" size="xs" leftIcon={CheckCheck} onClick={handleMarkAllRead}>
                  Mark All as Read
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="font-semibold text-foreground text-sm">You're all caught up! No notifications.</p>
                <p className="text-xs mt-0.5">New task assignments and mentions will trigger alerts here.</p>
              </div>
            ) : (
              <div className="divide-y border rounded-xl overflow-hidden">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 flex items-start justify-between gap-3 text-xs ${
                      notif.is_read ? 'bg-background' : 'bg-primary/5'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{notif.title || 'Notification'}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>

                    {!notif.is_read && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="text-[10px] shrink-0"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB 5: Team Members */}
        {activeTab === 'members' && (
          <Card className="p-5 border">
            <div className="mb-4 space-y-1">
              <h3 className="text-base font-semibold text-foreground">Workspace Members & RBAC</h3>
              <p className="text-xs text-muted-foreground">
                Collaborators who have access to projects, tasks, channels, and documents in "{wsName}".
              </p>
            </div>
            <WorkspaceMembersList />
          </Card>
        )}

        {/* TAB 6: Your Workspaces Directory */}
        {activeTab === 'workspaces' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">All Your Workspaces</h3>
                <p className="text-xs text-muted-foreground">
                  Workspaces you created or belong to as a team member.
                </p>
              </div>
              <Button
                variant="brand"
                size="sm"
                leftIcon={Plus}
                onClick={() => setIsCreateWsOpen(true)}
              >
                Create Workspace
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {workspaces.map((ws) => {
                const isActive = ws.id === currentWorkspace?.id
                return (
                  <Card
                    key={ws.id}
                    className={`p-4 border transition-all ${
                      isActive
                        ? 'border-brand ring-1 ring-brand bg-brand/5'
                        : 'hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {ws.logo_url ? (
                          <img
                            src={ws.logo_url}
                            alt={ws.name}
                            className="h-9 w-9 rounded-lg object-cover border shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shrink-0">
                            {ws.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs text-foreground truncate">
                            {ws.name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono truncate block">
                            /{ws.slug}
                          </span>
                        </div>
                      </div>

                      <Badge variant="brand" size="sm" className="capitalize text-[10px] py-0 shrink-0">
                        {ws.role}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-4 h-8">
                      {ws.description || 'No workspace description provided.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <span className="text-[10px] text-muted-foreground">
                        Plan: <strong className="text-foreground capitalize">{ws.plan || 'free'}</strong>
                      </span>

                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
                          <Check className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => switchWorkspace(ws.id)}
                        >
                          Switch
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
      />

      {/* Settings Modal */}
      <WorkspaceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  )
}
