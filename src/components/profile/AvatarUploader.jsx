import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_FILE_SIZE } from '@/services/profiles'
import { cn } from '@/utils/cn'

export function AvatarUploader({
  currentAvatarUrl,
  userName = 'User',
  onUpload,
  onRemove,
  isUploading = false,
  className,
}) {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [validationError, setValidationError] = useState('')
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateFile = (file) => {
    setValidationError('')
    if (!file) return false

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setValidationError('Please select a valid image file (JPG, PNG, WEBP, or GIF).')
      return false
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      setValidationError(`Selected file is ${sizeMb} MB. Maximum allowed size is 5 MB.`)
      return false
    }

    return true
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        processSelectedFile(file)
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        processSelectedFile(file)
      }
    }
  }

  const processSelectedFile = (file) => {
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile) return
    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err) {
      setValidationError(err.message || 'Upload failed. Please try again.')
    }
  }

  const handleCancelSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setValidationError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayAvatar = previewUrl || currentAvatarUrl

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Avatar Circular Preview */}
        <div className="relative group shrink-0">
          <Avatar
            src={displayAvatar}
            name={userName}
            size="2xl"
            className="ring-4 ring-muted shadow-card"
          />
          {selectedFile && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white text-[10px] font-bold shadow-sm">
              ✓
            </span>
          )}
        </div>

        {/* Upload Controls & Actions */}
        <div className="flex-1 w-full space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {!selectedFile ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Upload New Photo
                </Button>

                {currentAvatarUrl && onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={onRemove}
                    disabled={isUploading}
                  >
                    Remove
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  isLoading={isUploading}
                  leftIcon={CheckCircle}
                  onClick={handleConfirmUpload}
                >
                  Confirm Upload
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={X}
                  onClick={handleCancelSelection}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Recommended: Square JPG, PNG, or WEBP. Max size 5 MB.
          </p>
        </div>
      </div>

      {/* Drag & Drop Target Area */}
      {!selectedFile && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-all cursor-pointer',
            dragActive
              ? 'border-brand bg-brand/5 scale-[1.01]'
              : 'border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/30'
          )}
        >
          <ImageIcon className="h-6 w-6 text-muted-foreground mb-1.5" />
          <p className="text-xs font-medium text-foreground">
            Drag & drop your picture here, or <span className="text-brand underline">browse</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            PNG, JPG, WEBP, GIF up to 5MB
          </p>
        </div>
      )}

      {/* Validation Error Message */}
      {validationError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  )
}

