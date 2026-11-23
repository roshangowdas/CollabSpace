import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  Layers,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { loginSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import { resendVerificationEmail } from '@/services/auth'
import { Button, Input, Label, Checkbox, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginAsDemo, isConfigured } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Redirect destination if arriving from a protected route
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const rememberMe = watch('rememberMe', false)

  const onSubmit = async (values) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      if (!isConfigured) {
        // Fallback for unconfigured .env environment
        toast.info('Starting Demo Workspace Session', {
          description: 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for live Supabase Auth.',
        })
        loginAsDemo('Owner')
        setIsSuccess(true)
        setTimeout(() => navigate(from, { replace: true }), 600)
        return
      }

      await login(values.email, values.password)
      setIsSuccess(true)
      toast.success('Signed in successfully!')
      setTimeout(() => navigate(from, { replace: true }), 600)
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password.')
      toast.error('Sign in failed', {
        description: err.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoSignIn = () => {
    loginAsDemo('Owner')
    toast.success('Logged in as Demo Workspace Owner!')
    navigate(from, { replace: true })
  }

  const isEmailVerificationError =
    authError &&
    (authError.toLowerCase().includes('verify your email') ||
      authError.toLowerCase().includes('not confirmed'))

  const handleResendVerification = async () => {
    const emailToResend = getValues('email')
    if (!emailToResend) {
      toast.error('Please enter your work email to resend the confirmation link.')
      return
    }

    setIsResending(true)
    try {
      await resendVerificationEmail(emailToResend)
      toast.success('Verification link sent!', {
        description: `We sent a new confirmation email to ${emailToResend}. Check your inbox and Spam folder.`,
      })
    } catch (err) {
      toast.error('Could not resend email', {
        description: err.message || 'Please wait a moment before requesting another link.',
      })
    } finally {
      setIsResending(false)
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
        className="w-full max-w-md space-y-6"
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
            Sign in to your workspace
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Enter your work credentials to access your channels, tasks, and team boards.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border/80 shadow-elevated bg-card">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="p-6 sm:p-8 space-y-4">
              {/* Form level error alert */}
              {authError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive animate-in fade-in-50">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <div>
                      <span className="font-semibold">Authentication Error</span>
                      <p className="leading-relaxed mt-0.5">{authError}</p>
                    </div>

                    {isEmailVerificationError && (
                      <div className="pt-2 border-t border-destructive/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          Check your Spam folder or request a new confirmation link:
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          isLoading={isResending}
                          onClick={handleResendVerification}
                          className="shrink-0 text-foreground border-destructive/30 hover:bg-destructive/10"
                        >
                          Resend Verification Email
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Success alert */}
              {isSuccess && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 animate-in fade-in-50">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="font-medium">Credentials verified. Redirecting to workspace...</span>
                </div>
              )}

              {!isConfigured && (
                <div className="p-3 rounded-lg bg-muted/70 border text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand" />
                    Supabase Credentials Pending
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    You can sign in below to test demo mode, or click the quick demo button.
                  </p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Work Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="sarah@acme.inc"
                  leftIcon={Mail}
                  disabled={isLoading || isSuccess}
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              {/* Password Field with Show/Hide toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-brand hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  leftIcon={Lock}
                  allowPasswordToggle
                  disabled={isLoading || isSuccess}
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="pt-1">
                <Checkbox
                  id="rememberMe"
                  label="Keep me signed in on this device"
                  checked={rememberMe}
                  {...register('rememberMe')}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="brand"
                className="w-full mt-2"
                size="default"
                isLoading={isLoading}
                disabled={isSuccess}
                rightIcon={ArrowRight}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

            </CardContent>

            <CardFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
              Don&apos;t have an account yet?{' '}
              <Link to="/register" className="ml-1 text-brand font-medium hover:underline">
                Create Account
              </Link>
            </CardFooter>
          </form>
        </Card>

        {/* Security badge footer */}
        <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            <span>Postgres Row Level Security (RLS) Protected</span>
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
