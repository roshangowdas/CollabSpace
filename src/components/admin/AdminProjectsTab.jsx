import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Calendar,
  Search,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  createProject,
  updateProject,
  archiveProject,
  restoreProject,
  deleteProject,
} from '@/services/projects'
import { toast } from 'sonner'

export function AdminProjectsTab({
  workspaceId,
  projects = [],
  callerId,
  callerRole = 'Admin',
  onProjectUpdated,
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [deletingProject, setDeletingProject] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states for Create/Edit
  const [formName, setFormName] = useState('')
  const [formKey, setFormKey] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formColor, setFormColor] = useState('#6366f1')
  const [formStatus, setFormStatus] = useState('active')

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q || p.name?.toLowerCase().includes(q) || p.key?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Open Create Modal
  const openCreateModal = () => {
    setFormName('')
    setFormKey('')
    setFormDesc('')
    setFormColor('#6366f1')
    setFormStatus('active')
    setIsCreateOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (proj) => {
    setEditingProject(proj)
    setFormName(proj.name || '')
    setFormKey(proj.key || '')
    setFormDesc(proj.description || '')
    setFormColor(proj.color || '#6366f1')
    setFormStatus(proj.status || 'active')
  }

  // Handle Create Project
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Project name is required.')
      return
    }

    const autoKey = formKey.trim().toUpperCase() || formName.slice(0, 3).toUpperCase()

    setIsSubmitting(true)
    try {
      await createProject({
        workspaceId,
        name: formName.trim(),
        key: autoKey,
        description: formDesc.trim(),
        color: formColor,
        status: formStatus,
        ownerId: callerId,
      })
      toast.success(`Project "${formName}" created successfully!`)
      setIsCreateOpen(false)
      if (onProjectUpdated) onProjectUpdated()
    } catch (err) {
      toast.error(err.message || 'Failed to create project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Edit Project
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!formName.trim() || !editingProject) return

    setIsSubmitting(true)
    try {
      await updateProject(editingProject.id, {
        name: formName.trim(),
        description: formDesc.trim(),
        color: formColor,
        status: formStatus,
      })
      toast.success(`Project "${formName}" updated successfully!`)
      setEditingProject(null)
      if (onProjectUpdated) onProjectUpdated()
    } catch (err) {
      toast.error(err.message || 'Failed to update project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Archive / Restore
  const handleToggleArchive = async (proj) => {
    try {
      if (proj.status === 'archived') {
        await restoreProject(proj.id)
        toast.success(`Project "${proj.name}" restored to active status.`)
      } else {
        await archiveProject(proj.id)
        toast.success(`Project "${proj.name}" archived.`)
      }
      if (onProjectUpdated) onProjectUpdated()
    } catch (err) {
      toast.error(err.message || 'Failed to update archive status.')
    }
  }

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingProject) return

    setIsSubmitting(true)
    try {
      await deleteProject(deletingProject.id)
      toast.success(`Project "${deletingProject.name}" permanently deleted.`)
      setDeletingProject(null)
      if (onProjectUpdated) onProjectUpdated()
    } catch (err) {
      toast.error(err.message || 'Failed to delete project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Search, Filter, and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects by name, key, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-background border border-border rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <Button size="sm" onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Create Project
        </Button>
      </div>

      {/* Projects Table */}
      <Card className="border-border/60 overflow-hidden">
        {filteredProjects.length === 0 ? (
          <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
            <FolderKanban className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">No Projects Found</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
              {search || statusFilter !== 'all'
                ? 'No projects match your current filter parameters.'
                : 'Create your first project to start tracking tasks and deliveries.'}
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Key</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProjects.map((proj) => {
                  const progress = proj.progress || 0
                  const isArchived = proj.status === 'archived'

                  return (
                    <tr key={proj.id} className="hover:bg-muted/20 transition-colors">
                      {/* Project Name & Color */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: proj.color || '#6366f1' }}
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/projects/${proj.id}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors truncate block"
                            >
                              {proj.name}
                            </Link>
                            {proj.description && (
                              <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                                {proj.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Key */}
                      <td className="py-3 px-4 font-mono text-[11px] font-semibold text-muted-foreground">
                        {proj.key || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={isArchived ? 'secondary' : 'outline'}
                          className="text-[10px] font-medium uppercase tracking-wider"
                        >
                          {proj.status || 'Active'}
                        </Badge>
                      </td>

                      {/* Progress */}
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {proj.created_at
                          ? new Date(proj.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/projects/${proj.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Open Project"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditModal(proj)}
                            title="Edit Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleToggleArchive(proj)}
                            title={isArchived ? 'Restore Project' : 'Archive Project'}
                          >
                            {isArchived ? (
                              <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletingProject(proj)}
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-border shadow-modal rounded-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Create New Project</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Project Name *</label>
                <Input
                  required
                  placeholder="e.g. Website Redesign"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Project Key (Short Code)</label>
                <Input
                  placeholder="e.g. WEB (defaults from name)"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  className="font-mono uppercase"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="High-level project scope and goals..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-medium text-foreground mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1">Color</label>
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-8 w-14 rounded border border-border p-0.5 cursor-pointer bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-border shadow-modal rounded-xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Edit Project</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Project Name *</label>
                <Input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-medium text-foreground mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1">Color</label>
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-8 w-14 rounded border border-border p-0.5 cursor-pointer bg-background"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProject(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-border shadow-modal rounded-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Delete Project</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{deletingProject.name}</strong>?
              This will permanently delete all associated tasks, discussions, and attachments. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingProject(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
