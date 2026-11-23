// ==============================================================================
// CollabSpace Page: WhiteboardsPage
// File: src/pages/WhiteboardsPage.jsx
// Description:
//   Whiteboard management catalog: browse, search, filter by project,
//   and create collaborative brainstorming canvases.
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FolderKanban,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { WhiteboardCard, CreateWhiteboardModal } from '@/components/whiteboard'
import {
  getWorkspaceWhiteboards,
  deleteWhiteboard,
} from '@/services/whiteboards'
import { getWorkspaceProjects } from '@/services/projects'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { toast } from 'sonner'

export function WhiteboardsPage() {
  const { user } = useAuth()
  const { currentWorkspace, role } = useWorkspace()

  const [whiteboards, setWhiteboards] = useState([])
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const workspaceId = currentWorkspace?.id || null

  // Load projects for workspace filter
  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getWorkspaceProjects(workspaceId)
        setProjects(data || [])
      } catch (err) {
        console.error('Failed to load projects:', err)
      }
    }
    if (workspaceId) loadProjects()
    else setProjects([])
  }, [workspaceId])

  // Load workspace whiteboards
  const loadWhiteboards = useCallback(
    async (isRefresh = false) => {
      if (!workspaceId) {
        setWhiteboards([])
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }
      if (isRefresh) setIsRefreshing(true)
      else setIsLoading(true)

      try {
        const data = await getWorkspaceWhiteboards(workspaceId, {
          projectId: selectedProjectId,
          search: searchQuery,
        })
        setWhiteboards(data || [])
      } catch (err) {
        console.error('Failed to load whiteboards:', err)
        toast.error('Failed to load whiteboards')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [workspaceId, selectedProjectId, searchQuery]
  )

  useEffect(() => {
    loadWhiteboards()
  }, [loadWhiteboards])

  const handleDeleteWhiteboard = async (boardId) => {
    if (!window.confirm('Are you sure you want to delete this whiteboard?')) return
    try {
      await deleteWhiteboard(boardId, user?.id, role)
      setWhiteboards((prev) => prev.filter((b) => b.id !== boardId))
      toast.success('Whiteboard deleted successfully')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error(err.message || 'Failed to delete whiteboard')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-brand" />
            Brainstorming Whiteboards
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Infinite shared canvas for wireframing, architecture diagrams, sticky note brainstorming, and user journey flows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadWhiteboards(true)}
            disabled={isRefreshing || isLoading}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="brand"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Whiteboard
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search whiteboards by name or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-9 text-xs"
          />
        </div>

        <Select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="h-9 text-xs min-w-[170px]"
          options={[
            { value: 'all', label: 'All Projects' },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
      </div>

      {/* Whiteboard Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <Skeleton className="h-28 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : whiteboards.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={searchQuery ? 'No whiteboards match your search' : 'No whiteboards created yet'}
          description={
            searchQuery
              ? `No whiteboards found matching "${searchQuery}". Try adjusting your keywords.`
              : 'Collaborate visually with sticky notes, flowcharts, connectors, and live multi-user cursors.'
          }
          actionLabel="Create Whiteboard"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {whiteboards.map((wb) => (
            <WhiteboardCard
              key={wb.id}
              whiteboard={wb}
              onDelete={handleDeleteWhiteboard}
              canDelete={wb.created_by === user?.id || ['Owner', 'Admin'].includes(role)}
            />
          ))}
        </div>
      )}

      {/* Create Whiteboard Modal */}
      <CreateWhiteboardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        onWhiteboardCreated={(newWb) => setWhiteboards((prev) => [newWb, ...prev])}
      />
    </div>
  )
}
