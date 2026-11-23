import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  Layers,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { registerSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import {
  Button,
  Input,
  Label,
  Checkbox,
  Card,
  CardContent,
  CardFooter,
  PasswordStrengthIndicator
} from '@/components/ui'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: authRegister, isConfigured, loginAsDemo } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  })

  // Watch password value in real-time to power the strength indicator
  const watchedPassword = watch('password', '')
  const agreeToTerms = watch('agreeToTerms', false)

  const onSubmit = async (values) => {
    setIsLoading(true)
    setFormError(null)

    try {
      if (!isConfigured) {
        // Fallback for demo session if Supabase is not yet configured in .env
        toast.info('Supabase unconfigured: creating demo session', {
          description: 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for live email verification.',
        })
        loginAsDemo('Owner')
        setIsSuccess(true)
        setTimeout(() => navigate('/dashboard'), 1200)
        return
      }

      await authRegister(values.email, values.password, values.fullName)
      setIsSuccess(true)
      toast.success('Account created successfully!', {
        description: 'Please check your email inbox to confirm your account or sign in.',
      })

      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setFormError(err.message || 'Failed to create account. Please check your information.')
      toast.error('Registration failed', {
        description: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-muted/30 via-background to-background text-foreground">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-subtle transition-transform group-hover:scale-105">
              <Layers className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              Collab<span className="text-brand">Space</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create your workspace account
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Get started with real-time sprint boards, team channels, and unified documentation.
          </p>
        </div>

        {/* Main Registration Card */}
        <Card className="border-border/80 shadow-elevated bg-card">
          {isSuccess ? (
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">Account Created!</h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Your profile has been created and registered with Supabase. Redirecting...
              </p>
              <div className="pt-2">
                <Button
                  variant="brand"
                  className="w-full"
                  onClick={() => navigate('/login')}
                  rightIcon={ArrowRight}
                >
                  Proceed to Sign In
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <CardContent className="p-6 sm:p-8 space-y-4">
                {/* Form level error alert */}
                {formError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive animate-in fade-in-50">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold">Registration Issue</span>
                      <p className="leading-relaxed">{formError}</p>
                    </div>
                  </div>
                )}

                {!isConfigured && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                    <div className="font-medium flex items-center gap-1.5 mb-0.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Live Demo Sandbox Mode
                    </div>
                    <span>
                      Supabase environment variables are pending in <code className="font-mono text-[11px]">.env</code>. Submitting this form will safely initialize a demonstration workspace session.
                    </span>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="register-fullname">Full Name</Label>
                  <Input
                    id="register-fullname"
                    type="text"
                    autoComplete="name"
                    placeholder="Sarah Jenkins"
                    leftIcon={User}
                    disabled={isLoading}
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="register-email">Work Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder="sarah@acme.inc"
                    leftIcon={Mail}
                    disabled={isLoading}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                {/* Password with Strength Indicator */}
                <div className="space-y-1.5">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    leftIcon={Lock}
                    allowPasswordToggle
                    disabled={isLoading}
                    error={errors.password?.message}
                    {...register('password')}
                  />

                  {/* Password Strength Indicator */}
                  <PasswordStrengthIndicator password={watchedPassword} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    leftIcon={Lock}
                    allowPasswordToggle
                    disabled={isLoading}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </div>

                {/* Terms Checkbox */}
                <div className="pt-2">
                  <Checkbox
                    id="agreeToTerms"
                    label={
                      <span className="text-xs sm:text-sm">
                        I agree to the{' '}
                        <Link to="/terms" target="_blank" className="text-brand font-semibold hover:underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" target="_blank" className="text-brand font-semibold hover:underline">
                          Privacy Policy
                        </Link>{' '}
                        (including processing of my personal data under India&apos;s DPDP Act 2023)
                      </span>
                    }
                    checked={agreeToTerms}
                    disabled={isLoading}
                    error={errors.agreeToTerms?.message}
                    {...register('agreeToTerms')}
                  />
                  {errors.agreeToTerms?.message && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.agreeToTerms.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="brand"
                  className="w-full mt-2"
                  size="default"
                  isLoading={isLoading}
                  rightIcon={ArrowRight}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </CardContent>

              <CardFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="ml-1 text-brand font-medium hover:underline">
                  Sign In
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>

        {/* Security badge footer */}
        <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            <span>Encrypted with SHA-256 and Postgres Row Level Security</span>
          </div>
          <div className="flex items-center gap-3 pt-0.5">
            <Link to="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-foreground hover:underline">Terms of Service</Link>
            <span>•</span>
            <Link to="/cookies" className="hover:text-foreground hover:underline">Cookie Policy</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
