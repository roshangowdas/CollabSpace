// ==============================================================================
// CollabSpace Component: CreateWhiteboardModal
// File: src/components/whiteboard/CreateWhiteboardModal.jsx
// Description:
//   Modal to create a new shared brainstorming whiteboard canvas.
// ==============================================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, FolderKanban, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { createWhiteboard } from '@/services/whiteboards'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { toast } from 'sonner'

export function CreateWhiteboardModal({
  isOpen,
  onClose,
  projects = [],
  onWhiteboardCreated = null,
}) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Whiteboard name is required.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const newBoard = await createWhiteboard({
        workspaceId: currentWorkspace?.id || 'demo-workspace-uuid',
        projectId: selectedProjectId || null,
        name: trimmed,
        description: description.trim(),
        userId: user?.id,
      })

      toast.success(`Created whiteboard "${trimmed}"`)
      if (onWhiteboardCreated) onWhiteboardCreated(newBoard)
      onClose()
      navigate(`/whiteboards/${newBoard.id}`)
    } catch (err) {
      console.error('Failed to create whiteboard:', err)
      setError(err.message || 'Failed to create whiteboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Brainstorming Whiteboard"
      description="Start an infinite digital whiteboard with sticky notes, flowcharts, and live team cursors."
      size="default"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="board-name">Whiteboard Name</Label>
          <Input
            id="board-name"
            placeholder="e.g. System Architecture & Database Design"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="board-desc">Description (Optional)</Label>
          <Textarea
            id="board-desc"
            rows={3}
            placeholder="What is this board for? (e.g. Sprint planning, wireframes, retrospectives)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="board-project">Associated Project (Optional)</Label>
          <Select
            id="board-project"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            options={[
              { value: '', label: 'None (Workspace General Whiteboard)' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Creating...
              </>
            ) : (
              'Create & Open Canvas'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
