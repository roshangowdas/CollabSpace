import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { AvatarUploader } from './AvatarUploader'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function AvatarUploadModal({ isOpen, onClose }) {
  const { profile, user, uploadAvatarFile, removeAvatarFile } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

  const currentAvatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'

  const handleUpload = async (file) => {
    setIsUploading(true)
    try {
      await uploadAvatarFile(file)
      toast.success('Profile photo updated successfully!')
      onClose()
    } catch (err) {
      toast.error('Avatar upload failed', {
        description: err.message || 'Please check your file and network connection.',
      })
      throw err
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    setIsUploading(true)
    try {
      await removeAvatarFile()
      onClose()
    } catch (err) {
      toast.error('Failed to remove avatar', {
        description: err.message,
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Profile Photo"
      description="Upload a custom photo or avatar for your team workspace."
      size="default"
    >
      <div className="pt-2">
        <AvatarUploader
          currentAvatarUrl={currentAvatarUrl}
          userName={displayName}
          onUpload={handleUpload}
          onRemove={handleRemove}
          isUploading={isUploading}
        />
      </div>
    </Modal>
  )
}

