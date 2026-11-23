import React, { useState } from 'react'
import {
  Mail,
  Copy,
  Check,
  Trash2,
  Calendar,
  Clock,
  UserPlus,
  ExternalLink,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ROLE_CONFIG, revokeAdminInvitation } from '@/services/admin'
import { toast } from 'sonner'

export function AdminInvitationsTab({
  workspaceId,
  invitations = [],
  callerRole = 'Admin',
  onInviteRevoked,
  onOpenInvite,
}) {
  const [copiedId, setCopiedId] = useState(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const handleCopyLink = (inv) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://collabspace.app'
    const link = `${origin}/invite/${inv.token}`
    navigator.clipboard.writeText(link)
    setCopiedId(inv.id)
    toast.success('Invitation link copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleRevoke = async (inv) => {
    setIsRevoking(true)
    try {
      await revokeAdminInvitation(inv.id, workspaceId, { role: callerRole })
      toast.success(`Invitation to ${inv.email} has been revoked.`)
      if (onInviteRevoked) onInviteRevoked()
    } catch (err) {
      toast.error(err.message || 'Failed to revoke invitation.')
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Pending Workspace Invitations
          </h2>
          <p className="text-xs text-muted-foreground">
            Invitations expire automatically after 7 days unless revoked.
          </p>
        </div>

        <Button size="sm" onClick={onOpenInvite} className="gap-2 shrink-0">
          <UserPlus className="w-4 h-4" />
          Send New Invitation
        </Button>
      </div>

      <Card className="border-border/60 overflow-hidden">
        {invitations.length === 0 ? (
          <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-semibold text-foreground">No Pending Invitations</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
              All sent invitations have been accepted or expired.
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Recipient Email</th>
                  <th className="py-3 px-4">Role Assigned</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4">Status / Expires</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {invitations.map((inv) => {
                  const roleMeta = ROLE_CONFIG[inv.role] || ROLE_CONFIG.Member
                  const isCopied = copiedId === inv.id

                  return (
                    <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {inv.email}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`text-[11px] font-medium border ${roleMeta.badgeClass}`}>
                          {inv.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {inv.created_at
                          ? new Date(inv.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          <Clock className="w-3 h-3" />
                          Pending (7 days)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(inv)}
                          className="h-8 px-2 text-xs gap-1"
                          title="Copy invitation link"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy Link'}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isRevoking}
                          onClick={() => handleRevoke(inv)}
                          className="h-8 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          title="Revoke invitation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
