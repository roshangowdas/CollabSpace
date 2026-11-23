import React, { useState } from 'react'
import {
  Settings,
  Building2,
  Upload,
  AlertTriangle,
  Save,
  Trash2,
  ShieldAlert,
  UserPlus,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ADMIN_ROLES } from '@/services/admin'
import { useWorkspace } from '@/hooks/useWorkspace'
import { toast } from 'sonner'

export function AdminSettingsTab({ workspace, callerRole = 'Admin' }) {
  const { updateWorkspace, uploadLogo, deleteWorkspace } = useWorkspace()

  const [name, setName] = useState(workspace?.name || '')
  const [slug, setSlug] = useState(workspace?.slug || '')
  const [description, setDescription] = useState(workspace?.description || '')
  const [logoPreview, setLogoPreview] = useState(workspace?.logo_url || '')
  const [invitePolicy, setInvitePolicy] = useState(workspace?.invite_policy || 'admins_only')
  const [defaultRole, setDefaultRole] = useState(workspace?.default_role || 'Member')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const isOwner = callerRole === 'Owner'

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const res = await uploadLogo(file)
      setLogoPreview(res.publicUrl)
    } catch (err) {
      toast.error(err.message || 'Failed to upload workspace logo.')
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Workspace name cannot be empty.')
      return
    }

    setIsSaving(true)
    try {
      await updateWorkspace({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        invite_policy: invitePolicy,
        default_role: defaultRole,
      })
      toast.success('Workspace settings updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to update workspace settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!isOwner) {
      toast.error('Only the workspace Owner can delete this workspace.')
      return
    }

    if (deleteConfirmText !== workspace?.slug) {
      toast.error(`Please type "${workspace?.slug}" to confirm deletion.`)
      return
    }

    setIsDeleting(true)
    try {
      await deleteWorkspace()
      toast.success('Workspace deleted successfully.')
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err.message || 'Failed to delete workspace.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 1. General Profile & Branding */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Workspace Profile & Branding
          </CardTitle>
          <CardDescription>
            Update the public name, URL handle, and description of your workspace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Logo Upload */}
            <div className="flex items-center gap-4 pb-2">
              <div className="w-16 h-16 rounded-xl border border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Workspace logo preview" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground/50" />
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Workspace Logo
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-background hover:bg-muted transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Logo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Recommended: PNG, JPG, or SVG up to 5MB
                  </span>
                </div>
              </div>
            </div>

            {/* Workspace Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Workspace Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>

            {/* Workspace Slug */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Workspace URL Slug</label>
              <div className="flex items-center rounded-lg border border-border bg-muted/20 px-3 py-1.5 text-xs">
                <span className="text-muted-foreground font-mono mr-1">collabspace.app/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="bg-transparent flex-1 text-foreground font-mono focus:outline-none"
                  placeholder="acme-corp"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe this workspace for your team..."
                className="w-full text-xs bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* 2. Invitation & Access Settings */}
            <div className="pt-4 border-t border-border/60 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Invitation & Membership Policies
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Who can invite new members
                  </label>
                  <select
                    value={invitePolicy}
                    onChange={(e) => setInvitePolicy(e.target.value)}
                    className="w-full text-xs bg-background border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="admins_only">Workspace Owners and Admins Only</option>
                    <option value="all_members">All Workspace Members</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Default Role for New Invites
                  </label>
                  <select
                    value={defaultRole}
                    onChange={(e) => setDefaultRole(e.target.value)}
                    className="w-full text-xs bg-background border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {ADMIN_ROLES.filter((r) => r !== 'Owner').map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" size="sm" disabled={isSaving} className="gap-2">
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Danger Zone (Owner Only) */}
      <Card className="border-rose-500/40 bg-rose-50/5 dark:bg-rose-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-rose-500">
            <ShieldAlert className="w-4 h-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Destructive actions affecting the entire workspace and all stored data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-rose-500/20 bg-background/50">
            <div>
              <p className="text-xs font-semibold text-foreground">Delete this Workspace</p>
              <p className="text-[11px] text-muted-foreground">
                Permanently removes all members, projects, tasks, whiteboard drawings, and files. This cannot be undone.
              </p>
            </div>
            {isOwner ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Workspace
              </Button>
            ) : (
              <div className="text-[11px] text-muted-foreground italic shrink-0">
                Owner role required
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-rose-500/50 shadow-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
                Confirm Workspace Deletion
              </CardTitle>
              <CardDescription>
                This action is irreversible. All data in{' '}
                <strong className="text-foreground">{workspace?.name}</strong> will be permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Type <span className="font-mono font-bold text-foreground">{workspace?.slug}</span> to confirm:
                </label>
                <Input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={workspace?.slug}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteConfirmText !== workspace?.slug || isDeleting}
                  onClick={handleDeleteWorkspace}
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
