import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  User,
  Shield,
  Key,
  Bell,
  Sun,
  Moon,
  Laptop,
  Lock,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Edit3,
  Mail,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
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
  Switch,
  PasswordStrengthIndicator,
} from '@/components/ui'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { AvatarUploadModal } from '@/components/profile/AvatarUploadModal'
import { resetPasswordSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'

export function AccountSettingsPage() {
  const { user, profile, updateUserPassword, logout, isDemoUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    mentions: true,
    taskAssigned: true,
    channelActivity: false,
    weeklyDigest: true,
  })

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'
  const username =
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'user'
  const userEmail = profile?.email || user?.email || 'user@collabspace.app'
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  const bio = profile?.bio || user?.user_metadata?.bio || 'No bio provided yet.'

  // Password Update Form
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

  const onUpdatePassword = async (values) => {
    setIsUpdatingPassword(true)
    setPasswordSuccess(false)
    try {
      await updateUserPassword(values.password)
      setPasswordSuccess(true)
      resetPasswordForm()
      toast.success('Password updated successfully!')
      setTimeout(() => setPasswordSuccess(false), 4000)
    } catch (err) {
      toast.error('Failed to change password', {
        description: err.message,
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const toggleNotification = (key) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      toast.success('Notification settings saved')
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your personal identity, security credentials, and workspace preferences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/profile">
              <Button variant="outline" size="sm">
                View Public Profile
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={logout} leftIcon={LogOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Settings Layout with Sidebar Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings Navigation Menu */}
          <div className="space-y-1 md:col-span-1">
            <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left w-full cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-brand text-white shadow-subtle'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span>Profile & Identity</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left w-full cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-brand text-white shadow-subtle'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Shield className="h-4 w-4 shrink-0" />
                <span>Security & Password</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left w-full cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-brand text-white shadow-subtle'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Bell className="h-4 w-4 shrink-0" />
                <span>Notifications</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left w-full cursor-pointer ${
                  activeTab === 'appearance'
                    ? 'bg-brand text-white shadow-subtle'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Sun className="h-4 w-4 shrink-0" />
                <span>Theme & Appearance</span>
              </button>
            </nav>
          </div>

          {/* Main Settings Panel */}
          <div className="md:col-span-3 space-y-6">
            {/* TAB 1: Profile & Identity */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Profile Details</span>
                    <Button
                      variant="outline"
                      size="xs"
                      leftIcon={Edit3}
                      onClick={() => setIsEditProfileOpen(true)}
                    >
                      Edit Profile
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Your public persona visible to other members across workspaces.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Avatar & Summary Card */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-muted/40 border">
                    <div className="relative group">
                      <Avatar
                        src={avatarUrl}
                        name={displayName}
                        size="2xl"
                        status="online"
                        className="ring-2 ring-background"
                      />
                      <button
                        type="button"
                        onClick={() => setIsAvatarModalOpen(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-medium"
                      >
                        Change
                      </button>
                    </div>

                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h3 className="font-semibold text-base text-foreground">{displayName}</h3>
                        <Badge variant="brand" size="sm" className="font-mono text-[10px]">
                          @{username}
                        </Badge>
                        <Badge variant="secondary" size="sm">
                          {profile?.role || 'Member'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                      <p className="text-xs text-foreground/80 pt-1 italic line-clamp-2">
                        "{bio}"
                      </p>
                    </div>

                    <div className="shrink-0 flex sm:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={Upload}
                        onClick={() => setIsAvatarModalOpen(true)}
                      >
                        Upload Photo
                      </Button>
                    </div>
                  </div>

                  {/* Profile Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-lg border bg-card space-y-1">
                      <span className="text-[11px] text-muted-foreground">Full Display Name</span>
                      <p className="text-xs font-medium text-foreground">{displayName}</p>
                    </div>

                    <div className="p-3.5 rounded-lg border bg-card space-y-1">
                      <span className="text-[11px] text-muted-foreground">Workspace Handle</span>
                      <p className="text-xs font-mono font-medium text-foreground">@{username}</p>
                    </div>

                    <div className="p-3.5 rounded-lg border bg-card space-y-1">
                      <span className="text-[11px] text-muted-foreground">Work Email</span>
                      <p className="text-xs font-medium text-foreground truncate">{userEmail}</p>
                    </div>

                    <div className="p-3.5 rounded-lg border bg-card space-y-1">
                      <span className="text-[11px] text-muted-foreground">Member Since</span>
                      <p className="text-xs font-medium text-foreground">
                        {new Date(profile?.created_at || user?.created_at || Date.now()).toLocaleDateString(
                          undefined,
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: Security & Password */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card>
                  <form onSubmit={handlePasswordSubmit(onUpdatePassword)}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Key className="h-4 w-4 text-brand" />
                        <span>Update Password</span>
                      </CardTitle>
                      <CardDescription>
                        Ensure your account is protected with a strong, distinct password.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {passwordSuccess && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Password updated successfully!</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label htmlFor="settings-password">New Password</Label>
                        <Input
                          id="settings-password"
                          type="password"
                          placeholder="Enter new password"
                          leftIcon={Lock}
                          allowPasswordToggle
                          error={passwordErrors.password?.message}
                          {...registerPassword('password')}
                        />
                        <PasswordStrengthIndicator password={watchedNewPassword} />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="settings-confirm-password">Confirm New Password</Label>
                        <Input
                          id="settings-confirm-password"
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
                        Change Password
                      </Button>
                    </CardFooter>
                  </form>
                </Card>

                {/* Session & Auth Information */}
                <Card className="p-4 bg-muted/20 border text-xs space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4 text-brand" />
                    <span>Supabase Authentication Security</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Passwords are securely hashed using cryptographic standard algorithms by Supabase Auth and never stored in plain text. Session tokens are refreshed automatically.
                  </p>
                </Card>
              </div>
            )}

            {/* TAB 3: Notifications */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-brand" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Choose what alerts and summaries you receive from CollabSpace.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground">Direct @Mentions</span>
                      <p className="text-[11px] text-muted-foreground">
                        Receive alerts when teammates tag @{username} in comments or chats.
                      </p>
                    </div>
                    <Switch
                      checked={notifications.mentions}
                      onChange={() => toggleNotification('mentions')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground">Task Assignments</span>
                      <p className="text-[11px] text-muted-foreground">
                        Get notified when an issue or Kanban card is assigned to you.
                      </p>
                    </div>
                    <Switch
                      checked={notifications.taskAssigned}
                      onChange={() => toggleNotification('taskAssigned')}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground">Weekly Digest</span>
                      <p className="text-[11px] text-muted-foreground">
                        A summary of completed milestones and upcoming project deliverables.
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyDigest}
                      onChange={() => toggleNotification('weeklyDigest')}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 4: Theme & Appearance */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sun className="h-4 w-4 text-brand" />
                    <span>Appearance & Theme</span>
                  </CardTitle>
                  <CardDescription>
                    Customize your interface contrast and visual theme.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => document.documentElement.classList.remove('dark')}
                      className="p-4 rounded-xl border text-center space-y-2 hover:border-brand transition-all cursor-pointer bg-white text-zinc-900 shadow-sm"
                    >
                      <Sun className="h-6 w-6 mx-auto text-amber-500" />
                      <div className="text-xs font-semibold">Light Mode</div>
                      <p className="text-[10px] text-zinc-500">Clean, crisp high-contrast daylight</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => document.documentElement.classList.add('dark')}
                      className="p-4 rounded-xl border text-center space-y-2 hover:border-brand transition-all cursor-pointer bg-zinc-900 text-white shadow-sm"
                    >
                      <Moon className="h-6 w-6 mx-auto text-brand" />
                      <div className="text-xs font-semibold">Dark Mode</div>
                      <p className="text-[10px] text-zinc-400">Low-glare workspace for evening focus</p>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
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

