// ==============================================================================
// CollabSpace Component: FileList
// File: src/components/file/FileList.jsx
// Description:
//   Tabular list presentation for files with sorting, quick actions, and
//   association badges for projects and tasks.
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
  FolderKanban,
  CheckSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import {
  formatFileSize,
  getFileTypeCategory,
  downloadFile,
} from '@/services/files'

export function FileList({
  attachments = [],
  onPreview,
  onDelete,
  canDelete = false,
  currentUserId,
  userRole = 'Member',
}) {
  const [sortField, setSortField] = useState('created_at')
  const [sortAsc, setSortAsc] = useState(false)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const sortedFiles = [...attachments].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    if (sortField === 'file_name') {
      aVal = a.file_name.toLowerCase()
      bVal = b.file_name.toLowerCase()
    } else if (sortField === 'file_size') {
      aVal = Number(a.file_size || 0)
      bVal = Number(b.file_size || 0)
    } else if (sortField === 'created_at') {
      aVal = new Date(a.created_at).getTime()
      bVal = new Date(b.created_at).getTime()
    }

    if (aVal < bVal) return sortAsc ? -1 : 1
    if (aVal > bVal) return sortAsc ? 1 : -1
    return 0
  })

  const getCategoryIcon = (mime, name) => {
    const cat = getFileTypeCategory(mime, name)
    switch (cat) {
      case 'image':
        return <File className="h-4 w-4 text-blue-500" />
      case 'pdf':
        return <FileText className="h-4 w-4 text-rose-500" />
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
      case 'code':
        return <FileCode className="h-4 w-4 text-cyan-500" />
      case 'archive':
        return <FileArchive className="h-4 w-4 text-amber-500" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 ml-1 inline" />
    }
    return sortAsc ? (
      <ArrowUp className="h-3 w-3 text-brand ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 text-brand ml-1 inline" />
    )
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-2xs">
      <table className="w-full text-left text-xs text-foreground">
        <thead className="border-b border-border bg-muted/40 text-muted-foreground font-medium select-none">
          <tr>
            <th
              onClick={() => handleSort('file_name')}
              className="py-3 px-4 cursor-pointer hover:text-foreground transition-colors"
            >
              File Name {renderSortIcon('file_name')}
            </th>
            <th className="py-3 px-3 hidden sm:table-cell">Type</th>
            <th
              onClick={() => handleSort('file_size')}
              className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
            >
              Size {renderSortIcon('file_size')}
            </th>
            <th className="py-3 px-3 hidden md:table-cell">Attached To</th>
            <th className="py-3 px-3 hidden lg:table-cell">Uploaded By</th>
            <th
              onClick={() => handleSort('created_at')}
              className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors hidden sm:table-cell"
            >
              Date {renderSortIcon('created_at')}
            </th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedFiles.map((item) => {
            const category = getFileTypeCategory(item.mime_type, item.file_name)
            const canUserDelete =
              canDelete ||
              item.uploader_id === currentUserId ||
              ['Owner', 'Admin'].includes(userRole)

            return (
              <tr
                key={item.id}
                onClick={() => onPreview && onPreview(item)}
                className="hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                {/* File Name */}
                <td className="py-3 px-4 max-w-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-secondary shrink-0">
                      {getCategoryIcon(item.mime_type, item.file_name)}
                    </div>
                    <span
                      className="font-medium text-foreground truncate group-hover:text-brand transition-colors"
                      title={item.file_name}
                    >
                      {item.file_name}
                    </span>
                  </div>
                </td>

                {/* Type Category */}
                <td className="py-3 px-3 hidden sm:table-cell">
                  <span className="capitalize text-muted-foreground">{category}</span>
                </td>

                {/* Size */}
                <td className="py-3 px-3 font-mono text-muted-foreground">
                  {formatFileSize(item.file_size)}
                </td>

                {/* Attached To */}
                <td className="py-3 px-3 hidden md:table-cell">
                  {item.project ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[150px]">
                      <FolderKanban className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span className="truncate">{item.project.name}</span>
                    </div>
                  ) : item.task_id ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[150px]">
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">Task</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </td>

                {/* Uploaded By */}
                <td className="py-3 px-3 hidden lg:table-cell">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={item.uploader?.avatar_url}
                      name={item.uploader?.full_name || item.uploader?.email || 'User'}
                      size="xs"
                    />
                    <span className="truncate max-w-[120px] text-muted-foreground">
                      {item.uploader?.full_name || item.uploader?.email?.split('@')[0] || 'Member'}
                    </span>
                  </div>
                </td>

                {/* Date */}
                <td className="py-3 px-3 text-muted-foreground hidden sm:table-cell">
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onPreview && onPreview(item)}
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      title="Preview File"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        downloadFile({
                          storagePath: item.storage_path,
                          fileName: item.file_name,
                          bucketId: item.bucket_id || 'workspace-files',
                        })
                      }
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      title="Download File"
                    >
                      <Download className="h-4 w-4" />
                    </button>

                    {canUserDelete && onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete File"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
