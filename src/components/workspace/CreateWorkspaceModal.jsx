import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Layers,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  Upload,
  Globe,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { workspaceSchema } from '@/utils/validators'
import { useWorkspace } from '@/hooks/useWorkspace'
import { checkWorkspaceSlugAvailability } from '@/services/workspaces'

export function CreateWorkspaceModal({ isOpen, onClose }) {
  const { createWorkspace } = useWorkspace()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true, message: '' })
  const [logoPreview, setLogoPreview] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      logoUrl: '',
    },
  })

  const watchedName = watch('name', '')
  const watchedSlug = watch('slug', '')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({ name: '', slug: '', description: '', logoUrl: '' })
      setSlugStatus({ checking: false, available: true, message: '' })
      setLogoPreview('')
    }
  }, [isOpen, reset])

  // Automatically suggest clean slug when name changes (unless slug was manually edited)
  const handleNameChange = (e) => {
    const val = e.target.value
    setValue('name', val)
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setValue('slug', generatedSlug)
  }

  // Live debounced slug check
  useEffect(() => {
    if (!watchedSlug || watchedSlug.trim() === '') {
      setSlugStatus({ checking: false, available: false, message: 'Slug is required' })
      return
    }

    const clean = watchedSlug.trim().toLowerCase()
    if (clean.length < 2 || clean.length > 60 || !/^[a-z0-9-]+$/.test(clean)) {
      setSlugStatus({
        checking: false,
        available: false,
        message: 'Must be 2-60 lowercase alphanumeric chars or hyphens',
      })
      return
    }

    let isMounted = true
    setSlugStatus({ checking: true, available: false, message: 'Checking URL availability...' })

    const timeout = setTimeout(async () => {
      try {
        const res = await checkWorkspaceSlugAvailability(clean)
        if (!isMounted) return
        if (res.available) {
          setSlugStatus({ checking: false, available: true, message: 'URL available' })
          clearErrors('slug')
        } else {
          setSlugStatus({ checking: false, available: false, message: res.reason })
          setError('slug', { type: 'manual', message: res.reason })
        }
      } catch (err) {
        if (!isMounted) return
        setSlugStatus({ checking: false, available: true, message: '' })
      }
    }, 350)

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [watchedSlug, clearErrors, setError])

  const onSubmit = async (values) => {
    if (!slugStatus.available) {
      toast.error('Please choose a valid and available workspace URL')
      return
    }

    setIsSubmitting(true)
    try {
      await createWorkspace({
        name: values.name.trim(),
        slug: values.slug.trim().toLowerCase(),
        description: values.description?.trim() || '',
        logoUrl: logoPreview || values.logoUrl?.trim() || '',
      })
      onClose()
    } catch (err) {
      toast.error('Failed to create workspace', {
        description: err.message || 'Please check your inputs and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Workspace"
      description="Workspaces are shared hubs where teams manage projects, tasks, chat, and documents."
      size="default"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {/* Workspace Name */}
        <div className="space-y-1.5">
          <Label htmlFor="ws-name">Workspace Name</Label>
          <Input
            id="ws-name"
            placeholder="e.g. Acme Engineering or Design Lab"
            error={errors.name?.message}
            {...register('name', { onChange: handleNameChange })}
          />
        </div>

        {/* URL Slug with Live Availability Check */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="ws-slug">Workspace URL Slug</Label>
            {slugStatus.checking ? (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-brand" />
                Checking...
              </span>
            ) : slugStatus.available && watchedSlug ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="h-3 w-3" />
                Available
              </span>
            ) : slugStatus.message ? (
              <span className="flex items-center gap-1 text-[11px] text-destructive">
                <AlertCircle className="h-3 w-3" />
                {slugStatus.message}
              </span>
            ) : null}
          </div>

          <div className="flex rounded-md shadow-subtle border bg-card focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all">
            <span className="inline-flex items-center px-3 rounded-l-md border-r bg-muted text-muted-foreground text-xs font-mono select-none">
              collabspace.app/
            </span>
            <input
              id="ws-slug"
              type="text"
              placeholder="acme-engineering"
              className="flex-1 min-w-0 block w-full px-3 py-2 text-xs font-mono bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              {...register('slug')}
            />
          </div>
          {errors.slug && (
            <p className="text-xs text-destructive mt-1">{errors.slug.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="ws-desc">Description (Optional)</Label>
          <Textarea
            id="ws-desc"
            rows={2}
            placeholder="What does this workspace team focus on?"
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        {/* Automatic Ownership Notice */}
        <div className="rounded-lg bg-muted/40 p-3 border text-xs text-muted-foreground flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-brand shrink-0" />
          <span>
            You will automatically become the <strong className="text-foreground">Owner</strong> of this workspace with full administrative and billing permissions.
          </span>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="sm"
            isLoading={isSubmitting}
            disabled={slugStatus.checking || (!slugStatus.available && watchedSlug.length > 0)}
            leftIcon={Plus}
          >
            Create Workspace
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

