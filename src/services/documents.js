// ==============================================================================
// CollabSpace Service: Document Management & Real-Time Collaboration
// File: src/services/documents.js
// Description:
//   Handles document CRUD, workspace scoping, project filtering, version history,
//   and real-time Yjs CRDT synchronization state management.
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase.js'

/**
 * Collaborator cursor color palette
 */
export const COLLABORATOR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ef4444', // red
  '#14b8a6', // teal
]

export function getCollaboratorColor(userId = '') {
  if (!userId) return COLLABORATOR_COLORS[0]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length
  return COLLABORATOR_COLORS[index]
}

/**
 * Realistic initial demo documents for offline & preview testing
 */
export const DEMO_DOCUMENTS = [
  {
    id: 'demo-doc-1',
    workspace_id: 'demo-workspace-uuid',
    project_id: 'demo-project-alpha',
    title: 'Product Requirements Document (PRD) - CollabSpace 2.0',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Product Requirements Document (PRD)' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'CollabSpace is an all-in-one SaaS platform combining real-time communication, task tracking, collaborative documents, and file management for distributed engineering teams.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Core Architecture & Objectives' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'True CRDT real-time document synchronization via Yjs and Hocuspocus.' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Live collaborator awareness showing active peers, presence, and selection cursors.' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Offline resilient architecture with automatic reconnection.' }],
                },
              ],
            },
          ],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Collaborative editing must merge concurrent edits smoothly without losing user keystrokes.',
                },
              ],
            },
          ],
        },
      ],
    },
    content_text: 'Product Requirements Document (PRD) Core Architecture & Objectives...',
    created_by: 'demo-user-sarah',
    last_edited_by: 'demo-user-alex',
    is_archived: false,
    is_template: false,
    created_at: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    creator: {
      id: 'demo-user-sarah',
      full_name: 'Sarah Connor',
      email: 'sarah@collabspace.app',
      avatar_url: '',
    },
    last_editor: {
      id: 'demo-user-alex',
      full_name: 'Alex Rivera',
      email: 'alex@collabspace.app',
      avatar_url: '',
    },
    project: {
      id: 'demo-project-alpha',
      name: 'Project Alpha',
      color: '#6366f1',
    },
  },
  {
    id: 'demo-doc-2',
    workspace_id: 'demo-workspace-uuid',
    project_id: 'demo-project-beta',
    title: 'Design System & Token Architecture',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Design System Specification' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Standardized typography, radius, shadows, and accessible contrast ratios across light and dark modes.',
            },
          ],
        },
      ],
    },
    content_text: 'Design System Specification Standardized typography...',
    created_by: 'demo-user-elena',
    last_edited_by: 'demo-user-elena',
    is_archived: false,
    is_template: false,
    created_at: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    creator: {
      id: 'demo-user-elena',
      full_name: 'Elena Rostova',
      email: 'elena@collabspace.app',
      avatar_url: '',
    },
    last_editor: {
      id: 'demo-user-elena',
      full_name: 'Elena Rostova',
      email: 'elena@collabspace.app',
      avatar_url: '',
    },
    project: {
      id: 'demo-project-beta',
      name: 'Mobile App Redesign',
      color: '#06b6d4',
    },
  },
]

// In-memory documents store for demo & testing
let demoDocumentsStore = [...DEMO_DOCUMENTS]

/**
 * Retrieves all documents for a workspace with optional filters.
 *
 * @param {string} workspaceId
 * @param {object} [options]
 * @param {string} [options.projectId]
 * @param {string} [options.search]
 * @param {boolean} [options.isArchived=false]
 * @returns {Promise<Array<object>>}
 */
export async function getWorkspaceDocuments(workspaceId, options = {}) {
  const { projectId, search, isArchived = false } = options

  if (!workspaceId) return []

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-')) {
    let results = demoDocumentsStore.filter(
      (doc) => doc.workspace_id === workspaceId && doc.is_archived === isArchived
    )

    if (projectId && projectId !== 'all') {
      results = results.filter((doc) => doc.project_id === projectId)
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim()
      results = results.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          (doc.content_text && doc.content_text.toLowerCase().includes(q))
      )
    }

    return results.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  }

  try {
    let query = supabase
      .from('documents')
      .select(`
        *,
        creator:created_by (
          id,
          full_name,
          email,
          avatar_url
        ),
        last_editor:last_edited_by (
          id,
          full_name,
          email,
          avatar_url
        ),
        project:project_id (
          id,
          name,
          color
        )
      `)
      .eq('workspace_id', workspaceId)
      .eq('is_archived', isArchived)
      .order('updated_at', { ascending: false })

    if (projectId && projectId !== 'all') {
      query = query.eq('project_id', projectId)
    }

    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching workspace documents:', error)
      throw error
    }

    return data || []
  } catch (err) {
    console.error('getWorkspaceDocuments failed:', err)
    return []
  }
}

/**
 * Retrieves a single document by ID.
 *
 * @param {string} documentId Document UUID
 * @returns {Promise<object>} Document record with creator and project
 */
