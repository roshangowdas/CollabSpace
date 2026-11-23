import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import {
  getProjectMembers,
  assignProjectMember,
  removeProjectMember,
} from '@/services/projects'
import { getWorkspaceMembers } from '@/services/workspaces'
import { useAuth } from '@/hooks/useAuth'

export function ProjectMembersModal({
  isOpen,
  onClose,
  project,
  canModify = false,
  onMembersUpdated,
}) {
  const { user } = useAuth()
  const [projectMembers, setProjectMembers] = useState([])
  const [workspaceMembers, setWorkspaceMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('Contributor')
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Load members whenever modal opens
  useEffect(() => {
    async function loadData() {
      if (!project?.id || !isOpen) return
      setIsLoading(true)
      setError(null)
      try {
        const [projMembers, wsMembers] = await Promise.all([
          getProjectMembers(project.id),
          getWorkspaceMembers(project.workspace_id),
        ])
        setProjectMembers(projMembers || [])
        setWorkspaceMembers(wsMembers || [])
      } catch (err) {
        console.error('Failed to load project members:', err)
        setError('Failed to load member list. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [project?.id, project?.workspace_id, isOpen])

  // Filter out workspace members who are already assigned to this project
  const availableWorkspaceMembers = workspaceMembers.filter(
    (wm) => !projectMembers.some((pm) => pm.user_id === wm.user_id || pm.user_id === wm.id)
  )

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!selectedUserId) {
      setError('Please select a team member to assign.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const newMember = await assignProjectMember(project.id, selectedUserId, selectedRole)
      const updatedList = await getProjectMembers(project.id)
      setProjectMembers(updatedList)
      setSelectedUserId('')
      setSelectedRole('Contributor')
      setSuccessMsg('Member added successfully.')

      if (onMembersUpdated) {
        onMembersUpdated(updatedList)
      }

      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      console.error('Failed to add project member:', err)
      setError(err.message || 'Failed to add member to project.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRoleChange = async (targetUserId, newRole) => {
    setError(null)
    try {
      await assignProjectMember(project.id, targetUserId, newRole)
      const updatedList = await getProjectMembers(project.id)
      setProjectMembers(updatedList)
      if (onMembersUpdated) {
        onMembersUpdated(updatedList)
      }
    } catch (err) {
      console.error('Failed to change member role:', err)
      setError(err.message || 'Failed to update member role.')
    }
  }

  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) {
      return
    }

    setError(null)
    try {
      await removeProjectMember(project.id, targetUserId)
      const updatedList = projectMembers.filter((m) => m.user_id !== targetUserId)
      setProjectMembers(updatedList)
      if (onMembersUpdated) {
        onMembersUpdated(updatedList)
      }
    } catch (err) {
      console.error('Failed to remove member:', err)
      setError(err.message || 'Failed to remove member.')
    }
  }

  if (!project) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Team & Members"
      description={`Manage member access and roles for [${project.key}] ${project.name}`}
      size="lg"
    >
      <div className="space-y-6 pt-2">
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section: Add new member from workspace */}
        {canModify && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-brand" />
              <span>Assign Workspace Member</span>
            </h4>

            {availableWorkspaceMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                All workspace members are currently assigned to this project.
              </p>
            ) : (
              <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Select Member</label>
                  <Select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    placeholder="Choose member..."
                    options={availableWorkspaceMembers.map((wm) => ({
                      value: wm.user_id || wm.id,
                      label: `${wm.full_name || wm.email} (${wm.role || 'Member'})`,
                    }))}
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Project Role</label>
                  <Select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    options={[
                      { value: 'Contributor', label: 'Contributor' },
                      { value: 'Lead', label: 'Lead' },
                      { value: 'Viewer', label: 'Viewer' },
                    ]}
                  />
                </div>

                <div className="sm:col-span-3">
                  <Button
                    type="submit"
                    variant="brand"
                    size="default"
                    className="w-full"
                    disabled={isSubmitting || !selectedUserId}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        <span>Add</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Section: Current Project Members */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Assigned Members ({projectMembers.length})</span>
            </h4>
            <span className="text-[11px] text-muted-foreground">
              {project.visibility === 'private'
                ? 'Only these members can access this private project'
                : 'Workspace members can view; assigned members contribute'}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
              <span>Loading team members...</span>
            </div>
          ) : projectMembers.length === 0 ? (
            <div className="p-6 text-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No members assigned yet.
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
              {projectMembers.map((member) => {
                const profile = member.profile || {}
                const isCurrentUser = member.user_id === user?.id
                const isLead = member.role === 'Lead'

                return (
                  <div
                    key={member.id || member.user_id}
                    className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={profile.avatar_url}
                        name={profile.full_name || profile.username || 'Member'}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {profile.full_name || profile.username || 'Member'}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="secondary" size="xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{profile.username || 'user'} {profile.email ? `• ${profile.email}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {canModify ? (
                        <div className="w-28">
                          <Select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                            options={[
                              { value: 'Lead', label: 'Lead' },
                              { value: 'Contributor', label: 'Contributor' },
                              { value: 'Viewer', label: 'Viewer' },
                            ]}
                          />
                        </div>
                      ) : (
                        <Badge
                          variant={isLead ? 'brand' : 'secondary'}
                          size="sm"
                        >
                          {member.role}
                        </Badge>
                      )}

                      {canModify && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.user_id)}
                          title="Remove member from project"
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ml-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

