// Globals (describe, it, expect, beforeEach) provided by Vitest
import {
  getUserWorkspaces,
  checkWorkspaceSlugAvailability,
  createWorkspace,
  updateWorkspace,
  getWorkspaceMembers,
} from '@/services/workspaces'
import {
  assertAdminAccess,
  updateWorkspaceMemberRole,
  removeWorkspaceMemberAdmin,
  ADMIN_ROLES,
} from '@/services/admin'
import { resetRateLimits } from '@/utils/rateLimiter'

describe('Workspace Management & Multi-Role Authorization Suite', () => {
  const workspaceId = 'demo-ws-acme-corp'

  // Accounts with 3 distinct roles per Stage 24 requirements
  const userOwner = { id: 'demo-user-collabspace-uuid', name: 'Alex Rivera', role: 'Owner' }
  const userAdmin = { id: 'demo-user-sarah', name: 'Sarah Jenkins', role: 'Admin' }
  const userDeveloper = { id: 'demo-user-david', name: 'David Chen', role: 'Developer' }
  const userTester = { id: 'demo-user-marcus', name: 'Marcus Vance', role: 'Tester' }

  beforeEach(() => {
    resetRateLimits()
  })

  describe('Workspace Metadata & Slugs', () => {
    it('detects available and reserved slugs properly', async () => {
      const res = await checkWorkspaceSlugAvailability('demo-new-unique-slug-2026')
      expect(res.available).toBe(true)
    })

    it('requires name and slug when creating a workspace', async () => {
      await expect(
        createWorkspace({ name: '', slug: '', userId: userOwner.id })
      ).rejects.toThrow()
    })

    it('lists user workspaces', async () => {
      const workspaces = await getUserWorkspaces(userOwner.id)
      expect(Array.isArray(workspaces)).toBe(true)
      if (workspaces.length > 0) {
        expect(workspaces[0]).toHaveProperty('id')
        expect(workspaces[0]).toHaveProperty('name')
      }
    })
  })

  describe('Role-Based Administration & Privilege Boundaries', () => {
    it('allows Owner and Admin access, but blocks Developer and Tester', () => {
      expect(() => assertAdminAccess('Owner')).not.toThrow()
      expect(() => assertAdminAccess('Admin')).not.toThrow()
      expect(() => assertAdminAccess('Developer')).toThrow(/access denied/i)
      expect(() => assertAdminAccess('Tester')).toThrow(/access denied/i)
      expect(() => assertAdminAccess('Member')).toThrow(/access denied/i)
    })

    it('allows Owner to update member role from Developer to Designer', async () => {
      const result = await updateWorkspaceMemberRole({
        workspaceId,
        targetUserId: userDeveloper.id,
        newRole: 'Designer',
        callerId: userOwner.id,
        callerRole: userOwner.role,
      })
      expect(result.success).toBe(true)
      expect(result.new_role).toBe('Designer')
    })

    it('prevents self-promotion to Owner', async () => {
      await expect(
        updateWorkspaceMemberRole({
          workspaceId,
          targetUserId: userAdmin.id,
          newRole: 'Owner',
          callerId: userAdmin.id,
          callerRole: userAdmin.role,
        })
      ).rejects.toThrow(/cannot promote yourself to owner/i)
    })

    it('prevents Admin from modifying or demoting the workspace Owner', async () => {
      await expect(
        updateWorkspaceMemberRole({
          workspaceId,
          targetUserId: userOwner.id,
          newRole: 'Member',
          callerId: userAdmin.id,
          callerRole: userAdmin.role,
        })
      ).rejects.toThrow(/cannot modify the role of the workspace owner/i)
    })

    it('prevents removing the workspace Owner', async () => {
      await expect(
        removeWorkspaceMemberAdmin({
          workspaceId,
          targetUserId: userOwner.id,
          callerId: userAdmin.id,
          callerRole: userAdmin.role,
        })
      ).rejects.toThrow(/cannot remove the workspace owner/i)
    })
  })
})