export async function getDocumentById(documentId) {
  if (!documentId) throw new Error('Document ID is required.')

  if (!isSupabaseConfigured || documentId.startsWith('demo-')) {
    const doc = demoDocumentsStore.find((d) => d.id === documentId)
    if (!doc) throw new Error('Document not found.')
    return doc
  }

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      creator:created_by (
        id,
        full_name,
        email,
        avatar_url
      ),
      last_editor:last_edited_by (
        id,
        full_name,
        email,
        avatar_url
      ),
      project:project_id (
        id,
        name,
        color
      )
    `)
    .eq('id', documentId)
    .single()

  if (error || !data) {
    throw new Error(`Document not found: ${error?.message || ''}`)
  }

  return data
}

/**
 * Creates a new document in the workspace.
 *
 * @param {object} params
 * @param {string} params.workspaceId
 * @param {string} [params.projectId]
 * @param {string} params.title
 * @param {object} [params.content] Initial Tiptap JSON content
 * @param {string} [params.contentText=''] Plain text representation
 * @param {string} params.userId
 * @returns {Promise<object>} Created document
 */
export async function createDocument({
  workspaceId,
  projectId = null,
  title,
  content = null,
  contentText = '',
  userId,
}) {
  if (!workspaceId) throw new Error('Workspace ID is required.')
  const trimmedTitle = (title || '').trim()
  if (!trimmedTitle) throw new Error('Document title cannot be empty.')
  if (trimmedTitle.length > 250) throw new Error('Document title must be under 250 characters.')

  const initialContent = content || {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: trimmedTitle }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Start writing your document collaboratively...' }],
      },
    ],
  }

  if (!isSupabaseConfigured || workspaceId.startsWith('demo-') || userId?.startsWith('demo-') || userId?.startsWith('test-')) {
    const newDoc = {
      id: `demo-doc-${Date.now()}`,
      workspace_id: workspaceId,
      project_id: projectId || null,
      parent_id: null,
      title: trimmedTitle,
      content: initialContent,
      content_text: contentText || trimmedTitle,
      created_by: userId || 'demo-user-sarah',
      last_edited_by: userId || 'demo-user-sarah',
      is_archived: false,
      is_template: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: {
        id: userId || 'demo-user-sarah',
        full_name: 'Current User',
        email: 'user@collabspace.app',
        avatar_url: '',
      },
      last_editor: {
        id: userId || 'demo-user-sarah',
        full_name: 'Current User',
        email: 'user@collabspace.app',
        avatar_url: '',
      },
      project: null,
    }

    demoDocumentsStore.unshift(newDoc)
    return newDoc
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      workspace_id: workspaceId,
      project_id: projectId || null,
      title: trimmedTitle,
      content: initialContent,
      content_text: contentText,
      created_by: userId,
      last_edited_by: userId,
    })
    .select(`
      *,
      creator:created_by (
        id,
        full_name,
        email,
        avatar_url
      ),
      project:project_id (
        id,
        name,
        color
      )
    `)
    .single()

  if (error) {
    console.error('Error creating document:', error)
    throw new Error(`Failed to create document: ${error.message}`)
  }

  return data
}

/**
 * Updates document title, content, or metadata.
 *
 * @param {string} documentId
 * @param {object} updates
 * @param {string} [updates.title]
 * @param {object} [updates.content]
 * @param {string} [updates.contentText]
 * @param {string} [updates.lastEditedBy]
 * @param {boolean} [updates.isArchived]
 * @returns {Promise<object>} Updated document
 */
export async function updateDocument(documentId, updates = {}) {
  if (!documentId) throw new Error('Document ID is required.')

  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  if (updates.title) {
    const trimmed = updates.title.trim()
    if (!trimmed) throw new Error('Title cannot be empty.')
    payload.title = trimmed
  }

  if (!isSupabaseConfigured || documentId.startsWith('demo-')) {
    const index = demoDocumentsStore.findIndex((d) => d.id === documentId)
    if (index === -1) throw new Error('Document not found.')

    demoDocumentsStore[index] = {
      ...demoDocumentsStore[index],
      ...payload,
    }
    return demoDocumentsStore[index]
  }

  const { data, error } = await supabase
    .from('documents')
    .update(payload)
    .eq('id', documentId)
    .select(`
      *,
      creator:created_by (
        id,
        full_name,
        email,
        avatar_url
      ),
      last_editor:last_edited_by (
        id,
        full_name,
        email,
        avatar_url
      ),
      project:project_id (
        id,
        name,
        color
      )
    `)
    .single()

  if (error) {
    console.error('Error updating document:', error)
    throw new Error(`Failed to update document: ${error.message}`)
  }

  return data
}

/**
 * Deletes a document with role authorization check.
 *
 * @param {string} documentId
 * @param {string} userId
 * @param {string} userRole
 * @returns {Promise<boolean>}
 */
export async function deleteDocument(documentId, userId, userRole = 'Member') {
  if (!documentId) throw new Error('Document ID is required.')

  if (!isSupabaseConfigured || documentId.startsWith('demo-')) {
    const doc = demoDocumentsStore.find((d) => d.id === documentId)
    if (!doc) throw new Error('Document not found.')

    const isCreator = doc.created_by === userId
    const isPrivileged = ['Owner', 'Admin'].includes(userRole)

    if (!isCreator && !isPrivileged) {
      throw new Error('Permission denied: Only the document creator or a workspace Admin can delete this document.')
    }

    demoDocumentsStore = demoDocumentsStore.filter((d) => d.id !== documentId)
    return true
  }

  // Check creator & permissions
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('id, created_by')
    .eq('id', documentId)
    .single()

  if (fetchError || !doc) {
    throw new Error('Document not found.')
  }

  const isCreator = doc.created_by === userId
  const isPrivileged = ['Owner', 'Admin'].includes(userRole)

  if (!isCreator && !isPrivileged) {
    throw new Error('Permission denied: Only the document creator or a workspace Admin can delete this document.')
  }

  const { error: delError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (delError) {
    console.error('Error deleting document:', delError)
    throw new Error(`Failed to delete document: ${delError.message}`)
  }

  return true
}

/**
 * Resets demo documents store for unit tests
 */
export function resetDemoDocuments() {
  demoDocumentsStore = [...DEMO_DOCUMENTS]
}
