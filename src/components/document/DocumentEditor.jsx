// ==============================================================================
// CollabSpace Component: DocumentEditor
// File: src/components/document/DocumentEditor.jsx
// Description:
//   Core collaborative rich-text editor using Tiptap, Yjs, and Hocuspocus provider.
//   Supports simultaneous multi-user editing, live collaborator cursors, presence,
//   and automatic CRDT synchronization.
// ==============================================================================

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { EditorToolbar } from './EditorToolbar'
import { ActiveCollaboratorsBar } from './ActiveCollaboratorsBar'
import { getCollaboratorColor } from '@/services/documents'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

export function DocumentEditor({
  document: initialDoc,
  onSaveContent = null,
  onTitleChange = null,
  currentUser,
  authToken = null,
  wsUrl = null,
  className = '',
}) {
  const [docTitle, setDocTitle] = useState(initialDoc?.title || 'Untitled Document')
  const [connectionStatus, setConnectionStatus] = useState('connecting') // 'connected' | 'connecting' | 'disconnected'
  const [activeCollaborators, setActiveCollaborators] = useState([])
  const [lastSavedTime, setLastSavedTime] = useState(initialDoc?.updated_at || new Date().toISOString())
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef(null)

  const documentId = initialDoc?.id || 'demo-doc-default'
  const userColor = useMemo(
    () => getCollaboratorColor(currentUser?.id || 'demo-user'),
    [currentUser?.id]
  )
  const userName = currentUser?.full_name || currentUser?.name || currentUser?.email?.split('@')[0] || 'Collaborator'

  // 1. Create a stable Yjs document for this session
  const ydoc = useMemo(() => new Y.Doc(), [documentId])

  // 2. Initialize Hocuspocus provider for WebSocket synchronization
  const provider = useMemo(() => {
    const serverUrl = wsUrl || (typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss://' : 'ws://') + (window?.location?.hostname || '127.0.0.1') + ':1234'

    const hocuspocusToken = authToken || (currentUser?.id ? `demo-token-${currentUser.id}` : 'demo-token')

    const p = new HocuspocusProvider({
      url: serverUrl,
      name: documentId,
      document: ydoc,
      token: hocuspocusToken,
      user: {
        id: currentUser?.id,
        name: userName,
        color: userColor,
        avatar: currentUser?.avatar_url || '',
      },
      onConnect: () => {
        setConnectionStatus('connected')
      },
      onConnecting: () => {
        setConnectionStatus('connecting')
      },
      onDisconnect: () => {
        setConnectionStatus('disconnected')
      },
      onAwarenessUpdate: ({ states }) => {
        const peers = states
          .map((s) => s.user)
          .filter((u) => u && u.name)
        // Deduplicate peers by name or id
        const unique = Array.from(new Map(peers.map((item) => [item.id || item.name, item])).values())
        setActiveCollaborators(unique)
      },
    })

    return p
  }, [documentId, ydoc, wsUrl, authToken, currentUser?.id, userName, userColor])

  // 3. Initialize Tiptap Editor with Yjs & Hocuspocus collaboration extensions
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false, // CRITICAL: Disabled because Yjs manages CRDT undo/redo
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-brand underline cursor-pointer',
          },
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider,
          user: {
            name: userName,
            color: userColor,
          },
        }),
      ],
      editorProps: {
        attributes: {
          class: 'prose dark:prose-invert max-w-none focus:outline-none p-6 sm:p-8 min-h-[450px]',
        },
      },
      onUpdate: ({ editor: ed }) => {
        // Debounce database content save
        if (onSaveContent) {
          setIsSaving(true)
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

          saveTimeoutRef.current = setTimeout(async () => {
            try {
              const json = ed.getJSON()
              const text = ed.getText()
              await onSaveContent({
                content: json,
                contentText: text,
              })
              setLastSavedTime(new Date().toISOString())
            } catch (err) {
              console.error('Failed to save document update:', err)
            } finally {
              setIsSaving(false)
            }
          }, 1500)
        }
      },
    },
    [ydoc, provider]
  )

  // 4. Initial content seed for offline/demo mode if Y.Doc is brand new
  useEffect(() => {
    if (editor && initialDoc?.content && editor.isEmpty) {
      // Check if Yjs doc has any content
      const type = ydoc.getXmlFragment('default')
      if (type.length === 0) {
        editor.commands.setContent(initialDoc.content)
      }
    }
  }, [editor, initialDoc?.content, ydoc])

  // Clean up provider & timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      if (provider) provider.destroy()
      if (ydoc) ydoc.destroy()
    }
  }, [provider, ydoc])

  // Handle title input change with debounce
  const handleTitleBlur = () => {
    if (onTitleChange && docTitle.trim() !== initialDoc?.title) {
      onTitleChange(docTitle.trim() || 'Untitled Document')
    }
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col flex-1 bg-card rounded-xl border border-border shadow-xs overflow-hidden',
        className
      )}
    >
      {/* Collaborator Presence & Status Bar */}
      <ActiveCollaboratorsBar
        collaborators={activeCollaborators}
        connectionStatus={connectionStatus}
        lastSavedTime={lastSavedTime}
        isSaving={isSaving}
      />

      {/* Formatting Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Document Canvas Body */}
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-3xl bg-card rounded-xl border border-border shadow-2xs overflow-hidden">
          {/* Document Title Input */}
          <div className="px-6 sm:px-8 pt-8 pb-3 border-b border-border/60">
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              placeholder="Untitled Document"
              className="w-full text-2xl sm:text-3xl font-bold bg-transparent text-foreground border-none focus:outline-none placeholder:text-muted-foreground/50 tracking-tight"
            />
          </div>

          {/* Tiptap Editor Content Area */}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
