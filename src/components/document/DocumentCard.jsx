// ==============================================================================
// CollabSpace Component: DocumentCard
// File: src/components/document/DocumentCard.jsx
// Description:
//   Card presentation for documents list with title, preview excerpt,
//   project association, author avatars, and action controls.
// ==============================================================================

import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Clock,
  FolderKanban,
  Trash2,
  ExternalLink,
  MoreVertical,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { cn } from '@/utils/cn'

export function DocumentCard({
  document: doc,
  onDelete = null,
  canDelete = false,
  className = '',
}) {
  const handleDelete = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (onDelete) onDelete(doc.id)
  }

  return (
    <Link
      to={`/docs/${doc.id}`}
      className={cn(
        'group relative flex flex-col justify-between p-4 rounded-xl border border-border bg-card shadow-2xs hover:shadow-card hover:border-brand/40 transition-all cursor-pointer',
        className
      )}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-brand/10 text-brand shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <h4
              className="text-sm font-semibold text-foreground truncate group-hover:text-brand transition-colors"
              title={doc.title}
            >
              {doc.title}
            </h4>
          </div>

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
              <Link to={`/docs/${doc.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Editor
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
                  Delete Document
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenu>
        </div>

        {/* Content Excerpt */}
        <p className="text-xs text-muted-foreground line-clamp-2 mt-3 leading-relaxed">
          {doc.content_text || 'No text content yet. Click to open and begin writing...'}
        </p>
      </div>

      {/* Footer Info */}
      <div className="pt-3 mt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        {doc.project ? (
          <div className="flex items-center gap-1.5 truncate max-w-[130px]" title={doc.project.name}>
            <FolderKanban className="h-3 w-3 text-brand shrink-0" />
            <span className="truncate">{doc.project.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground/70">General Doc</span>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {doc.creator && (
            <Avatar
              src={doc.creator.avatar_url}
              name={doc.creator.full_name || doc.creator.email}
              size="xs"
              className="h-5 w-5 text-[9px]"
            />
          )}
          <span className="text-[10px]">
            {new Date(doc.updated_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </Link>
  )
}
