// ==============================================================================
// CollabSpace Component: WhiteboardCard
// File: src/components/whiteboard/WhiteboardCard.jsx
// Description:
//   Card presentation for whiteboards list showing canvas preview graphic,
//   metadata, associated project, and management controls.
// ==============================================================================

import React from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  FolderKanban,
  Trash2,
  ExternalLink,
  MoreVertical,
  Clock,
  Layers,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { cn } from '@/utils/cn'

export function WhiteboardCard({
  whiteboard: wb,
  onDelete = null,
  canDelete = false,
  className = '',
}) {
  const handleDelete = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (onDelete) onDelete(wb.id)
  }

  return (
    <Link
      to={`/whiteboards/${wb.id}`}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-border bg-card overflow-hidden shadow-2xs hover:shadow-card hover:border-brand/40 transition-all cursor-pointer',
        className
      )}
    >
      {/* Board Mini Preview Graphic */}
      <div className="relative w-full h-32 bg-slate-100 dark:bg-zinc-900 border-b border-border/60 flex items-center justify-center p-4 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Decorative mini shapes preview */}
        <div className="relative flex items-center gap-3 scale-90">
          <div className="w-16 h-14 rounded-lg bg-yellow-200 border border-yellow-300 shadow-sm flex items-center justify-center -rotate-3 text-[9px] font-medium text-yellow-900 p-1">
            Sticky
          </div>
          <div className="w-20 h-12 rounded bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 shadow-xs flex items-center justify-center text-[9px] text-muted-foreground font-mono">
            Architecture
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center rotate-6 text-[8px] font-semibold text-blue-800">
            Flow
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h4
              className="text-sm font-semibold text-foreground truncate group-hover:text-brand transition-colors flex-1"
              title={wb.name}
            >
              {wb.name}
            </h4>

            <DropdownMenu
              trigger={
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              }
              align="end"
            >
              <DropdownMenuItem asChild>
                <Link to={`/whiteboards/${wb.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Canvas
                </Link>
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Whiteboard
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenu>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
            {wb.description || 'Brainstorming canvas with sticky notes, diagrams, and connectors.'}
          </p>
        </div>

        {/* Association & Metadata Footer */}
        <div className="pt-3 mt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          {wb.project ? (
            <div className="flex items-center gap-1.5 truncate max-w-[130px]" title={wb.project.name}>
              <FolderKanban className="h-3 w-3 text-brand shrink-0" />
              <span className="truncate">{wb.project.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/70">General Board</span>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {wb.creator && (
              <Avatar
                src={wb.creator.avatar_url}
                name={wb.creator.full_name || wb.creator.email}
                size="xs"
                className="h-5 w-5 text-[9px]"
              />
            )}
            <span className="text-[10px]">
              {new Date(wb.updated_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
