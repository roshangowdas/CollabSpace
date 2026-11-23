import React, { useState } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  MoreVertical,
  Trash2,
  Search,
  Check,
  ShieldAlert,
  Clock,
  Sparkles,
  Mail,
  Code,
  Palette,
  CheckSquare,
} from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAuth } from '@/hooks/useAuth'
import { InviteMemberModal } from './InviteMemberModal'
import { PendingInvitationsList } from './PendingInvitationsList'

const ROLE_BADGE_VARIANTS = {
  Owner: 'warning',
  Admin: 'brand',
  Developer: 'success',
  Designer: 'purple',
  Tester: 'warning',
  Member: 'secondary',
  Viewer: 'outline',
}

export function WorkspaceMembersList() {
  const { currentWorkspace, members, role: currentUserRole, isOwner, isAdmin, updateMemberRole, removeMember } = useWorkspace()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('active') // 'active' | 'pending'
  const [searchQuery, setSearchQuery] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase()
    return (
      (m.full_name || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      {/* Sub-tab Navigation (Active Members vs Pending Invitations) */}
      <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={activeTab === 'active' ? 'brand' : 'ghost'}
            size="xs"
            leftIcon={Users}
            onClick={() => setActiveTab('active')}
          >
            Active Members ({members.length})
          </Button>

          <Button
            type="button"
            variant={activeTab === 'pending' ? 'brand' : 'ghost'}
            size="xs"
            leftIcon={Mail}
            onClick={() => setActiveTab('pending')}
          >
            Pending Invitations
          </Button>
        </div>

        {isAdmin && (
          <Button
            variant="brand"
            size="xs"
            leftIcon={UserPlus}
            onClick={() => setIsInviteOpen(true)}
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* ACTIVE MEMBERS VIEW */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <Input
              placeholder="Search members by name, handle, role..."
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Members Roster List */}
          <div className="divide-y rounded-xl border bg-card shadow-subtle overflow-hidden">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const isSelf = member.user_id === user?.id
                const canManageThisMember =
                  (isOwner && !isSelf) ||
                  (isAdmin && !isSelf && member.role !== 'Owner' && member.role !== 'Admin')

                return (
                  <div
                    key={member.id || member.user_id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors gap-4 flex-wrap sm:flex-nowrap"
                  >
                    {/* Member Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={member.avatar_url}
                        name={member.full_name || 'Member'}
                        size="md"
                        className="ring-1 ring-border"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {member.full_name}
                          </span>
                          {isSelf && (
                            <Badge variant="outline" size="sm" className="text-[10px] py-0">
                              You
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground font-mono">
                            @{member.username || 'member'}
                          </span>
                        </div>
                        {member.email && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Role & Actions */}
                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <Badge
                        variant={ROLE_BADGE_VARIANTS[member.role] || 'secondary'}
                        size="sm"
                        className="font-medium capitalize"
                      >
                        {member.role}
                      </Badge>

                      {/* Joined Date */}
                      <span className="text-[11px] text-muted-foreground hidden md:inline-flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {new Date(member.joined_at || member.created_at || Date.now()).toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric', year: 'numeric' }
                        )}
                      </span>

                      {/* Manage Member Menu */}
                      {(canManageThisMember || (isSelf && !isOwner)) && (
                        <DropdownMenu
                          align="right"
                          trigger={
                            <button
                              type="button"
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                              aria-label="Member options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          }
                        >
                          <DropdownMenuLabel>Reassign Role</DropdownMenuLabel>
                          {canManageThisMember && (
                            <>
                              {isOwner && member.role !== 'Admin' && (
                                <DropdownMenuItem
                                  icon={Shield}
                                  onClick={() => updateMemberRole(member.user_id, 'Admin')}
                                >
                                  Admin
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'Developer' && (
                                <DropdownMenuItem
                                  icon={Code}
                                  onClick={() => updateMemberRole(member.user_id, 'Developer')}
                                >
                                  Developer
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'Designer' && (
                                <DropdownMenuItem
                                  icon={Palette}
                                  onClick={() => updateMemberRole(member.user_id, 'Designer')}
                                >
                                  Designer
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'Tester' && (
                                <DropdownMenuItem
                                  icon={CheckSquare}
                                  onClick={() => updateMemberRole(member.user_id, 'Tester')}
                                >
                                  Tester
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'Member' && (
                                <DropdownMenuItem
                                  icon={Users}
                                  onClick={() => updateMemberRole(member.user_id, 'Member')}
                                >
                                  Member
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                icon={Trash2}
                                destructive
                                onClick={() => removeMember(member.user_id)}
                              >
                                Remove from Workspace
                              </DropdownMenuItem>
                            </>
                          )}

                          {isSelf && !isOwner && (
                            <DropdownMenuItem
                              icon={Trash2}
                              destructive
                              onClick={() => removeMember(member.user_id)}
                            >
                              Leave Workspace
                            </DropdownMenuItem>
                          )}
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                <h4 className="text-xs font-semibold text-foreground">No members found</h4>
                <p className="text-[11px] text-muted-foreground">
                  Try adjusting your search query or invite new colleagues to this workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PENDING INVITATIONS VIEW */}
      {activeTab === 'pending' && (
        <PendingInvitationsList onInviteCreated={refreshTrigger} />
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInviteSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  )
}
