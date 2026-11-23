import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Calendar,
  Clock,
  User,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag,
  Plus,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { TaskStatusBadge } from './TaskStatusBadge'
import { TaskDiscussionsSection } from '@/components/discussion'
import { TaskAttachmentsSection } from '@/components/file'
import {
  updateTask,
  deleteTask,
  getProjectAssignees,
} from '@/services/tasks'
import { toast } from 'sonner'

export function TaskDetailsDrawer({
  isOpen,
  onClose,
  task,
  onTaskUpdated,
  onTaskDeleted,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: '',
    dueDate: '',
    estimatedHours: '',
    labels: [],
  })

  const [newLabelInput, setNewLabelInput] = useState('')
  const [eligibleAssignees, setEligibleAssignees] = useState([])
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)

  // Initialize form state whenever task changes or drawer opens
  useEffect(() => {
    if (task && isOpen) {
      const formatDateForInput = (isoDate) => {
        if (!isoDate) return ''
        try {
          return new Date(isoDate).toISOString().split('T')[0]
        } catch {
          return ''
        }
      }

      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assigneeId: task.assignee_id || task.assignee?.id || '',
        dueDate: formatDateForInput(task.due_date),
        estimatedHours: task.estimated_hours ?? '',
        labels: Array.isArray(task.labels) ? task.labels : [],
      })
      setError(null)

      // Fetch eligible assignees who are project members
      async function loadAssignees() {
        if (!task.project_id) return
        setIsLoadingAssignees(true)
        try {
          const members = await getProjectAssignees(task.project_id)
          setEligibleAssignees(members || [])
        } catch (err) {
          console.warn('Failed to load project assignees:', err)
        } finally {
          setIsLoadingAssignees(false)
        }
      }

      loadAssignees()
    }
  }, [task, isOpen])

  if (!task) return null

  const taskKey = task.project?.key ? `${task.project.key}-${task.task_number}` : `#${task.task_number}`

  const handleAddLabel = (e) => {
    e.preventDefault()
    if (!newLabelInput.trim()) return
    const cleanLabel = newLabelInput.trim()
    if (!formData.labels.includes(cleanLabel)) {
      setFormData((prev) => ({
        ...prev,
        labels: [...prev.labels, cleanLabel],
      }))
    }
    setNewLabelInput('')
  }

  const handleRemoveLabel = (labelToRemove) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels.filter((l) => l !== labelToRemove),
    }))
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const updated = await updateTask(task.id, {
        projectId: task.project_id,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assigneeId: formData.assigneeId || null,
        dueDate: formData.dueDate || null,
        estimatedHours: formData.estimatedHours,
        labels: formData.labels,
      })

      // Resolve assignee profile
      let assigneeProfile = null
      if (formData.assigneeId) {
        const found = eligibleAssignees.find((a) => a.user_id === formData.assigneeId)
        if (found) assigneeProfile = found.profile
      }

      const merged = {
        ...task,
        ...updated,
        assignee: assigneeProfile || updated.assignee || task.assignee,
      }

      if (onTaskUpdated) {
        onTaskUpdated(merged)
      }
      toast.success(`Task ${taskKey} updated.`)
      onClose()
    } catch (err) {
      console.error('Task update failed:', err)
      setError(err.message || 'Failed to update task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete task "${taskKey}: ${task.title}"?`
    )
    if (!confirmed) return

    setIsDeleting(true)
    setError(null)
    try {
      await deleteTask(task.id)
      if (onTaskDeleted) {
        onTaskDeleted(task.id)
      }
      toast.success(`Task ${taskKey} deleted.`)
      onClose()
    } catch (err) {
      console.error('Task deletion failed:', err)
      setError(err.message || 'Failed to delete task.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Slide-over Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative z-50 flex h-full w-full max-w-xl flex-col bg-card shadow-modal border-l border-border overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                  {taskKey}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {task.project?.name || 'Project Task'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  title="Close drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Title input */}
              <div className="space-y-1.5">
                <Label htmlFor="task-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task Title
                </Label>
                <Input
                  id="task-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task title..."
                  className="text-base font-semibold"
                  required
                />
              </div>

              {/* Status and Priority selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="task-status">Status</Label>
                  <Select
                    id="task-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                      { value: 'todo', label: 'Todo' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'in_review', label: 'In Review' },
                      { value: 'completed', label: 'Completed' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    id="task-priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    options={[
                      { value: 'low', label: 'Low Priority' },
                      { value: 'medium', label: 'Medium Priority' },
                      { value: 'high', label: 'High Priority' },
                      { value: 'urgent', label: 'Urgent Priority' },
                    ]}
                  />
                </div>
              </div>

              {/* Assignee (Validated Project Members) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="task-assignee">Assignee</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Project members only
                  </span>
                </div>
                <Select
                  id="task-assignee"
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...eligibleAssignees.map((m) => ({
                      value: m.user_id,
                      label: `${m.profile?.full_name || m.profile?.username || 'Member'} (${m.role})`,
                    })),
                  ]}
                />
              </div>

              {/* Due Date & Estimated Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="task-due-date">Due Date</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="task-hours">Estimated Hours</Label>
                  <Input
                    id="task-hours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g. 4.5"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  />
                </div>
              </div>

              {/* Labels / Tags */}
              <div className="space-y-2">
                <Label htmlFor="task-labels">Labels & Tags</Label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {formData.labels.map((lbl, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-secondary text-secondary-foreground font-medium"
                    >
                      <span>{lbl}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLabel(lbl)}
                        className="rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    id="task-labels"
                    placeholder="Add label (e.g. Bug, Frontend, Urgent)..."
                    value={newLabelInput}
                    onChange={(e) => setNewLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddLabel(e)
                      }
                    }}
                    className="text-xs h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLabel}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="task-description">Description & Details</Label>
                <Textarea
                  id="task-description"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive task specifications, steps to reproduce, or acceptance criteria..."
                  className="text-xs leading-relaxed"
                />
              </div>

              {/* Metadata card */}
              <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Reporter</span>
                  <span className="font-medium text-foreground">
                    {task.reporter?.full_name || 'Team Member'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span className="font-medium text-foreground">
                    {new Date(task.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated</span>
                  <span className="font-medium text-foreground">
                    {new Date(task.updated_at || task.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Task File Attachments */}
              <TaskAttachmentsSection
                task={task}
                workspaceId={task.workspace_id}
              />

              {/* Task Discussions & Activity Timeline */}
              <TaskDiscussionsSection
                task={task}
                members={eligibleAssignees}
                workspaceId={task.workspace_id}
              />
            </form>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-border px-5 py-3.5 bg-card">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="brand"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

