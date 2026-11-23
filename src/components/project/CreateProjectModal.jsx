import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FolderPlus,
  Key,
  Calendar,
  Lock,
  Globe,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { projectSchema } from '@/utils/validators'
import { createProject, generateProjectKey, isProjectKeyAvailable } from '@/services/projects'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [serverError, setServerError] = useState(null)
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
      startDate: '',
      dueDate: '',
      visibility: 'workspace',
      status: 'active',
    },
  })

  const watchedName = watch('name')

  // Auto-generate project key as user types name unless user edited key manually
  const handleNameChange = (e) => {
    const newName = e.target.value
    setValue('name', newName, { shouldValidate: true })
    if (!isKeyManuallyEdited) {
      const generated = generateProjectKey(newName)
      setValue('key', generated, { shouldValidate: true })
    }
  }

  const handleKeyRegenerate = () => {
    const generated = generateProjectKey(watchedName)
    setValue('key', generated, { shouldValidate: true })
    setIsKeyManuallyEdited(false)
  }

  const handleClose = () => {
    reset()
    setServerError(null)
    setIsKeyManuallyEdited(false)
    onClose()
  }

  const onSubmit = async (data) => {
    setServerError(null)
    try {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace selected.')
      }

      // 1. Verify key availability
      const available = await isProjectKeyAvailable(currentWorkspace.id, data.key)
      if (!available) {
        setServerError(`Project key "${data.key}" is already taken in this workspace. Please choose a different key.`)
        return
      }

      // 2. Create project
      const created = await createProject({
        workspaceId: currentWorkspace.id,
        name: data.name,
        key: data.key,
        description: data.description,
        startDate: data.startDate || null,
        dueDate: data.dueDate || null,
        visibility: data.visibility,
        status: data.status,
        userId: user?.id,
      })

      reset()
      onProjectCreated(created)
      handleClose()
    } catch (err) {
      console.error('Project creation failed:', err)
      setServerError(err.message || 'Failed to create project. Please verify your permissions and try again.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      description={`Add a new collaborative project to "${currentWorkspace?.name || 'Workspace'}"`}
      size="default"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{serverError}</p>
          </div>
        )}

        {/* Project Name */}
        <div className="space-y-1.5">
          <Label htmlFor="proj-name">
            Project Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="proj-name"
            placeholder="e.g. Design System v2, iOS App, API Gateway"
            {...register('name', { onChange: handleNameChange })}
            error={errors.name?.message}
            autoFocus
          />
        </div>

        {/* Project Key */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="proj-key">
              Project Key <span className="text-destructive">*</span>
            </Label>
            <button
              type="button"
              onClick={handleKeyRegenerate}
              className="text-[11px] text-brand hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="h-3 w-3" />
              <span>Auto-generate</span>
            </button>
          </div>
          <div className="relative">
            <Input
              id="proj-key"
              placeholder="e.g. DSN, MOB, API"
              {...register('key', {
                onChange: (e) => {
                  setIsKeyManuallyEdited(true)
                  setValue('key', e.target.value.toUpperCase(), { shouldValidate: true })
                },
              })}
              error={errors.key?.message}
              className="font-mono uppercase tracking-wider"
              maxLength={10}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            A short prefix used for task identifiers (e.g. {watch('key') || 'PRJ'}-101).
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="proj-description">Description (Optional)</Label>
          <Textarea
            id="proj-description"
            placeholder="Brief overview of project goals, technical specs, or team scope..."
            rows={3}
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        {/* Dates: Start Date & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="proj-start-date">Start Date</Label>
            <div className="relative">
              <Input
                id="proj-start-date"
                type="date"
                {...register('startDate')}
                error={errors.startDate?.message}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-due-date">Due Date</Label>
            <div className="relative">
              <Input
                id="proj-due-date"
                type="date"
                {...register('dueDate')}
                error={errors.dueDate?.message}
              />
            </div>
          </div>
        </div>

        {/* Visibility & Initial Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="proj-visibility">Visibility</Label>
            <Select
              id="proj-visibility"
              {...register('visibility')}
              error={errors.visibility?.message}
              options={[
                { value: 'workspace', label: 'Workspace (All members can view)' },
                { value: 'private', label: 'Private (Assigned members only)' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-status">Initial Status</Label>
            <Select
              id="proj-status"
              {...register('status')}
              error={errors.status?.message}
              options={[
                { value: 'active', label: 'Active (In progress)' },
                { value: 'paused', label: 'Paused (On hold)' },
              ]}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Creating Project...</span>
              </>
            ) : (
              <>
                <FolderPlus className="mr-2 h-4 w-4" />
                <span>Create Project</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

