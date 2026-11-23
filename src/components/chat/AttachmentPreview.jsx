import React from 'react'
import {
  FileText,
  Image as ImageIcon,
  FileCode,
  FileArchive,
  Download,
  ExternalLink,
  X,
} from 'lucide-react'
import { cn } from '@/utils/cn'

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type, name = '') {
  if (type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) {
    return ImageIcon
  }
  if (type === 'application/pdf' || /\.pdf$/i.test(name)) {
    return FileText
  }
  if (type?.includes('zip') || /\.(zip|tar|gz|rar)$/i.test(name)) {
    return FileArchive
  }
  if (type?.includes('json') || type?.includes('javascript') || /\.(json|js|jsx|ts|tsx|html|css)$/i.test(name)) {
    return FileCode
  }
  return FileText
}

export function AttachmentPreview({
  attachments = [],
  onRemove = null,
  isRemovable = false,
  className,
}) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2.5 mt-2', className)}>
      {attachments.map((att, idx) => {
        const isImage = att.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.name)
        const IconComponent = getFileIcon(att.type, att.name)

        if (isImage && att.url) {
          return (
            <div
              key={att.id || idx}
              className="relative group rounded-xl overflow-hidden border border-border bg-muted/30 shadow-subtle max-w-xs"
            >
              <img
                src={att.url}
                alt={att.name || 'Attachment'}
                className="max-h-56 w-auto object-cover rounded-lg cursor-pointer transition-transform duration-200 group-hover:scale-102"
                onClick={() => window.open(att.url, '_blank')}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto p-1.5 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors"
                  title="Open full size"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              {isRemovable && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/90 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-xs"
                  title="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        }

        return (
          <div
            key={att.id || idx}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/80 bg-secondary/50 hover:bg-secondary transition-colors text-xs shadow-subtle group max-w-sm"
          >
            <div className="p-1.5 rounded-md bg-brand/10 text-brand">
              <IconComponent className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate max-w-[200px]" title={att.name}>
                {att.name}
              </p>
              {att.size && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  {formatBytes(att.size)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1">
              {att.url && (
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.name}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  title="Download file"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              )}
              {isRemovable && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

