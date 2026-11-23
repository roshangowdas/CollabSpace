import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  FolderKanban,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Lock,
  Globe,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  ArrowLeft,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react'
import { AppLayout } from '@/components/common/AppLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ProjectProgress,
  EditProjectModal,
  ProjectMembersModal,
} from '@/components/project'
import {
  getProjectById,
  archiveProject,
  restoreProject,
  deleteProject,
} from '@/services/projects'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'

export function ProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentWorkspace, role: workspaceRole, isOwner, isAdmin } = useWorkspace()

  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)

  const loadProject = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getProjectById(projectId)
      if (!data) {
        throw new Error('Project not found.')
      }
      // Security check: verify project belongs to active workspace to prevent URL tampering
      if (currentWorkspace?.id && data.workspace_id && data.workspace_id !== currentWorkspace.id) {
        throw new Error('Access denied: You do not have permission to access resources in another workspace.')
      }
      setProject(data)
    } catch (err) {
      console.error('Failed to load project details:', err)
      setError(err.message || 'Unable to load project details.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, currentWorkspace?.id])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  // Permission check
  const canModify =
    isOwner ||
    isAdmin ||
    project?.created_by === user?.id ||
    project?.members?.some((m) => m.user_id === user?.id && m.role === 'Lead')

  const handleProjectUpdated = (updated) => {
    setProject((prev) => ({ ...prev, ...updated }))
    toast.success('Project settings updated.')
  }

  const handleArchive = async () => {
    try {
      await archiveProject(project.id)
      setProject((prev) => ({ ...prev, status: 'archived' }))
      toast.info(`Project "${project.name}" archived.`)
    } catch (err) {
      toast.error(err.message || 'Failed to archive project.')
    }
  }

  const handleRestore = async () => {
    try {
      await restoreProject(project.id)
      setProject((prev) => ({ ...prev, status: 'active' }))
      toast.success(`Project "${project.name}" restored to active.`)
    } catch (err) {
      toast.error(err.message || 'Failed to restore project.')
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${project.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    try {
      await deleteProject(project.id)
      toast.success(`Project "${project.name}" deleted.`)
      navigate('/projects')
    } catch (err) {
      toast.error(err.message || 'Failed to delete project.')
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-5xl">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 col-span-2 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-12 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-destructive/10 text-destructive mb-2">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Project Not Found</h2>
          <p className="text-xs text-muted-foreground">
            {error || 'The requested project could not be found or you do not have permission to view it.'}
          </p>
          <div className="pt-2">
            <Button variant="brand" onClick={() => navigate('/projects')} leftIcon={ArrowLeft}>
              Back to Projects
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Format dates
  const startDateFormatted = project.start_date
    ? new Date(project.start_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not set'

  const dueDateFormatted = project.due_date
    ? new Date(project.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not set'

  // Relative status
  let deadlineStatus = null
  if (project.due_date) {
    const dueTime = new Date(project.due_date).getTime()
    const nowTime = new Date().getTime()
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24))

    if (project.status === 'completed') {
      deadlineStatus = { label: 'Completed', variant: 'success' }
    } else if (diffDays < 0) {
      deadlineStatus = { label: `Overdue by ${Math.abs(diffDays)}d`, variant: 'destructive' }
    } else if (diffDays === 0) {
      deadlineStatus = { label: 'Due today', variant: 'warning' }
    } else {
      deadlineStatus = { label: `${diffDays} days remaining`, variant: 'secondary' }
    }
  }

  const statusVariant = {
    active: 'brand',
    paused: 'warning',
    completed: 'success',
    archived: 'secondary',
  }[project.status] || 'secondary'

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/projects" className="hover:text-foreground flex items-center gap-1 font-medium">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Projects</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-brand font-bold">{project.key}</span>
            <span>/</span>
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              {project.name}
            </span>
          </div>

          {canModify && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={Edit}
                onClick={() => setIsEditOpen(true)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={Users}
                onClick={() => setIsMembersOpen(true)}
              >
                Team ({project.members?.length || project.member_count || 1})
              </Button>
              {project.status === 'archived' ? (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={RotateCcw}
                  onClick={handleRestore}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Archive}
                  onClick={handleArchive}
                >
                  Archive
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                leftIcon={Trash2}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Project Header Banner */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-md bg-brand/10 text-brand border border-brand/20">
                  {project.key}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {project.name}
                </h1>
                <Badge variant={statusVariant} size="sm" className="capitalize">
                  {project.status}
                </Badge>
                <Badge variant="outline" size="sm" className="gap-1">
                  {project.visibility === 'private' ? (
                    <>
                      <Lock className="h-3 w-3 text-muted-foreground" />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span>Workspace Visible</span>
                    </>
                  )}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
                {project.description || 'No description provided for this project.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link to={`/chat/${project.id}`}>
                <Button variant="outline" size="sm" leftIcon={MessageSquare}>
                  Project Chat
                </Button>
              </Link>
              <Link to="/tasks">
                <Button variant="brand" size="sm" leftIcon={CheckSquare}>
                  Tasks Board
                </Button>
              </Link>
            </div>
          </div>

          {/* Timeline details pill row */}
          <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Start: <strong className="text-foreground">{startDateFormatted}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Due: <strong className="text-foreground">{dueDateFormatted}</strong>
              </span>
              {deadlineStatus && (
                <Badge variant={deadlineStatus.variant} size="xs" className="ml-1">
                  {deadlineStatus.label}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                Members:{' '}
                <strong className="text-foreground">
                  {project.members?.length || project.member_count || 1}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid: Progress & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Progress & Tasks Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Project Deliverable Progress
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Computed based on real completed tasks across project sprints
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-3xl font-extrabold text-foreground">
                    {project.progress || 0}%
                  </span>
                </div>
              </div>

              <ProjectProgress
                value={project.progress || 0}
                status={project.status}
                size="lg"
                showLabel={false}
              />

              {/* Task status breakdown counters */}
              <div className="grid grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                  <span className="text-xs text-muted-foreground font-medium block">Total Tasks</span>
                  <span className="text-lg font-bold text-foreground">
                    {project.task_stats?.total || 0}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block">
                    Completed
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {project.task_stats?.done || 0}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-brand/10 border border-brand/20 text-center">
                  <span className="text-xs text-brand font-medium block">In Progress</span>
                  <span className="text-lg font-bold text-brand">
                    {project.task_stats?.in_progress || 0}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                  <span className="text-xs text-muted-foreground font-medium block">To Do</span>
                  <span className="text-lg font-bold text-foreground">
                    {project.task_stats?.todo || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Stage 12 Task Preview Hook */}
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-brand/10 text-brand">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Task Management & Kanban Board
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Tasks for project <strong className="text-foreground">[{project.key}]</strong> are managed in the interactive Kanban board.
              </p>
              <Link to="/tasks-preview">
                <Button variant="outline" size="sm" leftIcon={ExternalLink}>
                  Open Kanban Board
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Assigned Team & Project Lead */}
          <div className="space-y-6">
            {/* Team Members Card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Assigned Team ({project.members?.length || 1})
                  </h3>
                </div>
                {canModify && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsMembersOpen(true)}
                  >
                    Manage
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {(!project.members || project.members.length === 0) ? (
                  <div className="text-xs text-muted-foreground py-2 text-center">
                    No members assigned yet.
                  </div>
                ) : (
                  project.members.map((member) => {
                    const profile = member.profile || {}
                    const isLead = member.role === 'Lead'

                    return (
                      <div
                        key={member.id || member.user_id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={profile.avatar_url}
                            name={profile.full_name || profile.username || 'Member'}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {profile.full_name || profile.username || 'Member'}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              @{profile.username || 'user'}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={isLead ? 'brand' : 'secondary'}
                          size="xs"
                        >
                          {member.role}
                        </Badge>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>

            {/* Project Metadata Card */}
            <Card className="p-5 space-y-3 text-xs text-muted-foreground">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[11px] pb-2 border-b">
                Project Information
              </h4>

              <div className="flex items-center justify-between">
                <span>Created by</span>
                <span className="font-medium text-foreground">
                  {project.creator?.full_name || 'Team Lead'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Created on</span>
                <span className="font-medium text-foreground">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Last updated</span>
                <span className="font-medium text-foreground">
                  {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Workspace</span>
                <span className="font-medium text-foreground">
                  {currentWorkspace?.name || 'Acme Corp'}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProjectModal
        isOpen={isEditOpen}
        project={project}
        onClose={() => setIsEditOpen(false)}
        onProjectUpdated={handleProjectUpdated}
      />

      <ProjectMembersModal
        isOpen={isMembersOpen}
        project={project}
        canModify={canModify}
        onClose={() => setIsMembersOpen(false)}
        onMembersUpdated={(updatedMembers) => {
          setProject((prev) => ({
            ...prev,
            members: updatedMembers,
            member_count: updatedMembers.length,
          }))
        }}
      />
    </AppLayout>
  )
}

