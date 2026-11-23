import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Settings,
  Users,
  AlertTriangle,
  Upload,
  Trash2,
  Save,
  Check,
  Globe,
  Camera,
  Layers,
  Shield,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { workspaceSchema } from '@/utils/validators'
import { useWorkspace } from '@/hooks/useWorkspace'
import { WorkspaceMembersList } from './WorkspaceMembersList'

export function WorkspaceSettingsModal({ isOpen, onClose }) {
  const {
    currentWorkspace,
    updateWorkspace,
    uploadLogo,
    deleteWorkspace,
    isOwner,
    isAdmin,
    role,
  } = useWorkspace()

  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmSlugInput, setConfirmSlugInput] = useState('')
  const fileInputRef = useRef(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: currentWorkspace?.name || '',
      slug: currentWorkspace?.slug || '',
      description: currentWorkspace?.description || '',
      logoUrl: currentWorkspace?.logo_url || '',
    },
  })

  // Synchronize when currentWorkspace changes
  useEffect(() => {
    if (isOpen && currentWorkspace) {
      reset({
        name: currentWorkspace.name || '',
        slug: currentWorkspace.slug || '',
        description: currentWorkspace.description || '',
        logoUrl: currentWorkspace.logo_url || '',
      })
      setConfirmSlugInput('')
    }
  }, [isOpen, currentWorkspace, reset])

  const onSaveGeneral = async (values) => {
    if (!isAdmin) {
      toast.error('Only workspace Owners and Admins can update settings.')
      return
    }

    setIsSaving(true)
    try {
      await updateWorkspace({
        name: values.name.trim(),
        slug: values.slug.trim().toLowerCase(),
        description: values.description?.trim() || '',
      })
      toast.success('Workspace details updated!')
    } catch (err) {
      toast.error('Update failed', { description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setIsUploadingLogo(true)
      try {
        await uploadLogo(file)
        toast.success('Workspace logo updated!')
      } catch (err) {
        toast.error('Failed to upload logo', { description: err.message })
      } finally {
        setIsUploadingLogo(false)
      }
    }
  }

  const handleDelete = async () => {
    if (!isOwner) {
      toast.error('Only the Workspace Owner can delete this workspace.')
      return
    }

    if (confirmSlugInput !== currentWorkspace?.slug) {
      toast.error(`Please type "${currentWorkspace?.slug}" to confirm deletion.`)
      return
    }

    setIsDeleting(true)
    try {
      await deleteWorkspace()
      onClose()
    } catch (err) {
      toast.error('Failed to delete workspace', { description: err.message })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Workspace Settings: ${currentWorkspace?.name || 'Workspace'}`}
      description="Configure workspace identity, team membership, and administrative rules."
      size="lg"
    >
      <div className="space-y-5 pt-1">
        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b pb-2">
          <Button
            type="button"
            variant={activeTab === 'general' ? 'brand' : 'ghost'}
            size="xs"
            leftIcon={Settings}
            onClick={() => setActiveTab('general')}
          >
            General
          </Button>

          <Button
            type="button"
            variant={activeTab === 'members' ? 'brand' : 'ghost'}
            size="xs"
            leftIcon={Users}
            onClick={() => setActiveTab('members')}
          >
            Members & Roles
          </Button>

          {isOwner && (
            <Button
              type="button"
              variant={activeTab === 'danger' ? 'destructive' : 'ghost'}
              size="xs"
              leftIcon={AlertTriangle}
              onClick={() => setActiveTab('danger')}
            >
              Danger Zone
            </Button>
          )}
        </div>

        {/* TAB 1: General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleSubmit(onSaveGeneral)} className="space-y-4">
            {/* Logo Row */}
            <div className="flex items-center gap-4 rounded-xl border p-4 bg-muted/30">
              <div className="relative group shrink-0">
                {currentWorkspace?.logo_url ? (
                  <img
                    src={currentWorkspace.logo_url}
                    alt={currentWorkspace.name}
                    className="h-16 w-16 rounded-xl object-cover border shadow-subtle ring-2 ring-background"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-subtle">
                    {currentWorkspace?.name?.slice(0, 2).toUpperCase() || 'WS'}
                  </div>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-medium"
                  >
                    Change
                  </button>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-xs font-semibold text-foreground">Workspace Logo</h4>
                <p className="text-[11px] text-muted-foreground">
                  Square PNG, JPG, WEBP, or SVG up to 5MB. Stored in Supabase Storage.
                </p>
                {isAdmin && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      leftIcon={Upload}
                      isLoading={isUploadingLogo}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload New Logo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-ws-name">Workspace Name</Label>
              <Input
                id="edit-ws-name"
                disabled={!isAdmin}
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-ws-slug">Workspace URL Slug</Label>
              <div className="flex rounded-md shadow-subtle border bg-card focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all">
                <span className="inline-flex items-center px-3 rounded-l-md border-r bg-muted text-muted-foreground text-xs font-mono select-none">
                  collabspace.app/
                </span>
                <input
                  id="edit-ws-slug"
                  type="text"
                  disabled={!isAdmin}
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
              <Label htmlFor="edit-ws-desc">Workspace Description</Label>
              <Textarea
                id="edit-ws-desc"
                rows={2}
                disabled={!isAdmin}
                placeholder="Team mission and focus..."
                error={errors.description?.message}
                {...register('description')}
              />
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2 border-t">
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  isLoading={isSaving}
                  leftIcon={Save}
                >
                  Save Workspace Changes
                </Button>
              </div>
            )}
          </form>
        )}

        {/* TAB 2: Members & Roles */}
        {activeTab === 'members' && (
          <div className="pt-1">
            <WorkspaceMembersList />
          </div>
        )}

        {/* TAB 3: Danger Zone */}
        {activeTab === 'danger' && isOwner && (
          <div className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs">
            <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Delete Workspace Permanently</span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              This action cannot be undone. It will permanently delete the workspace{' '}
              <strong className="text-foreground">"{currentWorkspace?.name}"</strong>, along with all associated projects, tasks, comments, messages, whiteboards, and documents.
            </p>

            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-delete-slug" className="text-destructive font-medium">
                Type the workspace slug <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">{currentWorkspace?.slug}</code> to confirm:
              </Label>
              <Input
                id="confirm-delete-slug"
                placeholder={currentWorkspace?.slug}
                className="font-mono text-xs border-destructive/40"
                value={confirmSlugInput}
                onChange={(e) => setConfirmSlugInput(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                leftIcon={Trash2}
                isLoading={isDeleting}
                disabled={confirmSlugInput !== currentWorkspace?.slug}
                onClick={handleDelete}
              >
                Permanently Delete Workspace
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

