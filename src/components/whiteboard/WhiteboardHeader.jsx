// ==============================================================================
// CollabSpace Component: WhiteboardHeader
// File: src/components/whiteboard/WhiteboardHeader.jsx
// Description:
//   Top header navigation bar for the whiteboard with editable title,
//   active collaborator presence, save state badge, and board deletion.
// ==============================================================================

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
  Loader2,
  Trash2,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/utils/cn'

export function WhiteboardHeader({
  whiteboard,
  onTitleChange,
  onDelete,
  canDelete = false,
  collaborators = [],
  isSaving = false,
  className = '',
}) {
  const [title, setTitle] = useState(whiteboard?.name || 'Untitled Whiteboard')

  const handleBlur = () => {
    if (title.trim() && title.trim() !== whiteboard?.name) {
      onTitleChange(title.trim())
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  return (
    <div
      className={cn(
        'absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-card/90 backdrop-blur-md border-b border-border shadow-xs select-none',
        className
      )}
    >
      {/* Left: Back & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/whiteboards"
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
          title="Back to all whiteboards"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Whiteboard Name"
            className="text-sm sm:text-base font-semibold bg-transparent text-foreground border-none focus:outline-none focus:ring-1 focus:ring-brand rounded px-1.5 py-0.5 max-w-[220px] sm:max-w-md truncate"
          />

          {whiteboard?.project && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary text-[11px] text-muted-foreground">
              <FolderKanban className="h-3 w-3 text-brand" />
              <span>{whiteboard.project.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Presence, Save Status, Actions */}
      <div className="flex items-center gap-3">
        {/* Save Status */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground hidden sm:flex">
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
              <span>Saving board...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>All changes saved</span>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Collaborators Presence List */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center -space-x-1.5 overflow-hidden p-0.5">
            {collaborators.map((user, idx) => (
              <Tooltip
                key={user.id || idx}
                content={`${user.name || 'Collaborator'} (Viewing board)`}
              >
                <div
                  className="relative rounded-full ring-2 transition-transform hover:scale-110 hover:z-10 cursor-default"
                  style={{ ringColor: user.color || '#3b82f6' }}
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name || 'User'}
                    size="xs"
                    className="h-6 w-6 text-[10px]"
                  />
                </div>
              </Tooltip>
            ))}
          </div>

          <span className="text-[11px] text-muted-foreground hidden lg:inline">
            {collaborators.length} online
          </span>
        </div>

        {/* Delete Board */}
        {canDelete && onDelete && (
          <>
            <div className="h-4 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:bg-destructive/10 hover:border-destructive/30 text-xs h-8"
              title="Delete Whiteboard"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
