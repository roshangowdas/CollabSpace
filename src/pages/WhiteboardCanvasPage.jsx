// ==============================================================================
// CollabSpace Page: WhiteboardCanvasPage
// File: src/pages/WhiteboardCanvasPage.jsx
// Description:
//   Infinite collaborative whiteboard workspace with real-time SVG canvas,
//   element-based sync, Supabase Realtime broadcast & presence, and peer cursors.
// ==============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  WhiteboardHeader,
  WhiteboardToolbar,
  WhiteboardCanvas,
} from '@/components/whiteboard'
import {
  getWhiteboardById,
  getWhiteboardElements,
  updateWhiteboard,
  deleteWhiteboard,
  deleteWhiteboardElement,
  subscribeToWhiteboard,
  SHAPE_TYPES,
  STICKY_COLORS,
} from '@/services/whiteboards'
import { getCollaboratorColor } from '@/services/documents'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { toast } from 'sonner'

export function WhiteboardCanvasPage() {
  const { whiteboardId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { role, currentWorkspace } = useWorkspace()

  const [whiteboard, setWhiteboard] = useState(null)
  const [elements, setElements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Canvas Viewport & Tool States
  const [activeTool, setActiveTool] = useState(SHAPE_TYPES.SELECT)
  const [activeColor, setActiveColor] = useState(STICKY_COLORS[0].bg)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedElementId, setSelectedElementId] = useState(null)

  // Realtime Collaborator States
  const [collaborators, setCollaborators] = useState([])
  const [remoteCursors, setRemoteCursors] = useState({})
  const realtimeRef = useRef(null)

  const currentUserData = {
    id: user?.id || 'anonymous',
    name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Collaborator',
    email: profile?.email || user?.email || '',
    avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
    color: getCollaboratorColor(user?.id || 'anonymous'),
  }

  // Load board and elements
  useEffect(() => {
    let active = true

    async function loadBoard() {
      setIsLoading(true)
      setError(null)

      try {
        const boardData = await getWhiteboardById(whiteboardId)
        if (currentWorkspace?.id && boardData?.workspace_id && boardData.workspace_id !== currentWorkspace.id) {
          throw new Error('Access denied: You do not have permission to access resources in another workspace.')
        }
        const elementsData = await getWhiteboardElements(whiteboardId)

        if (active) {
          setWhiteboard(boardData)
          setElements(elementsData || [])

          // Restore saved canvas viewport if present
          if (boardData?.canvas_state?.viewport) {
            setZoom(boardData.canvas_state.viewport.zoom || 1)
            setPan({
              x: boardData.canvas_state.viewport.x || 0,
              y: boardData.canvas_state.viewport.y || 0,
            })
          }

          setIsLoading(false)
        }
      } catch (err) {
        if (active) {
          console.error('Failed to load whiteboard:', err)
          setError(err.message || 'Whiteboard could not be loaded.')
          setIsLoading(false)
        }
      }
    }

    if (whiteboardId) {
      loadBoard()
    }

    return () => {
      active = false
    }
  }, [whiteboardId])

  // Setup Supabase Realtime Broadcast & Presence
  useEffect(() => {
    if (!whiteboardId) return

    const sub = subscribeToWhiteboard(
      whiteboardId,
      {
        onElementChange: ({ action, element }) => {
          if (!element) return

          setElements((prev) => {
            if (action === 'create') {
              if (prev.some((e) => e.id === element.id)) return prev
              return [...prev, element]
            }
            if (action === 'update') {
              return prev.map((e) => (e.id === element.id ? element : e))
            }
            if (action === 'delete') {
              return prev.filter((e) => e.id !== element.id)
            }
            return prev
          })
        },
        onCursorMove: (cursorPayload) => {
          if (!cursorPayload?.userId || cursorPayload.userId === currentUserData.id) return
          setRemoteCursors((prev) => ({
            ...prev,
            [cursorPayload.userId]: cursorPayload,
          }))
        },
        onPresenceSync: (peers) => {
          setCollaborators(peers)
        },
      },
      currentUserData
    )

    realtimeRef.current = sub

    return () => {
      if (realtimeRef.current) {
        realtimeRef.current.unsubscribe()
      }
    }
  }, [whiteboardId, currentUserData.id])

  // Broadcast handlers
  const handleBroadcastElement = useCallback((action, element) => {
    if (realtimeRef.current) {
      realtimeRef.current.broadcastElement(action, element)
    }
  }, [])

  const handleBroadcastCursor = useCallback((x, y) => {
    if (realtimeRef.current) {
      realtimeRef.current.broadcastCursor(x, y)
    }
  }, [])

  // Title update handler
  const handleTitleChange = async (newName) => {
    if (!newName || newName === whiteboard?.name) return
    try {
      setIsSaving(true)
      const updated = await updateWhiteboard(whiteboardId, { name: newName })
      setWhiteboard((prev) => ({ ...prev, name: newName }))
      toast.success('Title updated')
    } catch (err) {
      console.error('Update title failed:', err)
      toast.error('Failed to update title')
    } finally {
      setIsSaving(false)
    }
  }

  // Delete element handler
  const handleDeleteSelected = async () => {
    if (!selectedElementId) return
    const idToDelete = selectedElementId
    setSelectedElementId(null)

    // Remove locally
    setElements((prev) => prev.filter((e) => e.id !== idToDelete))

    // Broadcast to peers
    handleBroadcastElement('delete', { id: idToDelete })

    // Persist to database
    try {
      await deleteWhiteboardElement(idToDelete)
    } catch (err) {
      console.error('Failed to delete element from DB:', err)
    }
  }

  // Delete entire whiteboard handler
  const handleDeleteWhiteboard = async () => {
    if (!window.confirm(`Are you sure you want to delete "${whiteboard?.name}"?`)) return
    try {
      await deleteWhiteboard(whiteboardId, user?.id, role)
      toast.success('Whiteboard deleted')
      navigate('/whiteboards')
    } catch (err) {
      console.error('Delete board error:', err)
      toast.error(err.message || 'Failed to delete whiteboard')
    }
  }

  // Keyboard shortcut listener (Delete/Backspace to delete selected element)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          handleDeleteSelected()
        }
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool(SHAPE_TYPES.SELECT)
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool(SHAPE_TYPES.PAN)
      } else if (e.key === 's' || e.key === 'S') {
        setActiveTool(SHAPE_TYPES.STICKY)
      } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool(SHAPE_TYPES.RECTANGLE)
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool(SHAPE_TYPES.CIRCLE)
      } else if (e.key === 'a' || e.key === 'A') {
        setActiveTool(SHAPE_TYPES.ARROW)
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveTool(SHAPE_TYPES.FREEHAND)
      } else if (e.key === 't' || e.key === 'T') {
        setActiveTool(SHAPE_TYPES.TEXT)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElementId])

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm">Loading whiteboard canvas...</p>
      </div>
    )
  }

  if (error || !whiteboard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <AlertCircle className="h-12 w-12 text-destructive mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-1">Whiteboard Unavailable</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {error || 'This whiteboard does not exist or you do not have permission to view it.'}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/whiteboards')}>
          Back to Whiteboards
        </Button>
      </div>
    )
  }

  const isCreator = whiteboard.created_by === user?.id
  const canDelete = isCreator || ['Owner', 'Admin'].includes(role)

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header */}
      <WhiteboardHeader
        whiteboard={whiteboard}
        onTitleChange={handleTitleChange}
        onDelete={handleDeleteWhiteboard}
        canDelete={canDelete}
        collaborators={collaborators}
        isSaving={isSaving}
      />

      {/* Main Interactive Canvas */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <WhiteboardCanvas
          whiteboardId={whiteboardId}
          elements={elements}
          onElementsChange={setElements}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          activeColor={activeColor}
          zoom={zoom}
          setZoom={setZoom}
          pan={pan}
          setPan={setPan}
          currentUser={currentUserData}
          remoteCursors={remoteCursors}
          onBroadcastCursor={handleBroadcastCursor}
          onBroadcastElement={handleBroadcastElement}
          selectedElementId={selectedElementId}
          setSelectedElementId={setSelectedElementId}
        />
      </div>

      {/* Floating Bottom Toolbar */}
      <WhiteboardToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        zoom={zoom}
        setZoom={setZoom}
        onResetView={() => {
          setZoom(1)
          setPan({ x: 0, y: 0 })
        }}
        selectedElement={elements.find((e) => e.id === selectedElementId)}
        onDeleteSelected={handleDeleteSelected}
      />
    </div>
  )
}
