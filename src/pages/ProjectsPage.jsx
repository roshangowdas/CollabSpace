import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Layers,
  FolderOpen,
  LayoutGrid,
  List,
  AlertCircle,
  RefreshCw,
  Archive,
  Lock,
  Globe,
} from 'lucide-react'
import { AppLayout } from '@/components/common/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ProjectCard,
  CreateProjectModal,
  EditProjectModal,
  ProjectMembersModal,
} from '@/components/project'
import {
  getWorkspaceProjects,
  archiveProject,
  restoreProject,
  deleteProject,
} from '@/services/projects'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'

export function ProjectsPage() {
  const { user } = useAuth()
  const { currentWorkspace, role: workspaceRole, isOwner, isAdmin } = useWorkspace()

  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, paused, completed, archived
  const [visibilityFilter, setVisibilityFilter] = useState('all') // all, workspace, private
  const [sortBy, setSortBy] = useState('recent') // recent, name, due_date, progress
  const [viewMode, setViewMode] = useState('grid') // grid or list

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [managingMembersProject, setManagingMembersProject] = useState(null)

  // Permissions: Workspace Owner, Admin, or Member can create projects
  const canCreateProject = isOwner || isAdmin || workspaceRole === 'Member'

  // Load workspace projects
  const loadProjects = useCallback(async () => {
    if (!currentWorkspace?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getWorkspaceProjects(currentWorkspace.id)
      setProjects(data || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError(err.message || 'Unable to load workspace projects.')
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace?.id])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Project action handlers
  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev])
    toast.success(`Project "${newProject.name}" created successfully.`)
  }

  const handleProjectUpdated = (updatedProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p))
    )
    toast.success(`Project "${updatedProject.name}" updated.`)
  }

  const handleArchive = async (project) => {
    try {
      await archiveProject(project.id)
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: 'archived' } : p))
      )
      toast.info(`Project "${project.name}" archived.`)
    } catch (err) {
      console.error('Archive failed:', err)
      toast.error(err.message || 'Failed to archive project.')
    }
  }

  const handleRestore = async (project) => {
    try {
      await restoreProject(project.id)
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: 'active' } : p))
      )
      toast.success(`Project "${project.name}" restored to active.`)
    } catch (err) {
      console.error('Restore failed:', err)
      toast.error(err.message || 'Failed to restore project.')
    }
  }

  const handleDelete = async (project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone and will delete associated tasks and documents.`
    )
    if (!confirmed) return

    try {
      await deleteProject(project.id)
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
      toast.success(`Project "${project.name}" deleted.`)
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error(err.message || 'Failed to delete project.')
    }
  }

  // Statistics
  const stats = useMemo(() => {
    const total = projects.length
    const active = projects.filter((p) => p.status === 'active').length
    const completed = projects.filter((p) => p.status === 'completed').length
    const paused = projects.filter((p) => p.status === 'paused').length
    const archived = projects.filter((p) => p.status === 'archived').length

    let avgProgress = 0
    if (total > 0) {
      const sum = projects.reduce((acc, p) => acc + (p.progress || 0), 0)
      avgProgress = Math.round(sum / total)
    }

    return { total, active, completed, paused, archived, avgProgress }
  }, [projects])

  // Filter & Sort
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Status filter
        if (statusFilter !== 'all' && project.status !== statusFilter) {
          return false
        }
        // Visibility filter
        if (visibilityFilter !== 'all' && project.visibility !== visibilityFilter) {
          return false
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const nameMatch = project.name?.toLowerCase().includes(q)
          const keyMatch = project.key?.toLowerCase().includes(q)
          const descMatch = project.description?.toLowerCase().includes(q)
          if (!nameMatch && !keyMatch && !descMatch) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name)
        }
        if (sortBy === 'progress') {
          return (b.progress || 0) - (a.progress || 0)
        }
        if (sortBy === 'due_date') {
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        }
        // Default: recent
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })
  }, [projects, statusFilter, visibilityFilter, searchQuery, sortBy])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/dashboard" className="hover:text-foreground">
                {currentWorkspace?.name || 'Workspace'}
              </Link>
              <span>/</span>
              <span className="font-semibold text-foreground">Projects</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Projects
              </h1>
              <Badge variant="secondary" size="sm">
                {projects.length} Total
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Organize initiatives, track milestone progress, assign roles, and deliver cross-functional outcomes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProjects}
              leftIcon={RefreshCw}
              title="Refresh project list"
            >
              Refresh
            </Button>
            {canCreateProject && (
              <Button
                variant="brand"
                size="sm"
                leftIcon={Plus}
                onClick={() => setIsCreateOpen(true)}
              >
                New Project
              </Button>
            )}
          </div>
        </div>

        {/* High-level Metric Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Active Projects</span>
              <FolderKanban className="h-4 w-4 text-brand" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.active}</p>
            <p className="text-[11px] text-muted-foreground mt-1">In progress across teams</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Completed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Milestones finished</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Average Completion</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">{stats.avgProgress}%</p>
            <p className="text-[11px] text-muted-foreground mt-1">Overall delivery velocity</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-medium">Paused / Archived</span>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.paused + stats.archived}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">On hold or stored</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="space-y-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
            {[
              { id: 'all', label: 'All Projects', count: stats.total },
              { id: 'active', label: 'Active', count: stats.active },
              { id: 'paused', label: 'Paused', count: stats.paused },
              { id: 'completed', label: 'Completed', count: stats.completed },
              { id: 'archived', label: 'Archived', count: stats.archived },
            ].map((tab) => {
              const isActive = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    isActive
                      ? 'bg-secondary text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      isActive ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search and Secondary Filter Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search projects by name, key, or scope..."
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
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Visibility Select */}
              <div className="w-36">
                <Select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Visibility' },
                    { value: 'workspace', label: 'Workspace' },
                    { value: 'private', label: 'Private' },
                  ]}
                />
              </div>

              {/* Sort Select */}
              <div className="w-40">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'recent', label: 'Newest First' },
                    { value: 'name', label: 'Name (A to Z)' },
                    { value: 'due_date', label: 'Due Date' },
                    { value: 'progress', label: 'Highest Progress' },
                  ]}
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${
                    viewMode === 'grid'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${
                    viewMode === 'list'
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
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
            <Button variant="outline" size="xs" onClick={loadProjects}>
              Try Again
            </Button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State: Workspace has no projects */}
        {!isLoading && !error && projects.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="No projects in this workspace yet"
            description="Projects allow your team to group tasks, track deliverables, and manage milestones together."
            action={
              canCreateProject && (
                <Button
                  variant="brand"
                  size="default"
                  leftIcon={Plus}
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create First Project
                </Button>
              )
            }
          />
        )}

        {/* Empty State: Filter matched nothing */}
        {!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 && (
          <EmptyState
            icon={Filter}
            title="No projects match your filter"
            description="Try adjusting your status filter, search keywords, or visibility settings."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setVisibilityFilter('all')
                }}
              >
                Reset All Filters
              </Button>
            }
          />
        )}

        {/* Project Cards (Grid & List View) */}
        {!isLoading && !error && filteredProjects.length > 0 && (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                : 'flex flex-col space-y-3'
            }
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                canModify={isOwner || isAdmin || project.created_by === user?.id}
                onEdit={(p) => setEditingProject(p)}
                onManageMembers={(p) => setManagingMembersProject(p)}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <EditProjectModal
        isOpen={Boolean(editingProject)}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onProjectUpdated={handleProjectUpdated}
      />

      <ProjectMembersModal
        isOpen={Boolean(managingMembersProject)}
        project={managingMembersProject}
        canModify={isOwner || isAdmin || managingMembersProject?.created_by === user?.id}
        onClose={() => setManagingMembersProject(null)}
        onMembersUpdated={(updatedMembers) => {
          if (managingMembersProject) {
            setProjects((prev) =>
              prev.map((p) =>
                p.id === managingMembersProject.id
                  ? { ...p, member_count: updatedMembers.length }
                  : p
              )
            )
          }
        }}
      />
    </AppLayout>
  )
}

