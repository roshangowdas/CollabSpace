// ==============================================================================
// CollabSpace Component: TaskAttachmentsSection
// File: src/components/file/TaskAttachmentsSection.jsx
// Description:
//   Task-level file attachments management inside TaskDetailsDrawer.
//   Supports drag-and-drop file upload, file preview, download, and deletion.
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  Paperclip,
  Plus,
  Loader2,
  File,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Download,
  Eye,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FilePreviewModal } from './FilePreviewModal'
import { FileUploadDropzone } from './FileUploadDropzone'
import {
  getTaskAttachments,
  deleteAttachment,
  formatFileSize,
  getFileTypeCategory,
  downloadFile,
} from '@/services/files'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'

export function TaskAttachmentsSection({ task, workspaceId }) {
  const { user } = useAuth()
  const { role } = useWorkspace()
  const [attachments, setAttachments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadDropzone, setShowUploadDropzone] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState(null)

  const loadAttachments = useCallback(async () => {
    if (!task?.id) return
    setIsLoading(true)
    try {
      const data = await getTaskAttachments(task.id)
      setAttachments(data || [])
    } catch (err) {
      console.error('Failed to load task attachments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [task?.id])

  useEffect(() => {
    loadAttachments()
  }, [loadAttachments])

  const handleUploadSuccess = (newAttachment) => {
    setAttachments((prev) => [newAttachment, ...prev])
  }

  const handleDelete = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return
    try {
      await deleteAttachment(attachmentId, user?.id, role)
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
      if (selectedPreview?.id === attachmentId) {
        setSelectedPreview(null)
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    }
  }

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

  return (
    <div className="space-y-3 pt-4 border-t border-border">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Attachments {attachments.length > 0 && `(${attachments.length})`}
          </h4>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUploadDropzone(!showUploadDropzone)}
          className="h-7 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {showUploadDropzone ? 'Hide Upload' : 'Add File'}
        </Button>
      </div>

      {/* Upload Dropzone */}
      {showUploadDropzone && (
        <FileUploadDropzone
          compact
          workspaceId={workspaceId || task.workspace_id}
          projectId={task.project_id}
          taskId={task.id}
          userId={user?.id}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Attachments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-muted-foreground gap-2 text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Loading attachments...</span>
        </div>
      ) : attachments.length === 0 ? (
        !showUploadDropzone && (
          <div className="p-3 rounded-lg border border-dashed border-border/80 text-center bg-muted/10">
            <p className="text-xs text-muted-foreground">
              No files attached to this task yet.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => {
            const isUploader = att.uploader_id === user?.id
            const canUserDelete = isUploader || ['Owner', 'Admin'].includes(role)

            return (
              <div
                key={att.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/70 hover:bg-muted/30 transition-colors text-xs group"
              >
                <div
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => setSelectedPreview(att)}
                >
                  <div className="p-1.5 rounded-md bg-secondary shrink-0">
                    {getCategoryIcon(att.mime_type, att.file_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate group-hover:text-brand transition-colors" title={att.file_name}>
                      {att.file_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatFileSize(att.file_size)} • {new Date(att.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPreview(att)}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Preview file"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile({
                        storagePath: att.storage_path,
                        fileName: att.file_name,
                        bucketId: att.bucket_id || 'workspace-files',
                      })
                    }
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Download file"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  {canUserDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete attachment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* File Preview Modal */}
      {selectedPreview && (
        <FilePreviewModal
          isOpen={Boolean(selectedPreview)}
          onClose={() => setSelectedPreview(null)}
          attachment={selectedPreview}
          canDelete={
            selectedPreview.uploader_id === user?.id || ['Owner', 'Admin'].includes(role)
          }
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
