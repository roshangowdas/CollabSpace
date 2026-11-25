import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Loader2, AlertCircle, Save, AtSign, Sparkles, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/ui/Avatar'
import { profileSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'

export function EditProfileModal({ isOpen, onClose, onOpenAvatarModal }) {
  const { profile, user, updateProfile, checkUsername } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: true,
    message: '',
  })

  const currentFullName = profile?.full_name || user?.user_metadata?.full_name || ''
  const currentUsername =
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'user'
  const currentJobTitle = profile?.job_title || user?.user_metadata?.job_title || ''
  const currentBio = profile?.bio || user?.user_metadata?.bio || ''
  const currentAvatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: currentFullName,
      username: currentUsername,
      jobTitle: currentJobTitle,
      bio: currentBio,
      avatarUrl: currentAvatarUrl,
    },
  })

  // Synchronize defaults whenever profile changes or modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        fullName: currentFullName,
        username: currentUsername,
        jobTitle: currentJobTitle,
        bio: currentBio,
        avatarUrl: currentAvatarUrl,
      })
      setUsernameStatus({ checking: false, available: true, message: '' })
    }
  }, [isOpen, currentFullName, currentUsername, currentJobTitle, currentBio, currentAvatarUrl, reset])

  const watchedUsername = watch('username', currentUsername)
  const watchedBio = watch('bio', currentBio)
  const watchedFullName = watch('fullName', currentFullName)

  // Live debounced username uniqueness and validity check
  useEffect(() => {
    if (!watchedUsername || watchedUsername.trim() === '') {
      setUsernameStatus({ checking: false, available: false, message: 'Username is required' })
      return
    }

    const clean = watchedUsername.trim().toLowerCase()

    // If matches user's current username, it's always valid
    if (clean === currentUsername.toLowerCase()) {
      setUsernameStatus({ checking: false, available: true, message: 'Current username' })
      clearErrors('username')
      return
    }

    // Basic format check
    if (clean.length < 3 || clean.length > 30 || !/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Must be 3-30 letters, numbers or underscores',
      })
      return
    }

    let isMounted = true
    setUsernameStatus({ checking: true, available: false, message: 'Checking availability...' })

    const timeout = setTimeout(async () => {
      try {
        const result = await checkUsername(clean)
        if (!isMounted) return

        if (result.available) {
          setUsernameStatus({ checking: false, available: true, message: 'Username is available' })
          clearErrors('username')
        } else {
          setUsernameStatus({
            checking: false,
            available: false,
            message: result.reason || 'Username is already taken',
          })
          setError('username', {
            type: 'manual',
            message: result.reason || 'Username is already taken',
          })
        }
      } catch (err) {
        if (!isMounted) return
        setUsernameStatus({ checking: false, available: true, message: '' })
      }
    }, 400)

    return () => {
      isMounted = false
      clearTimeout(timeout)
    }
  }, [watchedUsername, currentUsername, checkUsername, setError, clearErrors])

  const onSubmit = async (values) => {
    if (!usernameStatus.available && watchedUsername !== currentUsername) {
      return
    }

    setIsSaving(true)
    try {
      await updateProfile({
        fullName: values.fullName.trim(),
        username: values.username.trim().toLowerCase(),
        jobTitle: values.jobTitle?.trim() || '',
        bio: values.bio?.trim() || '',
        avatarUrl: currentAvatarUrl,
      })

      toast.success('Profile saved successfully!')
      onClose()
    } catch (err) {
      toast.error('Failed to update profile', {
        description: err.message || 'Please verify the fields and try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Update your public profile details visible to your workspace team."
      size="default"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Avatar Mini Row */}
        <div className="flex items-center gap-4 rounded-lg bg-muted/40 p-3 border">
          <Avatar
            src={currentAvatarUrl}
            name={watchedFullName || 'User'}
            size="lg"
            className="ring-2 ring-background"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-foreground truncate">
              {watchedFullName || 'Your Name'}
            </h4>
            <p className="text-[11px] text-muted-foreground truncate font-mono">
              @{watchedUsername || 'username'}
            </p>
          </div>
          {onOpenAvatarModal && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => {
                onClose()
                onOpenAvatarModal()
              }}
            >
              Change Photo
            </Button>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-fullName">Full Name</Label>
          <Input
            id="edit-fullName"
            placeholder="e.g. Alex Rivera"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
        </div>

        {/* Username with live status indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-username">Workspace Handle</Label>
            {usernameStatus.checking ? (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-brand" />
                Checking...
              </span>
            ) : usernameStatus.available && watchedUsername ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="h-3 w-3" />
                Available
              </span>
            ) : usernameStatus.message ? (
              <span className="flex items-center gap-1 text-[11px] text-destructive">
                <AlertCircle className="h-3 w-3" />
                {usernameStatus.message}
              </span>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <AtSign className="h-4 w-4" />
            </div>
            <Input
              id="edit-username"
              className="pl-9 font-mono text-xs"
              placeholder="username"
              error={errors.username?.message}
              {...register('username')}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Your unique handle used for @mentions in tasks, docs, and channels.
          </p>
        </div>

        {/* Job Title */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-jobTitle">Job Title</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <Briefcase className="h-4 w-4" />
            </div>
            <Input
              id="edit-jobTitle"
              className="pl-9 text-xs"
              placeholder="e.g. Senior Full-Stack Engineer"
              error={errors.jobTitle?.message}
              {...register('jobTitle')}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Your professional role or title displayed across your team workspace.
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-bio">Bio</Label>
            <span className="text-[10px] text-muted-foreground font-mono">
              {(watchedBio || '').length} / 300
            </span>
          </div>
          <Textarea
            id="edit-bio"
            rows={3}
            maxLength={300}
            placeholder="Tell your team about your role, projects, or interests..."
            error={errors.bio?.message}
            {...register('bio')}
          />
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="sm"
            isLoading={isSaving}
            disabled={usernameStatus.checking || (!usernameStatus.available && watchedUsername !== currentUsername)}
            leftIcon={Save}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

