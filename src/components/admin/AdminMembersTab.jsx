import React, { useState } from 'react'
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Trash2,
  Shield,
  MoreVertical,
  Check,
  AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  ADMIN_ROLES,
  ROLE_CONFIG,
  updateWorkspaceMemberRole,
  removeWorkspaceMemberAdmin,
} from '@/services/admin'
import { toast } from 'sonner'

export function AdminMembersTab({
  workspaceId,
  members = [],
  callerId,
  callerRole = 'Admin',
  onMemberUpdated,
  onOpenInvite,
}) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isUpdating, setIsUpdating] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)

  const isCallerOwner = callerRole === 'Owner'
  const isCallerAdmin = callerRole === 'Admin'

  // Filter members
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      m.full_name?.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)

    const matchesRole = roleFilter === 'all' || m.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Handle Role Change
  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return

    // Pre-validation checks
    if (targetUser.role === 'Owner') {
      toast.error('The workspace Owner role cannot be changed directly.')
      return
    }

    if (newRole === 'Owner' && !isCallerOwner) {
      toast.error('Only the workspace Owner can transfer ownership.')
      return
    }

    if (targetUser.user_id === callerId && newRole === 'Owner' && !isCallerOwner) {
      toast.error('You cannot promote yourself to Owner.')
      return
    }

    if (isCallerAdmin && targetUser.role === 'Admin') {
      toast.error('Admins cannot modify the role of another Admin.')
      return
    }

    setIsUpdating(true)
    try {
      await updateWorkspaceMemberRole({
        workspaceId,
        targetUserId: targetUser.user_id,
        newRole,
        callerId,
        callerRole,
      })
      toast.success(`Updated role for ${targetUser.full_name} to ${newRole}`)
      if (onMemberUpdated) onMemberUpdated()
    } catch (err) {
      toast.error(err.message || 'Failed to update member role.')
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle Remove Member
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return

    if (memberToRemove.role === 'Owner') {
      toast.error('Cannot remove the workspace Owner.')
      setMemberToRemove(null)
      return
    }

    setIsUpdating(true)
    try {
      await removeWorkspaceMemberAdmin({
        workspaceId,
        targetUserId: memberToRemove.user_id,
        callerId,
        callerRole,
      })
      toast.success(`Removed ${memberToRemove.full_name} from the workspace.`)
      setMemberToRemove(null)
      if (onMemberUpdated) onMemberUpdated()
    } catch (err) {
      toast.error(err.message || 'Failed to remove member.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search members by name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-background border border-border rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-background border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Roles</option>
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <Button size="sm" onClick={onOpenInvite} className="gap-2 shrink-0">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Members Table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Change Role</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No members match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const roleMeta = ROLE_CONFIG[member.role] || ROLE_CONFIG.Member
                  const isTargetOwner = member.role === 'Owner'
                  const isSelf = member.user_id === callerId
                  const isTargetAdmin = member.role === 'Admin'

                  // Permissions checks:
                  // - Can change role: Owner can change any non-owner; Admin can change non-owners and non-admins
                  const canChangeRole =
                    !isTargetOwner &&
                    (isCallerOwner || (isCallerAdmin && !isTargetAdmin))

                  // - Can remove: Owner can remove any non-owner; Admin can remove non-owners and non-admins
                  const canRemove =
                    !isTargetOwner &&
                    (isCallerOwner || (isCallerAdmin && !isTargetAdmin && !isSelf))

                  return (
                    <tr
                      key={member.user_id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={member.avatar_url}
                            name={member.full_name}
                            className="w-8 h-8 text-xs border border-border shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                              {member.full_name}
                              {isSelf && (
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {member.email || `@${member.username}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Current Role Badge */}
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[11px] font-medium border ${roleMeta.badgeClass}`}
                        >
                          {member.role}
                        </Badge>
                      </td>

                      {/* Change Role Selector */}
                      <td className="py-3 px-4">
                        {canChangeRole ? (
                          <select
                            value={member.role}
                            disabled={isUpdating}
                            onChange={(e) => handleRoleChange(member, e.target.value)}
                            className="text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {ADMIN_ROLES.map((r) => {
                              // If caller is not owner, they cannot select 'Owner'
                              if (r === 'Owner' && !isCallerOwner) return null
                              return (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              )
                            })}
                          </select>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            {isTargetOwner ? 'Workspace Owner' : 'Protected'}
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Active'}
                      </td>

                      {/* Remove Button */}
                      <td className="py-3 px-4 text-right">
                        {canRemove ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => setMemberToRemove(member)}
                            className="h-8 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            title="Remove member from workspace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <span
                            className="text-[11px] text-muted-foreground/60 select-none"
                            title={isTargetOwner ? 'Cannot remove the workspace owner' : 'Cannot remove this member'}
                          >
                            {isTargetOwner ? 'Protected' : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Remove Confirmation Dialog */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-border/80 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-rose-500">
                <AlertCircle className="w-5 h-5" />
                Remove Workspace Member
              </CardTitle>
              <CardDescription>
                Are you sure you want to remove{' '}
                <strong className="text-foreground">{memberToRemove.full_name}</strong> from this workspace?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                They will immediately lose access to all projects, documents, tasks, and private files in this workspace.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMemberToRemove(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmRemove}
                  disabled={isUpdating}
                >
                  Confirm Removal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
