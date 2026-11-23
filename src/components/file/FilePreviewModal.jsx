// ==============================================================================
// CollabSpace Component: FilePreviewModal
// File: src/components/file/FilePreviewModal.jsx
// Description:
//   Modal for previewing supported file formats (Images, PDFs, Text/Code, Audio/Video)
//   using temporary signed URLs for private files, with download and delete controls.
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  X,
  Download,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  File,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import {
  getFileDownloadUrl,
  downloadFile,
  formatFileSize,
  getFileTypeCategory,
} from '@/services/files'

export function FilePreviewModal({
  isOpen,
  onClose,
  attachment,
  canDelete = false,
  onDelete = null,
}) {
  const [signedUrl, setSignedUrl] = useState(null)
  const [isLoadingUrl, setIsLoadingUrl] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [textContent, setTextContent] = useState(null)
  const [isLoadingText, setIsLoadingText] = useState(false)

  const category = attachment ? getFileTypeCategory(attachment.mime_type, attachment.file_name) : 'other'

  useEffect(() => {
    let active = true
    if (!isOpen || !attachment) {
      setSignedUrl(null)
      setTextContent(null)
      setZoomLevel(1)
      setRotation(0)
      return
    }

    async function loadSignedUrl() {
      setIsLoadingUrl(true)
      setLoadError(null)

      try {
        if (attachment.preview_url) {
          if (active) {
            setSignedUrl(attachment.preview_url)
            setIsLoadingUrl(false)
          }
          return
        }

        const { signedUrl } = await getFileDownloadUrl(
          attachment.storage_path,
          attachment.bucket_id || 'workspace-files',
          3600 // 1 hour validity
        )

        if (active) {
          setSignedUrl(signedUrl)
          setIsLoadingUrl(false)

          // If text or code, attempt to fetch content for in-browser rendering
          if (category === 'code' || attachment.mime_type?.startsWith('text/')) {
            fetchTextContent(signedUrl)
          }
        }
      } catch (err) {
        if (active) {
          console.error('Failed to resolve signed URL for preview:', err)
          setLoadError('Failed to generate secure preview URL. Please try downloading directly.')
          setIsLoadingUrl(false)
        }
      }
    }

    async function fetchTextContent(url) {
      if (!url || url.startsWith('http') === false) return
      setIsLoadingText(true)
      try {
        const res = await fetch(url)
        if (res.ok) {
          const text = await res.text()
          if (active) setTextContent(text)
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (active) setIsLoadingText(false)
      }
    }

    loadSignedUrl()

    return () => {
      active = false
    }
  }, [isOpen, attachment, category])

  if (!isOpen || !attachment) return null

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await downloadFile({
        storagePath: attachment.storage_path,
        fileName: attachment.file_name,
        bucketId: attachment.bucket_id || 'workspace-files',
      })
    } catch (err) {
      console.error('Download error:', err)
      // Fallback to direct signed url if download helper fails
      if (signedUrl) {
        window.open(signedUrl, '_blank')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!signedUrl) return
    try {
      await navigator.clipboard.writeText(signedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!window.confirm(`Are you sure you want to delete "${attachment.file_name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(attachment.id)
      onClose()
    } catch (err) {
      alert(`Delete failed: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-50 flex flex-col w-full max-w-4xl h-[90vh] max-h-[850px] bg-card rounded-xl border border-border shadow-modal overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0 mr-4">
            <div className="p-2 rounded-lg bg-secondary shrink-0 text-foreground">
              {category === 'image' && <File className="h-5 w-5 text-blue-500" />}
              {category === 'pdf' && <FileText className="h-5 w-5 text-rose-500" />}
              {category === 'spreadsheet' && <FileSpreadsheet className="h-5 w-5 text-emerald-500" />}
              {category === 'code' && <FileCode className="h-5 w-5 text-cyan-500" />}
              {category === 'archive' && <FileArchive className="h-5 w-5 text-amber-500" />}
              {category === 'other' && <File className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate" title={attachment.file_name}>
                {attachment.file_name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{formatFileSize(attachment.file_size)}</span>
                <span>•</span>
                <span className="capitalize">{category}</span>
                {attachment.uploader && (
                  <>
                    <span>•</span>
                    <span className="truncate">by {attachment.uploader.full_name || attachment.uploader.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {signedUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                title="Copy temporary signed URL"
                className="hidden sm:inline-flex"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
            )}

            <Button
              variant="brand"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              Download
            </Button>

            {canDelete && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                title="Delete file"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-muted/30 overflow-auto p-4 flex items-center justify-center relative">
          {isLoadingUrl ? (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="text-xs">Generating secure preview token...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
              <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Preview Unavailable</p>
              <p className="text-xs text-muted-foreground mb-4">{loadError}</p>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download to View
              </Button>
            </div>
          ) : (
            <>
              {/* IMAGE PREVIEW */}
              {category === 'image' && signedUrl && (
                <div className="flex flex-col items-center justify-center w-full h-full relative">
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur-xs p-1 rounded-md border border-border shadow-xs z-10">
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary"
                      title="Rotate"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="overflow-auto max-w-full max-h-full flex items-center justify-center p-2">
                    <img
                      src={signedUrl}
                      alt={attachment.file_name}
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="max-h-[70vh] max-w-full object-contain rounded-md shadow-xs select-none"
                    />
                  </div>
                </div>
              )}

              {/* PDF PREVIEW */}
              {category === 'pdf' && signedUrl && (
                <div className="w-full h-full flex flex-col rounded-lg overflow-hidden border border-border bg-white">
                  <iframe
                    src={`${signedUrl}#toolbar=1`}
                    title={attachment.file_name}
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* TEXT / CODE PREVIEW */}
              {category === 'code' && (
                <div className="w-full h-full flex flex-col bg-background rounded-lg border border-border overflow-hidden">
                  <div className="px-4 py-2 border-b border-border bg-muted/40 flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>{attachment.file_name}</span>
                    <span>{formatFileSize(attachment.file_size)}</span>
                  </div>
                  <div className="flex-1 p-4 overflow-auto font-mono text-xs text-foreground bg-card">
                    {isLoadingText ? (
                      <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading file contents...</span>
                      </div>
                    ) : textContent !== null ? (
                      <pre className="whitespace-pre-wrap break-all leading-relaxed">
                        <code>{textContent}</code>
                      </pre>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground mb-3">Click below to open or download raw text</p>
                        <Button variant="outline" size="sm" onClick={handleDownload}>
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AUDIO / VIDEO PREVIEW */}
              {category === 'media' && signedUrl && (
                <div className="flex flex-col items-center justify-center p-6 w-full max-w-2xl">
                  {attachment.mime_type?.startsWith('video/') ? (
                    <video
                      controls
                      src={signedUrl}
                      className="max-h-[60vh] w-full rounded-lg shadow-md bg-black"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <audio controls src={signedUrl} className="w-full max-w-md">
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>
              )}

              {/* OTHER / BINARY FORMATS */}
              {['spreadsheet', 'document', 'archive', 'other'].includes(category) && (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-card rounded-xl border border-border shadow-xs">
                  <div className="p-4 rounded-full bg-secondary/80 text-foreground mb-4">
                    {category === 'spreadsheet' && <FileSpreadsheet className="h-12 w-12 text-emerald-500" />}
                    {category === 'document' && <FileText className="h-12 w-12 text-blue-500" />}
                    {category === 'archive' && <FileArchive className="h-12 w-12 text-amber-500" />}
                    {category === 'other' && <File className="h-12 w-12 text-muted-foreground" />}
                  </div>

                  <h4 className="text-base font-semibold text-foreground mb-1">
                    {attachment.file_name}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-1">
                    {formatFileSize(attachment.file_size)} • {attachment.mime_type || 'Unknown MIME type'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mb-6">
                    Direct browser preview is not supported for this file format. You can securely download and open it in your local software.
                  </p>

                  <Button variant="brand" onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download to Your Device
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-5 py-2.5 bg-card border-t border-border flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Encrypted Supabase Private Bucket ({attachment.bucket_id || 'workspace-files'})</span>
          </div>
          <span>Storage path: {attachment.storage_path}</span>
        </div>
      </div>
    </div>
  )
}
