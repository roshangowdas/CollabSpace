// ==============================================================================
// CollabSpace Page: DocumentsPage
// File: src/pages/DocumentsPage.jsx
// Description:
//   Documents management dashboard: browse, search, filter by project,
//   and create collaborative rich-text documents.
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FolderKanban,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { DocumentCard, CreateDocumentModal } from '@/components/document'
import {
  getWorkspaceDocuments,
  deleteDocument,
} from '@/services/documents'
import { getWorkspaceProjects } from '@/services/projects'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { toast } from 'sonner'

export function DocumentsPage() {
  const { user } = useAuth()
  const { currentWorkspace, role } = useWorkspace()

  const [documents, setDocuments] = useState([])
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

  // Load workspace documents
  const loadDocuments = useCallback(
    async (isRefresh = false) => {
      if (!workspaceId) {
        setDocuments([])
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }
      if (isRefresh) setIsRefreshing(true)
      else setIsLoading(true)

      try {
        const data = await getWorkspaceDocuments(workspaceId, {
          projectId: selectedProjectId,
          search: searchQuery,
        })
        setDocuments(data || [])
      } catch (err) {
        console.error('Failed to load documents:', err)
        toast.error('Failed to load documents')
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [workspaceId, selectedProjectId, searchQuery]
  )

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    try {
      await deleteDocument(docId, user?.id, role)
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success('Document deleted successfully')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error(err.message || 'Failed to delete document')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-brand" />
            Collaborative Documents
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time rich text specifications, meeting notes, and knowledge base with live cursor sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDocuments(true)}
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
            New Document
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documents by title or keywords..."
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

      {/* Document Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-xl border border-border p-4 space-y-3 bg-card">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchQuery ? 'No documents match your search' : 'No documents in this workspace yet'}
          description={
            searchQuery
              ? `No documents found matching "${searchQuery}". Try adjusting your keywords.`
              : 'Create specifications, user stories, RFCs, and meeting agendas with true live multi-user editing.'
          }
          actionLabel="Create Document"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={handleDeleteDocument}
              canDelete={doc.created_by === user?.id || ['Owner', 'Admin'].includes(role)}
            />
          ))}
        </div>
      )}

      {/* Create Document Modal */}
      <CreateDocumentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        onDocumentCreated={(newDoc) => setDocuments((prev) => [newDoc, ...prev])}
      />
    </div>
  )
}
