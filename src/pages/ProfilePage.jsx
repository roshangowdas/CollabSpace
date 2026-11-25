import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  LogOut,
  Edit3,
  Camera,
  AtSign,
  Briefcase,
  Layers,
  FolderGit2,
  ListTodo,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Upload,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { getUserProfileStats } from '@/services/profiles'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Avatar,
  Badge,
} from '@/components/ui'
import { EditProfileModal } from '@/components/profile/EditProfileModal'
import { AvatarUploadModal } from '@/components/profile/AvatarUploadModal'

export function ProfilePage() {
  const navigate = useNavigate()
  const {
    user,
    profile,
    uploadAvatarFile,
    removeAvatarFile,
    logout,
    isDemoUser,
    isLoading: isAuthLoading,
  } = useAuth()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)

  // Real-time Work Statistics from Supabase
  const [stats, setStats] = useState({
    workspacesCount: 0,
    projectsCount: 0,
    assignedTasksCount: 0,
    completedTasksCount: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState(null)

  // User identity information extracted from Supabase Auth & public.profiles
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const username =
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'user'
  const userEmail = profile?.email || user?.email || ''
  const jobTitle = profile?.job_title || user?.user_metadata?.job_title || ''
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  const bio = profile?.bio || user?.user_metadata?.bio || ''

  // Account creation date and verification metadata
  const createdAtDate = user?.created_at ? new Date(user.created_at) : null
  const formattedCreatedAt = createdAtDate
    ? createdAtDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown'

  // Email verification status from Supabase Auth
  const isEmailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at)

  // Account status: Active / Verified
  const isAccountActive = !user?.banned_until

  // Fetch actual statistics from Supabase
  const fetchStatistics = useCallback(async () => {
    if (!user?.id) {
      setIsLoadingStats(false)
      return
    }

    setIsLoadingStats(true)
    setStatsError(null)

    try {
      const data = await getUserProfileStats(user.id)
      setStats(data)
    } catch (err) {
      console.error('[CollabSpace] Failed to load profile statistics:', err)
      setStatsError(err.message || 'Could not load statistics from database.')
    } finally {
      setIsLoadingStats(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  // Loading state while auth is hydrating
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12 px-4">
        <div className="text-center space-y-3">
          <RefreshCw className="h-6 w-6 animate-spin text-brand mx-auto" />
          <p className="text-xs text-muted-foreground font-mono">Loading profile dashboard...</p>
        </div>
      </div>
    )
  }

  // Unauthenticated safety state
  if (!user && !isDemoUser) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Authentication Required</h2>
          <p className="text-xs text-muted-foreground">
            Please log in with your Supabase credentials to access your user profile dashboard.
          </p>
          <Button variant="brand" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              User Profile Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Real-time profile identity, verified credentials, and team workspace activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={fetchStatistics}
              isLoading={isLoadingStats}
              title="Refresh live database statistics"
            >
              Refresh Stats
            </Button>
            <Button variant="outline" size="sm" onClick={logout} leftIcon={LogOut}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* 1. Profile Header Card */}
        <Card className="overflow-hidden border shadow-card bg-card">
          {/* Top Banner Stripe with Hoy Obsidian Gradient */}
          <div className="h-24 sm:h-28 bg-gradient-to-r from-brand/25 via-primary/15 to-brand/10 border-b border-border" />
          
          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              {/* User Profile Picture with Camera Overlay */}
              <div className="relative group">
                <Avatar
                  src={avatarUrl}
                  name={displayName}
                  size="2xl"
                  status="online"
                  className="ring-4 ring-background shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 rounded-full bg-brand p-2 text-white shadow-md hover:bg-brand-hover transition-colors cursor-pointer"
                  title="Upload profile picture"
                  aria-label="Upload profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Edit Profile Action Buttons */}
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

            {/* Profile Identity Summary */}
            <div className="space-y-3 text-center sm:text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">{displayName}</h2>
                  <Badge variant="brand" size="sm" className="font-mono text-xs">
                    @{username}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {profile?.role || 'Member'}
                  </Badge>
                  {isDemoUser && (
                    <Badge variant="warning" size="sm" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Demo Mode
                    </Badge>
                  )}
                </div>

                {/* Job Title and Email Display */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground pt-0.5">
                  <div className="flex items-center gap-1.5 text-foreground/90 font-medium">
                    <Briefcase className="h-3.5 w-3.5 text-brand" />
                    <span>{jobTitle || 'No job title specified'}</span>
                  </div>
                  <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{userEmail || 'No email associated'}</span>
                  </div>
                </div>
              </div>

              {/* Bio Summary */}
              <div className="max-w-3xl pt-1">
                {bio ? (
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-lg border">
                    {bio}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-2.5 rounded-lg border border-dashed">
                    No bio provided. Click "Edit Profile" to tell your team about yourself.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Work Statistics Grid (Fetched from Supabase) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-brand" />
                <span>Work Statistics</span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Actual real-time metrics aggregated directly from your Supabase PostgreSQL tables.
              </p>
            </div>
            {statsError && (
              <Button
                variant="ghost"
                size="xs"
                onClick={fetchStatistics}
                className="text-destructive text-[11px]"
              >
                Failed to load stats • Retry
              </Button>
            )}
          </div>

          {isLoadingStats ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4 border animate-pulse space-y-2">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-7 w-12 bg-muted rounded" />
                  <div className="h-3 w-28 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Workspaces Joined */}
              <Card className="p-4 border hover:border-brand/40 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Workspaces</span>
                  <div className="p-1.5 rounded-md bg-brand/10 text-brand">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {stats.workspacesCount}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Total workspaces joined
                </p>
              </Card>

              {/* Metric 2: Projects Involved In */}
              <Card className="p-4 border hover:border-indigo-500/40 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Projects</span>
                  <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500">
                    <FolderGit2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {stats.projectsCount}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Projects involved in
                </p>
              </Card>

              {/* Metric 3: Tasks Assigned */}
              <Card className="p-4 border hover:border-amber-500/40 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Assigned Tasks</span>
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
                    <ListTodo className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-foreground">
                  {stats.assignedTasksCount}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tasks assigned to you
                </p>
              </Card>

              {/* Metric 4: Tasks Completed */}
              <Card className="p-4 border hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider">Completed</span>
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-500">
                  {stats.completedTasksCount}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tasks completed by you
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Lower Two-Column Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 2. Personal Information Card */}
          <Card className="border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-brand" />
                  <span>Personal Information</span>
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
              <CardDescription className="text-xs">
                Your identity fields stored in the public.profiles table.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Full Name</span>
                <p className="text-xs font-semibold text-foreground">{displayName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Workspace Username</span>
                <p className="text-xs font-mono font-semibold text-brand">@{username}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Work Email</span>
                <p className="text-xs font-semibold text-foreground truncate">{userEmail || 'Not provided'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Job Title</span>
                <p className="text-xs font-semibold text-foreground">
                  {jobTitle || <span className="text-muted-foreground italic font-normal">Not specified</span>}
                </p>
              </div>

              <div className="space-y-1 pt-1 border-t">
                <span className="text-[11px] font-medium text-muted-foreground">Bio</span>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {bio || <span className="text-muted-foreground italic">No bio provided.</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Account Information Card */}
          <Card className="border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand" />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Authentication state and verified credentials from Supabase Auth.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Account Creation Date */}
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Account Created</span>
                  </span>
                  <p className="text-xs font-semibold text-foreground">{formattedCreatedAt}</p>
                </div>
              </div>

              {/* Email Verification Status */}
              <div className="flex items-center justify-between py-1 border-t">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email Verification</span>
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {isEmailVerified
                      ? 'Verified via Supabase GoTrue Auth'
                      : 'Confirmation email link pending'}
                  </p>
                </div>
                <div>
                  {isEmailVerified ? (
                    <Badge variant="success" size="sm" className="gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" className="gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div className="flex items-center justify-between py-1 border-t">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Account Status</span>
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {isAccountActive ? 'Standard authenticated member' : 'Account access restricted'}
                  </p>
                </div>
                <div>
                  <Badge variant="secondary" size="sm" className="gap-1.5 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isAccountActive ? 'Active' : 'Suspended'}
                  </Badge>
                </div>
              </div>

              {/* Row Level Security Note */}
              <div className="pt-2 border-t">
                <p className="text-[10px] text-muted-foreground/80 leading-relaxed bg-muted/20 p-2.5 rounded border border-dashed">
                  🛡️ Protected by Supabase Row Level Security (RLS). Personal data is isolated to your authenticated session.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal (supports Full Name, Username, Job Title, Bio) */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
      />

      {/* Avatar Upload Modal (Supabase Storage 'avatars' bucket) */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </div>
  )
}
