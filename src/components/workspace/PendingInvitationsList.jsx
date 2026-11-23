import React, { useState, useEffect } from 'react'
import {
  Mail,
  Clock,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Shield,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card } from '@/components/ui'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getPendingInvitations, revokeInvitation } from '@/services/invitations'

const ROLE_BADGE_VARIANTS = {
  Admin: 'brand',
  Developer: 'success',
  Designer: 'purple',
  Tester: 'warning',
  Member: 'secondary',
}

export function PendingInvitationsList({ onInviteCreated }) {
  const { currentWorkspace, isAdmin } = useWorkspace()
  const [invitations, setInvitations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)
  const [revokingId, setRevokingId] = useState(null)

  const loadInvitations = async () => {
    if (!currentWorkspace?.id) return
    setIsLoading(true)
    try {
      const data = await getPendingInvitations(currentWorkspace.id)
      setInvitations(data)
    } catch (err) {
      console.warn('Failed to load pending invitations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInvitations()
  }, [currentWorkspace?.id, onInviteCreated])

  const handleCopyLink = (inv) => {
    const inviteUrl = `${window.location.origin}/invite/${inv.token}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedId(inv.id)
    toast.success('Invitation link copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleRevoke = async (invitationId) => {
    setRevokingId(invitationId)
    try {
      await revokeInvitation(invitationId)
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
      toast.success('Invitation revoked successfully')
    } catch (err) {
      toast.error('Failed to revoke invitation', { description: err.message })
    } finally {
      setRevokingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin text-brand" />
        <span>Loading pending invitations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {invitations.length} pending invitation{invitations.length === 1 ? '' : 's'}
        </span>
        <Button
          variant="ghost"
          size="xs"
          leftIcon={RefreshCw}
          onClick={loadInvitations}
        >
          Refresh List
        </Button>
      </div>

      <div className="divide-y rounded-xl border bg-card shadow-subtle overflow-hidden">
        {invitations.length > 0 ? (
          invitations.map((inv) => {
            const isCopied = copiedId === inv.id
            const isRevoking = revokingId === inv.id
            const expiresDate = new Date(inv.expires_at)
            const daysLeft = Math.max(
              0,
              Math.ceil((expiresDate - new Date()) / (1000 * 60 * 60 * 24))
            )

            return (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4 flex-wrap sm:flex-nowrap"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border">
                    <Mail className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {inv.email}
                      </span>
                      <Badge
                        variant={ROLE_BADGE_VARIANTS[inv.role] || 'secondary'}
                        size="sm"
                        className="text-[10px] py-0"
                      >
                        {inv.role}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {daysLeft > 0 ? `Expires in ${daysLeft} days` : 'Expired'}
                      </span>
                      <span>•</span>
                      <span>Created {new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <Button
                    variant="outline"
                    size="xs"
                    leftIcon={isCopied ? Check : Copy}
                    onClick={() => handleCopyLink(inv)}
                  >
                    {isCopied ? 'Copied' : 'Copy Link'}
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      leftIcon={Trash2}
                      isLoading={isRevoking}
                      onClick={() => handleRevoke(inv.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center space-y-2">
            <Mail className="h-8 w-8 text-muted-foreground mx-auto" />
            <h4 className="text-xs font-semibold text-foreground">No pending invitations</h4>
            <p className="text-[11px] text-muted-foreground">
              When you invite team members, their pending invitations and links will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

