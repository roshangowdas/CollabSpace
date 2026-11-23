import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Paperclip,
  X,
  Loader2,
  CornerDownRight,
  Smile,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AttachmentPreview } from './AttachmentPreview'
import { cn } from '@/utils/cn'

export function MessageInput({
  onSendMessage,
  onUploadAttachment,
  onTyping = null,
  replyingTo = null,
  onCancelReply = null,
  placeholder = 'Type a message... (Shift+Enter for new line)',
  isSending = false,
  className,
}) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Focus textarea when replyingTo changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyingTo])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploadError(null)
    setIsUploading(true)

    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds the 10 MB limit.`)
        }
        if (onUploadAttachment) {
          const uploaded = await onUploadAttachment(file)
          setAttachments((prev) => [...prev, uploaded])
        }
      }
    } catch (err) {
      console.error('Attachment upload failed:', err)
      setUploadError(err.message || 'Failed to upload attachment.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if ((!content.trim() && attachments.length === 0) || isSending || isUploading) {
      return
    }

    onSendMessage({
      content: content.trim(),
      attachments,
      parentId: replyingTo?.id || null,
    })

    setContent('')
    setAttachments([])
    if (onCancelReply) onCancelReply()

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleInput = (e) => {
    setContent(e.target.value)
    if (onTyping) onTyping()
    // Auto-grow textarea up to max-height
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  return (
    <div className={cn('relative rounded-xl border border-border bg-card shadow-subtle p-2 space-y-2', className)}>
      {/* Reply Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-secondary/70 border border-border/80 text-xs text-muted-foreground animate-in fade-in-50">
          <div className="flex items-center gap-2 min-w-0">
            <CornerDownRight className="h-3.5 w-3.5 text-brand shrink-0" />
            <span className="font-semibold text-foreground truncate">
              Replying to @{replyingTo.sender?.username || replyingTo.sender?.full_name || 'Member'}:
            </span>
            <span className="truncate max-w-xs">{replyingTo.content}</span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-2"
            title="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="px-1">
          <AttachmentPreview
            attachments={attachments}
            onRemove={handleRemoveAttachment}
            isRemovable={true}
          />
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="text-[11px] text-destructive px-2 py-1 bg-destructive/10 rounded-md">
          {uploadError}
        </div>
      )}

      {/* Main Input Controls */}
      <div className="flex items-end gap-2">
        {/* Attachment Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending}
          className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
          title="Attach file (Images, Documents, Code up to 10MB)"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSending}
          className="flex-1 max-h-40 min-h-[38px] resize-none bg-transparent py-2 px-1 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden leading-relaxed"
        />

        {/* Send Button */}
        <Button
          type="button"
          variant="brand"
          size="sm"
          onClick={handleSubmit}
          disabled={(!content.trim() && attachments.length === 0) || isSending || isUploading}
          className="shrink-0 h-9 w-9 p-0 rounded-lg"
          title="Send message"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

