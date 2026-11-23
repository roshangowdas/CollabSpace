// ==============================================================================
// CollabSpace Page: DocumentEditorPage
// File: src/pages/DocumentEditorPage.jsx
// Description:
//   Collaborative rich-text document editing workspace with live Tiptap editor,
//   Yjs synchronization, collaborator cursors, and Supabase persistence.
// ==============================================================================

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  FolderKanban,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DocumentEditor } from '@/components/document'
import {
  getDocumentById,
  updateDocument,
  deleteDocument,
} from '@/services/documents'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { toast } from 'sonner'

export function DocumentEditorPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { role, currentWorkspace } = useWorkspace()

  const [document, setDocument] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authToken, setAuthToken] = useState(null)

  // Fetch document details & auth token
  useEffect(() => {
    let active = true

    async function initDoc() {
      setIsLoading(true)
      setError(null)

      try {
        // 1. Resolve auth token
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token || null
        if (active) setAuthToken(token)

        // 2. Fetch document record
        const doc = await getDocumentById(documentId)
        if (currentWorkspace?.id && doc.workspace_id && doc.workspace_id !== currentWorkspace.id) {
          throw new Error('Access denied: You do not have permission to access resources in another workspace.')
        }
        if (active) {
          setDocument(doc)
          setIsLoading(false)
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load document:', err)
          setError(err.message || 'Document could not be loaded.')
          setIsLoading(false)
        }
      }
    }

    if (documentId) {
      initDoc()
    }

    return () => {
      active = false
    }
  }, [documentId])

  const handleTitleChange = async (newTitle) => {
    if (!newTitle || newTitle === document?.title) return
    try {
      const updated = await updateDocument(documentId, {
        title: newTitle,
        lastEditedBy: user?.id,
      })
      setDocument((prev) => ({ ...prev, ...updated, title: newTitle }))
      toast.success('Title updated')
    } catch (err) {
      console.error('Failed to update title:', err)
      toast.error('Failed to update document title')
    }
  }

  const handleSaveContent = async ({ content, contentText }) => {
    try {
      await updateDocument(documentId, {
        content,
        contentText,
        lastEditedBy: user?.id,
      })
    } catch (err) {
      console.error('Auto-save error:', err)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${document?.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteDocument(documentId, user?.id, role)
      toast.success('Document deleted')
      navigate('/docs')
    } catch (err) {
      console.error('Delete error:', err)
      toast.error(err.message || 'Failed to delete document')
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm">Loading collaborative document...</p>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-destructive mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-1">Document Unavailable</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {error || 'The requested document does not exist or you do not have permission to view it.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Documents
        </Button>
      </div>
    )
  }

  const isCreator = document.created_by === user?.id
  const canDelete = isCreator || ['Owner', 'Admin'].includes(role)

  const currentUserData = {
    id: user?.id || 'anonymous',
    full_name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Collaborator',
    email: profile?.email || user?.email || '',
    avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Breadcrumb & Navigation Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/docs"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
            title="Back to all documents"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              Documents /
            </span>
            <span className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md" title={document.title}>
              {document.title}
            </span>
          </div>

          {document.project && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary text-[11px] text-muted-foreground">
              <FolderKanban className="h-3 w-3 text-brand" />
              <span>{document.project.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10 hover:border-destructive/30 text-xs h-8"
              title="Delete document"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Collaborative Editor Container */}
      <div className="flex-1 overflow-hidden p-2 sm:p-4 flex flex-col">
        <DocumentEditor
          document={document}
          currentUser={currentUserData}
          authToken={authToken}
          onTitleChange={handleTitleChange}
          onSaveContent={handleSaveContent}
        />
      </div>
    </div>
  )
}
