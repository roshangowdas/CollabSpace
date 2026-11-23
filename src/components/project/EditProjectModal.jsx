import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Save,
  Calendar,
  AlertCircle,
  Loader2,
  Lock,
  Globe,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { editProjectSchema } from '@/utils/validators'
import { updateProject } from '@/services/projects'

export function EditProjectModal({ isOpen, onClose, project, onProjectUpdated }) {
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editProjectSchema),
  })

  useEffect(() => {
    if (project && isOpen) {
      // Format ISO string to YYYY-MM-DD for date inputs
      const formatDateForInput = (isoDate) => {
        if (!isoDate) return ''
        try {
          return new Date(isoDate).toISOString().split('T')[0]
        } catch {
          return ''
        }
      }

      reset({
        name: project.name || '',
        description: project.description || '',
        startDate: formatDateForInput(project.start_date),
        dueDate: formatDateForInput(project.due_date),
        visibility: project.visibility || 'workspace',
        status: project.status || 'active',
      })
      setServerError(null)
    }
  }, [project, isOpen, reset])

  const handleClose = () => {
    setServerError(null)
    onClose()
  }

  const onSubmit = async (data) => {
    setServerError(null)
    try {
      const updated = await updateProject(project.id, {
        name: data.name,
        description: data.description,
        startDate: data.startDate || null,
        dueDate: data.dueDate || null,
        visibility: data.visibility,
        status: data.status,
      })

      onProjectUpdated({
        ...project,
        ...updated,
      })
      handleClose()
    } catch (err) {
      console.error('Project update error:', err)
      setServerError(err.message || 'Failed to update project. Please try again.')
    }
  }

  if (!project) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Project"
      description={`Update settings and timeline for [${project.key}] ${project.name}`}
      size="default"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{serverError}</p>
          </div>
        )}

        {/* Project Key and Identifier banner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Project Key:</span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
              {project.key}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Keys are fixed after creation</span>
        </div>

        {/* Project Name */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-proj-name">
            Project Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-proj-name"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-proj-description">Description</Label>
          <Textarea
            id="edit-proj-description"
            rows={3}
            {...register('description')}
            error={errors.description?.message}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-proj-start-date">Start Date</Label>
            <Input
              id="edit-proj-start-date"
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-proj-due-date">Due Date</Label>
            <Input
              id="edit-proj-due-date"
              type="date"
              {...register('dueDate')}
              error={errors.dueDate?.message}
            />
          </div>
        </div>

        {/* Visibility and Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-proj-visibility">Visibility</Label>
            <Select
              id="edit-proj-visibility"
              {...register('visibility')}
              error={errors.visibility?.message}
              options={[
                { value: 'workspace', label: 'Workspace (All members can view)' },
                { value: 'private', label: 'Private (Assigned members only)' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-proj-status">Status</Label>
            <Select
              id="edit-proj-status"
              {...register('status')}
              error={errors.status?.message}
              options={[
                { value: 'active', label: 'Active (In progress)' },
                { value: 'paused', label: 'Paused (On hold)' },
                { value: 'completed', label: 'Completed' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting}>
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
      </form>
    </Modal>
  )
}

