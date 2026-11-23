import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AdminLayout,
  AdminOverviewTab,
  AdminMembersTab,
  AdminProjectsTab,
  AdminTasksTab,
  AdminActivityTab,
  AdminSettingsTab,
  AdminLoginGate,
  SUPER_ADMIN_EMAIL,
} from '@/components/admin'
import { InviteMemberModal } from '@/components/workspace/InviteMemberModal'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useAuth } from '@/hooks/useAuth'
import {
  getWorkspaceAdminOverview,
  getAdminWorkspaceMembers,
  getAdminWorkspaceProjects,
  getAdminWorkspaceActivities,
} from '@/services/admin'
import { getWorkspaceTasks } from '@/services/tasks'
import { Loader2 } from 'lucide-react'

export function WorkspaceAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'overview'

  const { user } = useAuth()
  const { currentWorkspace, role, isAdmin, isOwner } = useWorkspace()
  const workspaceId = currentWorkspace?.id || null

  const [activeTab, setActiveTab] = useState(initialTab)
  const [overview, setOverview] = useState(null)
  const [members, setMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  // Sync active tab with URL query parameter
  const handleSelectTab = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  // Load all workspace administration data in parallel from real Supabase tables
  const loadAdminData = useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const caller = { id: user?.id, role: role || 'Owner' }

    try {
      const [ovData, memData, projData, taskData, actData] = await Promise.all([
        getWorkspaceAdminOverview(workspaceId, caller).catch((err) => {
          console.warn('Overview load warning:', err.message)
          return {}
        }),
        getAdminWorkspaceMembers(workspaceId, caller).catch((err) => {
          console.warn('Members load warning:', err.message)
          return []
        }),
        getAdminWorkspaceProjects(workspaceId, caller).catch((err) => {
          console.warn('Projects load warning:', err.message)
          return []
        }),
        getWorkspaceTasks(workspaceId).catch((err) => {
          console.warn('Tasks load warning:', err.message)
          return []
        }),
        getAdminWorkspaceActivities(workspaceId, caller).catch((err) => {
          console.warn('Activities load warning:', err.message)
          return []
        }),
      ])

      setOverview(ovData || {})
      setMembers(memData || [])
      setProjects(projData || [])
      setTasks(taskData || [])
      setActivities(actData || [])
    } catch (err) {
      console.error('Failed to load workspace administration data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, role, user?.id])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()

  // Admin Access Control: Strictly restricted to single Super Administrator
  if (!user || !isSuperAdmin || isLocked) {
    return (
      <AdminLoginGate
        onUnlock={() => {
          setIsLocked(false)
          loadAdminData()
        }}
      />
    )
  }

  // Counts for sidebar badges
  const sidebarCounts = {
    members: members.length,
    projects: projects.length,
    tasks: tasks.length,
    activity: activities.length,
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      workspace={currentWorkspace}
      callerRole={role || 'Owner'}
      userEmail={user?.email || SUPER_ADMIN_EMAIL}
      counts={sidebarCounts}
      onLock={() => setIsLocked(true)}
    >
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-semibold text-foreground">Loading workspace records...</p>
          <p className="text-xs text-muted-foreground mt-0.5">Fetching PostgreSQL statistics</p>
        </div>
      ) : (
        <>
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <AdminOverviewTab
              overview={overview || {}}
              projects={projects}
              tasks={tasks}
              activities={activities}
              onNavigateTab={handleSelectTab}
            />
          )}

          {/* Tab 2: Members */}
          {activeTab === 'members' && (
            <AdminMembersTab
              workspaceId={workspaceId}
              members={members}
              callerId={user?.id}
              callerRole={role || 'Owner'}
              onMemberUpdated={loadAdminData}
              onOpenInvite={() => setIsInviteModalOpen(true)}
            />
          )}

          {/* Tab 3: Projects */}
          {activeTab === 'projects' && (
            <AdminProjectsTab
              workspaceId={workspaceId}
              projects={projects}
              callerId={user?.id}
              callerRole={role || 'Owner'}
              onProjectUpdated={loadAdminData}
            />
          )}

          {/* Tab 4: Tasks */}
          {activeTab === 'tasks' && (
            <AdminTasksTab
              workspaceId={workspaceId}
              tasks={tasks}
              projects={projects}
              members={members}
              onTaskUpdated={loadAdminData}
            />
          )}

          {/* Tab 5: Activity */}
          {activeTab === 'activity' && (
            <AdminActivityTab activities={activities} />
          )}

          {/* Tab 6: Settings */}
          {activeTab === 'settings' && (
            <AdminSettingsTab
              workspace={currentWorkspace}
              callerRole={role || 'Owner'}
            />
          )}
        </>
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onInviteSuccess={() => {
            setIsInviteModalOpen(false)
            loadAdminData()
          }}
        />
      )}
    </AdminLayout>
  )
}

export default WorkspaceAdminPage
