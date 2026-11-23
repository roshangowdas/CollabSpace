import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  getUserWorkspaces,
  createWorkspace as apiCreateWorkspace,
  updateWorkspace as apiUpdateWorkspace,
  uploadWorkspaceLogo as apiUploadWorkspaceLogo,
  deleteWorkspace as apiDeleteWorkspace,
  getWorkspaceMembers as apiGetWorkspaceMembers,
  updateMemberRole as apiUpdateMemberRole,
  removeWorkspaceMember as apiRemoveWorkspaceMember,
  inviteMember as apiInviteMember,
} from '@/services/workspaces'

const WorkspaceContext = createContext(null)

const STORAGE_ACTIVE_WORKSPACE_KEY = 'collabspace_current_workspace_id'

export function WorkspaceProvider({ children }) {
  const { user, profile, isAuthenticated, isDemoUser } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [currentWorkspace, setCurrentWorkspace] = useState(null)
  const [members, setMembers] = useState([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  // Load workspaces for the authenticated user
  const loadWorkspaces = useCallback(
    async (preferredId = null) => {
      if (!isAuthenticated || !user) {
        setWorkspaces([])
        setCurrentWorkspace(null)
        setMembers([])
        setIsLoadingWorkspaces(false)
        return []
      }

      setIsLoadingWorkspaces(true)
      try {
        let list = await getUserWorkspaces(user.id)

        // For real authenticated users, purge any demo workspaces
        if (!isDemoUser && !user.id.startsWith('demo-')) {
          list = (list || []).filter((w) => w && !w.id.startsWith('demo-'))

          // If a real user has 0 workspaces, auto-provision a real personal workspace in Supabase
          if (list.length === 0) {
            try {
              const rawName =
                profile?.full_name ||
                user.user_metadata?.full_name ||
                user.email?.split('@')[0] ||
                'My'
              const defaultWsName = rawName.endsWith('s')
                ? `${rawName}' Workspace`
                : `${rawName}'s Workspace`
              const baseSlug = defaultWsName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
              const uniqueSlug = `${baseSlug}-${user.id.slice(0, 4)}`

              const created = await apiCreateWorkspace({
                name: defaultWsName,
                slug: uniqueSlug,
                description: 'Personal workspace for projects, tasks, and team collaboration.',
                userId: user.id,
              })

              if (created && created.id) {
                list = [created]
              }
            } catch (autoProvisionErr) {
              console.warn(
                '[CollabSpace WorkspaceContext] Auto-provisioning initial workspace notice:',
                autoProvisionErr.message
              )
            }
          }
        }

        setWorkspaces(list)

        // Determine which workspace to activate (ignore stale demo IDs for real users)
        const savedId = preferredId || localStorage.getItem(STORAGE_ACTIVE_WORKSPACE_KEY)
        let active = null
        if (savedId && (!savedId.startsWith('demo-') || isDemoUser)) {
          active = list.find((w) => w.id === savedId)
        }

        if (!active && list.length > 0) {
          active = list[0]
        }

        if (active) {
          setCurrentWorkspace(active)
          localStorage.setItem(STORAGE_ACTIVE_WORKSPACE_KEY, active.id)
        } else {
          setCurrentWorkspace(null)
          localStorage.removeItem(STORAGE_ACTIVE_WORKSPACE_KEY)
        }

        return list
      } catch (err) {
        console.error('[CollabSpace WorkspaceContext] Failed to load workspaces:', err)
        return []
      } finally {
        setIsLoadingWorkspaces(false)
      }
    },
    [isAuthenticated, user, isDemoUser, profile?.full_name]
  )

  // Load members for the current active workspace
  const loadMembers = useCallback(async (workspaceId) => {
    if (!workspaceId) {
      setMembers([])
      return []
    }

    setIsLoadingMembers(true)
    try {
      const memberList = await apiGetWorkspaceMembers(workspaceId)
      setMembers(memberList)
      return memberList
    } catch (err) {
      console.warn('[CollabSpace WorkspaceContext] Error loading members:', err.message)
      return []
    } finally {
      setIsLoadingMembers(false)
    }
  }, [])

  // Initial load when user authentication state changes
  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  // Load members whenever currentWorkspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadMembers(currentWorkspace.id)
    } else {
      setMembers([])
    }
  }, [currentWorkspace?.id, loadMembers])

  /**
   * Switch the active workspace
   */
  const switchWorkspace = (workspaceId) => {
    const target = workspaces.find((w) => w.id === workspaceId)
    if (!target) {
      toast.error('Workspace not found')
      return
    }

    setCurrentWorkspace(target)
    localStorage.setItem(STORAGE_ACTIVE_WORKSPACE_KEY, target.id)
    toast.success(`Switched to workspace "${target.name}"`)
  }

  /**
   * Create a new workspace and activate it
   */
  const createNewWorkspace = async ({ name, slug, description, logoUrl }) => {
    if (!user) throw new Error('You must be logged in to create a workspace.')

    const newWs = await apiCreateWorkspace({
      name,
      slug,
      description,
      logoUrl,
      userId: user.id,
    })

    setWorkspaces((prev) => [newWs, ...prev])
    setCurrentWorkspace(newWs)
    localStorage.setItem(STORAGE_ACTIVE_WORKSPACE_KEY, newWs.id)
    toast.success(`Workspace "${newWs.name}" created successfully!`)
    return newWs
  }

  /**
   * Update current workspace details (name, slug, description, logo)
   */
  const updateCurrentWorkspace = async (updates) => {
    if (!currentWorkspace?.id) throw new Error('No active workspace selected.')

    const updated = await apiUpdateWorkspace(currentWorkspace.id, updates)

    setCurrentWorkspace((prev) => ({ ...prev, ...updated }))
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === currentWorkspace.id ? { ...w, ...updated } : w))
    )
    toast.success('Workspace settings updated successfully!')
    return updated
  }

  /**
   * Upload logo for current workspace
   */
  const uploadCurrentWorkspaceLogo = async (file) => {
    if (!currentWorkspace?.id) throw new Error('No active workspace selected.')

    const result = await apiUploadWorkspaceLogo(currentWorkspace.id, file)
    setCurrentWorkspace((prev) => ({ ...prev, logo_url: result.publicUrl }))
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === currentWorkspace.id ? { ...w, logo_url: result.publicUrl } : w
      )
    )
    toast.success('Workspace logo updated successfully!')
    return result
  }

  /**
   * Delete current workspace permanently (Owner only)
   */
  const deleteCurrentWorkspace = async () => {
    if (!currentWorkspace?.id) throw new Error('No active workspace selected.')

    const deletedId = currentWorkspace.id
    const deletedName = currentWorkspace.name

    await apiDeleteWorkspace(deletedId)

    const remaining = workspaces.filter((w) => w.id !== deletedId)
    setWorkspaces(remaining)

    if (remaining.length > 0) {
      setCurrentWorkspace(remaining[0])
      localStorage.setItem(STORAGE_ACTIVE_WORKSPACE_KEY, remaining[0].id)
    } else {
      setCurrentWorkspace(null)
      localStorage.removeItem(STORAGE_ACTIVE_WORKSPACE_KEY)
    }

    toast.success(`Workspace "${deletedName}" has been deleted`)
  }

  /**
   * Invite a new member to the current workspace
   */
  const inviteMemberToWorkspace = async ({ email, role = 'Member' }) => {
    if (!currentWorkspace?.id || !user) {
      throw new Error('Active workspace and user required.')
    }

    const res = await apiInviteMember({
      workspaceId: currentWorkspace.id,
      email,
      role,
      invitedBy: user.id,
    })

    toast.success(`Invitation sent to ${email} as ${role}!`)
    await loadMembers(currentWorkspace.id)
    return res
  }

  /**
   * Update role for a member
   */
  const updateMemberRoleInWorkspace = async (memberUserId, newRole) => {
    if (!currentWorkspace?.id) throw new Error('No active workspace selected.')

    await apiUpdateMemberRole(currentWorkspace.id, memberUserId, newRole)

    setMembers((prev) =>
      prev.map((m) => (m.user_id === memberUserId ? { ...m, role: newRole } : m))
    )
    toast.success(`Member role updated to ${newRole}`)
  }

  /**
   * Remove member from workspace
   */
  const removeMemberFromWorkspace = async (memberUserId) => {
    if (!currentWorkspace?.id) throw new Error('No active workspace selected.')

    await apiRemoveWorkspaceMember(currentWorkspace.id, memberUserId)

    setMembers((prev) => prev.filter((m) => m.user_id !== memberUserId))
    toast.success('Member removed from workspace')
  }

  const isSuperAdminUser = user?.email?.toLowerCase() === '0243roshan@gmail.com'
  const role = isSuperAdminUser ? 'Owner' : (currentWorkspace?.role || 'Member')
  const isOwner = isSuperAdminUser || role === 'Owner'
  const isAdmin = isSuperAdminUser || role === 'Owner' || role === 'Admin'
  const canEditWorkspace = isOwner || isAdmin

  const value = {
    workspaces,
    currentWorkspace,
    members,
    role,
    isOwner,
    isAdmin,
    canEditWorkspace,
    isLoadingWorkspaces,
    isLoadingMembers,
    switchWorkspace,
    createWorkspace: createNewWorkspace,
    updateWorkspace: updateCurrentWorkspace,
    uploadLogo: uploadCurrentWorkspaceLogo,
    deleteWorkspace: deleteCurrentWorkspace,
    inviteMember: inviteMemberToWorkspace,
    updateMemberRole: updateMemberRoleInWorkspace,
    removeMember: removeMemberFromWorkspace,
    refreshWorkspaces: loadWorkspaces,
    refreshMembers: () => loadMembers(currentWorkspace?.id),
  }

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

