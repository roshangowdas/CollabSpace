// ==============================================================================
// CollabSpace Component: FileUploadDropzone
// File: src/components/file/FileUploadDropzone.jsx
// Description:
//   Drag-and-drop file upload target with client-side validation (size & executable checks),
//   real-time upload progress bars, and private Supabase Storage delivery.
// ==============================================================================

import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  File,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  uploadFile,
  validateFile,
  formatFileSize,
  getFileTypeCategory,
  MAX_FILE_SIZE_BYTES,
} from '@/services/files'
import { cn } from '@/utils/cn'

export function FileUploadDropzone({
  workspaceId,
  projectId = null,
  taskId = null,
  userId,
  onUploadSuccess = null,
  onUploadError = null,
  compact = false,
  className = '',
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadQueue, setUploadQueue] = useState([])
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
      // Reset input value to allow re-uploading same file if desired
      e.target.value = ''
    }
  }

  const handleFiles = async (files) => {
    for (const file of files) {
      const queueId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

      // 1. Client-side security check
      const validation = validateFile(file)
      if (!validation.valid) {
        setUploadQueue((prev) => [
          {
            id: queueId,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'error',
            error: validation.error,
          },
          ...prev,
        ])
        if (onUploadError) onUploadError(validation.error)
        continue
      }

      // 2. Add to active queue
      const queueItem = {
        id: queueId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 10,
        status: 'uploading',
        error: null,
      }

      setUploadQueue((prev) => [queueItem, ...prev])

      try {
        const attachment = await uploadFile({
          file,
          workspaceId,
          projectId,
          taskId,
          userId,
          onProgress: (percent) => {
            setUploadQueue((prev) =>
              prev.map((item) => (item.id === queueId ? { ...item, progress: percent } : item))
            )
          },
        })

        // 3. Mark success
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId ? { ...item, progress: 100, status: 'success', attachment } : item
          )
        )

        if (onUploadSuccess) {
          onUploadSuccess(attachment)
        }
      } catch (err) {
        console.error('File upload failed:', err)
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId ? { ...item, status: 'error', error: err.message || 'Upload failed' } : item
          )
        )
        if (onUploadError) {
          onUploadError(err.message)
        }
      }
    }
  }

  const removeQueueItem = (id) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id))
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
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 border-dashed rounded-xl',
          compact ? 'p-4' : 'p-6 sm:p-8',
          isDragOver
            ? 'border-brand bg-brand/5 scale-[0.99]'
            : 'border-border/80 hover:border-brand/50 hover:bg-muted/30 bg-card'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              'rounded-full flex items-center justify-center transition-colors',
              compact ? 'p-2 bg-brand/10 text-brand' : 'p-3.5 bg-brand/10 text-brand',
              isDragOver && 'bg-brand text-white'
            )}
          >
            <UploadCloud className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
          </div>

          <div>
            <p className="text-xs sm:text-sm font-medium text-foreground">
              {isDragOver ? (
                'Drop files to upload immediately'
              ) : (
                <>
                  <span className="text-brand font-semibold hover:underline">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Supports Images, PDFs, Documents, Code & Archives up to {formatFileSize(MAX_FILE_SIZE_BYTES)}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {uploadQueue.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 mr-3 flex-1">
                <div className="p-1.5 rounded-md bg-secondary shrink-0">
                  {getCategoryIcon(item.type, item.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground truncate block" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                      {formatFileSize(item.size)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {item.status === 'uploading' && (
                    <div className="w-full bg-secondary h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-brand h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error state */}
                  {item.status === 'error' && (
                    <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span className="truncate">{item.error || 'Failed to upload'}</span>
                    </p>
                  )}

                  {/* Success state */}
                  {item.status === 'success' && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>Uploaded securely to workspace-files</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-brand" />
                )}
                <button
                  type="button"
                  onClick={() => removeQueueItem(item.id)}
                  className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
