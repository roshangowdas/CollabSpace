import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Key,
  ShieldCheck,
  Calendar,
  LogOut,
  Edit3,
  Camera,
  AtSign,
  Settings as SettingsIcon,
  Sparkles,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { resetPasswordSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Avatar,
  Badge,
  PasswordStrengthIndicator,
} from '@/components/ui'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { AvatarUploadModal } from '@/components/profile/AvatarUploadModal'
import { AvatarUploader } from '@/components/profile/AvatarUploader'

export function ProfilePage() {
  const navigate = useNavigate()
  const {
    user,
    profile,
    updateUserPassword,
    uploadAvatarFile,
    removeAvatarFile,
    logout,
    isDemoUser,
  } = useAuth()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'
  const username =
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'user'
  const userEmail = profile?.email || user?.email || 'user@collabspace.app'
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  const bio = profile?.bio || user?.user_metadata?.bio || ''

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const watchedNewPassword = watchPassword('password', '')

  const onChangePassword = async (values) => {
    setIsUpdatingPassword(true)
    setPasswordSuccess(false)

    try {
      await updateUserPassword(values.password)
      setPasswordSuccess(true)
      resetPasswordForm()
      toast.success('Password updated successfully!')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      toast.error('Failed to change password', {
        description: err.message,
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleInlineAvatarUpload = async (file) => {
    setIsUploadingAvatar(true)
    try {
      await uploadAvatarFile(file)
      toast.success('Profile avatar updated!')
    } catch (err) {
      toast.error('Upload failed', { description: err.message })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleInlineAvatarRemove = async () => {
    try {
      await removeAvatarFile()
    } catch (err) {
      toast.error('Failed to remove avatar', { description: err.message })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Profile</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your personal identity, bio, team avatar, and account security.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/settings">
              <Button variant="outline" size="sm" leftIcon={SettingsIcon}>
                Settings
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout} leftIcon={LogOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Hero Profile Card */}
        <Card className="overflow-hidden border shadow-card">
          <div className="h-28 bg-gradient-to-r from-brand/20 via-primary/10 to-brand/5 border-b" />
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              {/* Avatar with Camera Overlay Trigger */}
              <div className="relative group">
                <Avatar
                  src={avatarUrl}
                  name={displayName}
                  size="2xl"
                  status="online"
                  className="ring-4 ring-background shadow-modal"
                />
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 rounded-full bg-brand p-1.5 text-white shadow-md hover:bg-brand-hover transition-colors cursor-pointer"
                  title="Change avatar photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="brand"
                  size="sm"
                  leftIcon={Edit3}
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Upload}
                  onClick={() => setIsAvatarModalOpen(true)}
                >
                  Change Photo
                </Button>
              </div>
            </div>

            {/* Profile Summary Information */}
            <div className="space-y-3 text-center sm:text-left">
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                  <Badge variant="brand" size="sm" className="font-mono text-xs">
                    @{username}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {profile?.role || 'Member'}
                  </Badge>
                  {isDemoUser && (
                    <Badge variant="warning" size="sm" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Demo User
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
              </div>

              {/* Bio Box */}
              <div className="max-w-2xl">
                {bio ? (
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border">
                    {bio}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded-lg border border-dashed">
                    No bio added yet. Click "Edit Profile" to tell your team what you're working on.
                  </p>
                )}
              </div>

              {/* Badges / Timestamps */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Joined{' '}
                    {new Date(profile?.created_at || user?.created_at || Date.now()).toLocaleDateString(
                      undefined,
                      { year: 'numeric', month: 'short', day: 'numeric' }
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px]">collabspace.app/@{username}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Content Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Avatar & Storage Management */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Camera className="h-4 w-4 text-brand" />
                  <span>Profile Photo</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Stored securely in Supabase Storage (`avatars` bucket).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvatarUploader
                  currentAvatarUrl={avatarUrl}
                  userName={displayName}
                  onUpload={handleInlineAvatarUpload}
                  onRemove={handleInlineAvatarRemove}
                  isUploading={isUploadingAvatar}
                />
              </CardContent>
            </Card>

            <Card className="p-4 bg-muted/20 border-dashed text-xs text-muted-foreground space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand" />
                <span>Security & Privacy</span>
              </div>
              <p className="leading-relaxed">
                Your profile is stored in PostgreSQL and secured with Row Level Security policies. Only you can modify your personal profile and avatar.
              </p>
            </Card>
          </div>

          {/* Right Column: Password & Identity Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Profile Fields Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-brand" />
                    <span>Personal Details</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    leftIcon={Edit3}
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Edit
                  </Button>
                </CardTitle>
                <CardDescription>
                  Your public profile details used across team channels and tasks.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Display Name</span>
                    <p className="text-xs font-semibold text-foreground">{displayName}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Username / Handle</span>
                    <p className="text-xs font-mono font-semibold text-brand">@{username}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Work Email</span>
                    <p className="text-xs font-semibold text-foreground truncate">{userEmail}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Workspace Role</span>
                    <div>
                      <Badge variant="secondary" size="sm">
                        {profile?.role || 'Member'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t">
                  <span className="text-[11px] text-muted-foreground">Bio</span>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {bio || 'No bio provided.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Form */}
            <Card>
              <form onSubmit={handlePasswordSubmit(onChangePassword)}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-4 w-4 text-brand" />
                    <span>Change Password</span>
                  </CardTitle>
                  <CardDescription>
                    Update your account password stored via Supabase Auth.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {passwordSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Password changed successfully!</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="change-password">New Password</Label>
                    <Input
                      id="change-password"
                      type="password"
                      placeholder="Enter new password"
                      leftIcon={Lock}
                      allowPasswordToggle
                      error={passwordErrors.password?.message}
                      {...registerPassword('password')}
                    />
                    <PasswordStrengthIndicator password={watchedNewPassword} />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="change-confirm-password">Confirm New Password</Label>
                    <Input
                      id="change-confirm-password"
                      type="password"
                      placeholder="Re-enter new password"
                      leftIcon={Lock}
                      allowPasswordToggle
                      error={passwordErrors.confirmPassword?.message}
                      {...registerPassword('confirmPassword')}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end border-t pt-4">
                  <Button
                    type="submit"
                    variant="brand"
                    size="sm"
                    isLoading={isUpdatingPassword}
                  >
                    Update Password
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
      />

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </div>
  )
}
