import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  UserPlus,
  Mail,
  Shield,
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
  Palette,
  CheckSquare,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { inviteMemberSchema } from '@/utils/validators'
import { useWorkspace } from '@/hooks/useWorkspace'
import { inviteWorkspaceMember, INVITATION_ROLES } from '@/services/invitations'

export function InviteMemberModal({ isOpen, onClose, onInviteSuccess }) {
  const { currentWorkspace } = useWorkspace()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdInvite, setCreatedInvite] = useState(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: 'Member',
    },
  })

  const onSubmit = async (values) => {
    if (!currentWorkspace?.id) return
    setIsSubmitting(true)
    try {
      const res = await inviteWorkspaceMember({
        workspaceId: currentWorkspace.id,
        email: values.email.trim().toLowerCase(),
        role: values.role,
      })

      setCreatedInvite(res)
      toast.success(`Invitation created for ${values.email} as ${values.role}!`)
      if (onInviteSuccess) onInviteSuccess(res)
    } catch (err) {
      toast.error('Failed to issue invitation', {
        description: err.message || 'Please check the email and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLink = () => {
    if (createdInvite?.inviteUrl) {
      navigator.clipboard.writeText(createdInvite.inviteUrl)
      setCopied(true)
      toast.success('Invitation link copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleClose = () => {
    reset()
    setCreatedInvite(null)
    setCopied(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdInvite ? 'Invitation Created' : 'Invite Team Member'}
      description={
        createdInvite
          ? `Share this secure link with your colleague to join "${currentWorkspace?.name}".`
          : `Invite a new collaborator to join "${currentWorkspace?.name || 'Workspace'}".`
      }
      size="default"
    >
      {!createdInvite ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Colleague Work Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              leftIcon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Workspace Role</Label>
            <Select
              id="invite-role"
              options={INVITATION_ROLES}
              error={errors.role?.message}
              {...register('role')}
            />
          </div>

          {/* Role Explanations */}
          <div className="rounded-lg bg-muted/40 p-3 border text-xs text-muted-foreground space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-brand" />
              <span>Role Permissions Matrix</span>
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside">
              <li><strong className="text-foreground">Admin:</strong> Manage workspace settings, invite members & moderate.</li>
              <li><strong className="text-foreground">Developer:</strong> Code tasks, pull request reviews & API specs.</li>
              <li><strong className="text-foreground">Designer:</strong> Collaborative whiteboards, UI specs & assets.</li>
              <li><strong className="text-foreground">Tester:</strong> QA validation, defect triage & acceptance tests.</li>
              <li><strong className="text-foreground">Member:</strong> General channel communication & project tasks.</li>
            </ul>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium pt-1 border-t">
              * Note: The Owner role cannot be assigned through member invitations.
            </p>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={UserPlus}
            >
              Generate & Send Invitation
            </Button>
          </ModalFooter>
        </form>
      ) : (
        <div className="space-y-4 pt-2">
          {/* Success Banner */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Invitation Link Ready!</span>
            </div>
            <p className="text-[11px]">
              A cryptographically secure token has been registered in Supabase. The invitation will automatically expire in 7 days.
            </p>
          </div>

          {/* Copy Link Input */}
          <div className="space-y-1.5">
            <Label htmlFor="generated-invite-url">Invitation Link</Label>
            <div className="flex rounded-md shadow-subtle border bg-card">
              <input
                id="generated-invite-url"
                type="text"
                readOnly
                value={createdInvite.inviteUrl}
                className="flex-1 min-w-0 block w-full px-3 py-2 text-xs font-mono bg-transparent text-foreground focus:outline-none select-all"
              />
              <Button
                type="button"
                variant="brand"
                size="sm"
                className="rounded-l-none"
                leftIcon={copied ? Check : Copy}
                onClick={handleCopyLink}
              >
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={handleClose}
            >
              Done
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  )
}
