// ==============================================================================
// CollabSpace Component: FileCard
// File: src/components/file/FileCard.jsx
// Description:
//   Card presentation for grid view in file manager and task attachments.
//   Displays thumbnail/icon, metadata, association badges, and quick actions.
// ==============================================================================

import React, { useState } from 'react'
import {
  File,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Layers,
  FolderKanban,
  CheckSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import {
  formatFileSize,
  getFileTypeCategory,
  downloadFile,
} from '@/services/files'
import { cn } from '@/utils/cn'

export function FileCard({
  attachment,
  onPreview,
  onDelete,
  canDelete = false,
  className = '',
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const category = getFileTypeCategory(attachment.mime_type, attachment.file_name)

  const handleDownload = async (e) => {
    e.stopPropagation()
    setIsDownloading(true)
    try {
      await downloadFile({
        storagePath: attachment.storage_path,
        fileName: attachment.file_name,
        bucketId: attachment.bucket_id || 'workspace-files',
      })
    } catch (err) {
      console.error('Download error:', err)
      if (attachment.preview_url) {
        window.open(attachment.preview_url, '_blank')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(attachment.id)
    }
  }

  const renderIconOrThumbnail = () => {
    if (category === 'image' && attachment.preview_url) {
      return (
        <div className="relative w-full h-32 bg-muted/40 overflow-hidden flex items-center justify-center">
          <img
            src={attachment.preview_url}
            alt={attachment.file_name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="p-2 rounded-full bg-card/90 text-foreground shadow-sm">
              <Eye className="h-4 w-4" />
            </span>
          </div>
        </div>
      )
    }

    let Icon = File
    let colorClass = 'text-muted-foreground'
    let bgClass = 'bg-muted/40'

    switch (category) {
      case 'image':
        Icon = File
        colorClass = 'text-blue-500'
        bgClass = 'bg-blue-500/10'
        break
      case 'pdf':
        Icon = FileText
        colorClass = 'text-rose-500'
        bgClass = 'bg-rose-500/10'
        break
      case 'spreadsheet':
        Icon = FileSpreadsheet
        colorClass = 'text-emerald-500'
        bgClass = 'bg-emerald-500/10'
        break
      case 'code':
        Icon = FileCode
        colorClass = 'text-cyan-500'
        bgClass = 'bg-cyan-500/10'
        break
      case 'archive':
        Icon = FileArchive
        colorClass = 'text-amber-500'
        bgClass = 'bg-amber-500/10'
        break
      default:
        Icon = File
        colorClass = 'text-slate-500'
        bgClass = 'bg-slate-500/10'
        break
    }

    return (
      <div className={cn('w-full h-32 flex flex-col items-center justify-center transition-colors', bgClass)}>
        <Icon className={cn('h-12 w-12', colorClass)} />
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-2 font-medium">
          {attachment.file_name.split('.').pop() || category}
        </span>
      </div>
    )
  }

  return (
    <div
      onClick={() => onPreview && onPreview(attachment)}
      className={cn(
        'group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-2xs hover:shadow-card hover:border-brand/40 transition-all cursor-pointer',
        className
      )}
    >
      {/* File Graphic Top Banner */}
      {renderIconOrThumbnail()}

      {/* Card Content */}
      <div className="flex-1 p-3.5 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h4
              className="text-xs font-semibold text-foreground truncate group-hover:text-brand transition-colors flex-1"
              title={attachment.file_name}
            >
              {attachment.file_name}
            </h4>

            {/* Actions Dropdown */}
            <DropdownMenu
              trigger={
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              }
              align="end"
            >
              <DropdownMenuItem onClick={() => onPreview && onPreview(attachment)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Attachment
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenu>
          </div>

          <p className="text-[11px] text-muted-foreground mt-1">
            {formatFileSize(attachment.file_size)}
          </p>
        </div>

        {/* Association & Metadata Footer */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          {attachment.project ? (
            <div className="flex items-center gap-1.5 truncate max-w-[140px]" title={attachment.project.name}>
              <FolderKanban className="h-3 w-3 shrink-0 text-brand" />
              <span className="truncate">{attachment.project.name}</span>
            </div>
          ) : attachment.task_id ? (
            <div className="flex items-center gap-1.5 truncate max-w-[140px]">
              <CheckSquare className="h-3 w-3 shrink-0 text-emerald-500" />
              <span className="truncate">Task File</span>
            </div>
          ) : (
            <span className="text-muted-foreground/80">General</span>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {attachment.uploader && (
              <Avatar
                src={attachment.uploader.avatar_url}
                name={attachment.uploader.full_name || attachment.uploader.email}
                size="xs"
              />
            )}
            <span className="text-[10px]">
              {new Date(attachment.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
