import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckSquare,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Loader2,
  Tag,
  Plus,
  X,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { taskSchema } from '@/utils/validators'
import { createTask, getProjectAssignees } from '@/services/tasks'
import { getWorkspaceProjects } from '@/services/projects'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'

export function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  defaultProjectId = '',
  defaultStatus = 'todo',
}) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()

  const [projects, setProjects] = useState([])
  const [assignees, setAssignees] = useState([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false)
  const [labelsList, setLabelsList] = useState([])
  const [labelInput, setLabelInput] = useState('')
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      projectId: defaultProjectId || '',
      description: '',
      status: defaultStatus || 'todo',
      priority: 'medium',
      assigneeId: '',
      dueDate: '',
      estimatedHours: '',
      labels: [],
    },
  })

  // Set status if defaultStatus changes while opening
  useEffect(() => {
    if (isOpen && defaultStatus) {
      setValue('status', defaultStatus)
    }
  }, [isOpen, defaultStatus, setValue])

  const watchedProjectId = watch('projectId')

  // Load projects in workspace
  useEffect(() => {
    async function loadProjects() {
      if (!currentWorkspace?.id || !isOpen) return
      setIsLoadingProjects(true)
      try {
        const projs = await getWorkspaceProjects(currentWorkspace.id)
        setProjects(projs || [])
        // If no project selected yet, select the default or first one
        if (!watchedProjectId && projs && projs.length > 0) {
          const initialId = defaultProjectId || projs[0].id
          setValue('projectId', initialId, { shouldValidate: true })
        }
      } catch (err) {
        console.error('Failed to load projects for task creation:', err)
      } finally {
        setIsLoadingProjects(false)
      }
    }

    loadProjects()
  }, [currentWorkspace?.id, isOpen, defaultProjectId, setValue, watchedProjectId])

  // Load assignees when watched project changes
  useEffect(() => {
    async function loadAssignees() {
      if (!watchedProjectId) {
        setAssignees([])
        return
      }
      setIsLoadingAssignees(true)
      try {
        const list = await getProjectAssignees(watchedProjectId)
        setAssignees(list || [])
      } catch (err) {
        console.warn('Failed to load assignees for project:', err)
      } finally {
        setIsLoadingAssignees(false)
      }
    }

    loadAssignees()
  }, [watchedProjectId])

  const handleAddLabel = (e) => {
    e.preventDefault()
    if (!labelInput.trim()) return
    const clean = labelInput.trim()
    if (!labelsList.includes(clean)) {
      const updated = [...labelsList, clean]
      setLabelsList(updated)
      setValue('labels', updated)
    }
    setLabelInput('')
  }

  const handleRemoveLabel = (item) => {
    const updated = labelsList.filter((l) => l !== item)
    setLabelsList(updated)
    setValue('labels', updated)
  }

  const handleClose = () => {
    reset()
    setLabelsList([])
    setLabelInput('')
    setServerError(null)
    onClose()
  }

  const onSubmit = async (data) => {
    setServerError(null)
    try {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace.')
      }

      const created = await createTask({
        workspaceId: currentWorkspace.id,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate || null,
        estimatedHours: data.estimatedHours,
        labels: labelsList,
        reporterId: user?.id,
      })

      // Resolve project details if needed
      const foundProject = projects.find((p) => p.id === data.projectId)
      const completeTask = {
        ...created,
        project: foundProject || created.project,
      }

      reset()
      setLabelsList([])
      onTaskCreated(completeTask)
      handleClose()
    } catch (err) {
      console.error('Task creation failed:', err)
      setServerError(err.message || 'Failed to create task. Please try again.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      description={`Add a task to "${currentWorkspace?.name || 'Workspace'}"`}
      size="default"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{serverError}</p>
          </div>
        )}

        {/* Project Selector */}
        <div className="space-y-1.5">
          <Label htmlFor="create-task-project">
            Project <span className="text-destructive">*</span>
          </Label>
          <Select
            id="create-task-project"
            {...register('projectId')}
            error={errors.projectId?.message}
            disabled={projects.length === 0}
            options={projects.map((p) => ({
              value: p.id,
              label: `[${p.key}] ${p.name}`,
            }))}
          />
          {projects.length === 0 && !isLoadingProjects && (
            <p className="text-xs text-destructive">
              You must create at least one project before adding tasks.
            </p>
          )}
        </div>

        {/* Task Title */}
        <div className="space-y-1.5">
          <Label htmlFor="create-task-title">
            Task Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="create-task-title"
            placeholder="e.g. Implement drag-and-drop Kanban columns"
            {...register('title')}
            error={errors.title?.message}
            autoFocus
          />
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="create-task-status">Status</Label>
            <Select
              id="create-task-status"
              {...register('status')}
              options={[
                { value: 'todo', label: 'Todo' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'in_review', label: 'In Review' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-task-priority">Priority</Label>
            <Select
              id="create-task-priority"
              {...register('priority')}
              options={[
                { value: 'low', label: 'Low Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'high', label: 'High Priority' },
                { value: 'urgent', label: 'Urgent Priority' },
              ]}
            />
          </div>
        </div>

        {/* Assignee Selection (Validated Project Members) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="create-task-assignee">Assignee</Label>
            <span className="text-[11px] text-muted-foreground">
              {isLoadingAssignees ? 'Loading members...' : 'Project members only'}
            </span>
          </div>
          <Select
            id="create-task-assignee"
            {...register('assigneeId')}
            options={[
              { value: '', label: 'Unassigned' },
              ...assignees.map((m) => ({
                value: m.user_id,
                label: `${m.profile?.full_name || m.profile?.username || 'Member'} (${m.role})`,
              })),
            ]}
          />
        </div>

        {/* Due Date & Estimated Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="create-task-due-date">Due Date</Label>
            <Input
              id="create-task-due-date"
              type="date"
              {...register('dueDate')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-task-hours">Estimated Hours</Label>
            <Input
              id="create-task-hours"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g. 4.5"
              {...register('estimatedHours')}
              error={errors.estimatedHours?.message}
            />
          </div>
        </div>

        {/* Labels / Tags Input */}
        <div className="space-y-2">
          <Label htmlFor="create-task-label-input">Labels</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {labelsList.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground font-medium"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveLabel(item)}
                  className="rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              id="create-task-label-input"
              placeholder="Type label and click add..."
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddLabel(e)
                }
              }}
              className="text-xs h-8"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddLabel}>
              Add
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="create-task-description">Description (Optional)</Label>
          <Textarea
            id="create-task-description"
            rows={3}
            placeholder="Detailed description, requirements, or links..."
            {...register('description')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting || projects.length === 0}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Creating Task...</span>
              </>
            ) : (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                <span>Create Task</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

