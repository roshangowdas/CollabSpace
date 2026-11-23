import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Sparkles,
  User,
  AtSign,
  Camera,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Avatar,
  Badge,
  Textarea,
} from '@/components/ui'
import { AvatarUploader } from '@/components/profile/AvatarUploader'
import { onboardingSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'

const ROLES = [
  { id: 'engineer', label: 'Software Engineer', desc: 'Code, PRs, and architectural reviews' },
  { id: 'product', label: 'Product Manager', desc: 'Roadmaps, specs, and feature strategy' },
  { id: 'designer', label: 'Product Designer', desc: 'UI/UX designs, wireframes, and design systems' },
  { id: 'founder', label: 'Founder / Executive', desc: 'Leadership, strategy, and operations' },
  { id: 'operations', label: 'DevOps / Infra', desc: 'Cloud, CI/CD, and system reliability' },
  { id: 'other', label: 'Other Specialist', desc: 'Marketing, sales, or customer success' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, profile, updateProfile, uploadAvatarFile, removeAvatarFile, checkUsername } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
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
  const currentBio = profile?.bio || user?.user_metadata?.bio || ''
  const currentAvatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: currentFullName,
      username: currentUsername,
      bio: currentBio,
      teamRole: 'Software Engineer',
    },
  })

  const watchedUsername = watch('username', currentUsername)
  const watchedFullName = watch('fullName', currentFullName)
  const watchedBio = watch('bio', currentBio)
  const watchedRole = watch('teamRole', 'Software Engineer')

  // Live username uniqueness validation
  useEffect(() => {
    if (!watchedUsername || watchedUsername.trim() === '') {
      setUsernameStatus({ checking: false, available: false, message: 'Username is required' })
      return
    }

    const clean = watchedUsername.trim().toLowerCase()

    if (clean === currentUsername.toLowerCase()) {
      setUsernameStatus({ checking: false, available: true, message: 'Current username' })
      clearErrors('username')
      return
    }

    if (clean.length < 3 || clean.length > 30 || !/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Must be 3-30 letters, numbers, or underscores',
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

  const handleAvatarUpload = async (file) => {
    setIsUploadingPhoto(true)
    try {
      await uploadAvatarFile(file)
      toast.success('Avatar uploaded successfully!')
    } catch (err) {
      toast.error('Upload failed', { description: err.message })
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleAvatarRemove = async () => {
    try {
      await removeAvatarFile()
    } catch (err) {
      toast.error('Failed to remove avatar', { description: err.message })
    }
  }

  const handleCompleteOnboarding = async (values) => {
    setIsSubmitting(true)
    try {
      await updateProfile({
        fullName: values.fullName.trim(),
        username: values.username.trim().toLowerCase(),
        bio: values.bio?.trim() || '',
        avatarUrl: profile?.avatar_url || currentAvatarUrl,
      })

      toast.success('Welcome to CollabSpace!', {
        description: 'Your profile has been set up successfully.',
      })

      navigate('/dashboard')
    } catch (err) {
      toast.error('Could not complete onboarding', {
        description: err.message || 'Please check your inputs and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: 'Your Identity', icon: User },
    { number: 2, title: 'Profile Photo', icon: Camera },
    { number: 3, title: 'Team Role', icon: Briefcase },
  ]

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 shadow-subtle text-xs font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Welcome to CollabSpace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Let's Set Up Your Profile
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Personalize your account so your teammates can easily identify and mention you.
          </p>
        </div>

        {/* Multi-Step Progress Tracker */}
        <div className="flex items-center justify-between px-4">
          {steps.map((step, idx) => {
            const Icon = step.icon
            const isCompleted = currentStep > step.number
            const isCurrent = currentStep === step.number

            return (
              <React.Fragment key={step.number}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      isCompleted
                        ? 'bg-brand text-white'
                        : isCurrent
                        ? 'border-2 border-brand bg-brand/10 text-brand'
                        : 'border bg-card text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                      currentStep > step.number ? 'bg-brand' : 'bg-border'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Step Cards */}
        <Card className="shadow-modal border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>
                {currentStep === 1 && 'Step 1: Your Name & Handle'}
                {currentStep === 2 && 'Step 2: Profile Photo'}
                {currentStep === 3 && 'Step 3: Team Role & Discipline'}
              </span>
              <Badge variant="secondary" size="sm">
                Step {currentStep} of 3
              </Badge>
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Choose the display name and @handle your colleagues will see.'}
              {currentStep === 2 && 'Upload a picture so team members recognize your contributions.'}
              {currentStep === 3 && 'Help tailor your workspace permissions and recommendations.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* STEP 1: Name, Username & Bio */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-name">Full Name</Label>
                  <Input
                    id="onboard-name"
                    placeholder="e.g. Alex Rivera"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="onboard-username">Workspace Handle</Label>
                    {usernameStatus.checking ? (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin text-brand" />
                        Checking availability...
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
                      id="onboard-username"
                      className="pl-9 font-mono text-xs"
                      placeholder="alex_rivera"
                      error={errors.username?.message}
                      {...register('username')}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This is your unique handle for mentions in channels, tasks, and docs.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="onboard-bio">Short Bio (Optional)</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {(watchedBio || '').length} / 300
                    </span>
                  </div>
                  <Textarea
                    id="onboard-bio"
                    rows={2}
                    maxLength={300}
                    placeholder="Tell your team what you work on..."
                    error={errors.bio?.message}
                    {...register('bio')}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Avatar Upload */}
            {currentStep === 2 && (
              <div className="py-2">
                <AvatarUploader
                  currentAvatarUrl={profile?.avatar_url || currentAvatarUrl}
                  userName={watchedFullName || 'User'}
                  onUpload={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                  isUploading={isUploadingPhoto}
                />
              </div>
            )}

            {/* STEP 3: Role Selection */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ROLES.map((role) => {
                    const isSelected = watchedRole === role.label
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setValue('teamRole', role.label)}
                        className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand bg-brand/5 shadow-subtle ring-1 ring-brand'
                            : 'border-border hover:border-muted-foreground/30 hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">
                            {role.label}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-brand" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {role.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t pt-4">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={ArrowLeft}
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                Skip for now
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                variant="brand"
                size="sm"
                rightIcon={ArrowRight}
                disabled={
                  currentStep === 1 &&
                  (!usernameStatus.available || errors.fullName || errors.username)
                }
                onClick={() => {
                  if (currentStep === 1 && !usernameStatus.available) {
                    toast.error('Please choose a valid and available username')
                    return
                  }
                  setCurrentStep((prev) => prev + 1)
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                variant="brand"
                size="sm"
                isLoading={isSubmitting}
                rightIcon={Sparkles}
                onClick={handleSubmit(handleCompleteOnboarding)}
              >
                Complete Setup & Launch
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

