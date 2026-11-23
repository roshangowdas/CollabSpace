import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  Layers,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react'
import { toast } from 'sonner'
import { resetPasswordSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardFooter,
  PasswordStrengthIndicator
} from '@/components/ui'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updateUserPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Watch password value to power strength indicator
  const watchedPassword = watch('password', '')

  const onSubmit = async (values) => {
    setIsLoading(true)
    setFormError(null)

    try {
      await updateUserPassword(values.password)

      setIsSuccess(true)
      toast.success('Password updated successfully!', {
        description: 'You can now sign in with your new credentials.',
      })

      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setFormError(err.message || 'Failed to update password. Reset token may have expired.')
      toast.error('Password reset failed', {
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
            Set your new password
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Choose a strong password with letters, numbers, and symbols.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border/80 shadow-elevated bg-card">
          {isSuccess ? (
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Password Successfully Reset
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your new password has been verified and saved. Redirecting you to the sign-in screen...
              </p>
              <div className="pt-2">
                <Link to="/login" className="block w-full">
                  <Button variant="brand" className="w-full" rightIcon={ArrowRight}>
                    Sign In Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <CardContent className="p-6 sm:p-8 space-y-4">
                {formError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive animate-in fade-in-50">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold">Reset Failed</span>
                      <p className="leading-relaxed">{formError}</p>
                    </div>
                  </div>
                )}

                {/* New Password with Strength Indicator */}
                <div className="space-y-1.5">
                  <Label htmlFor="reset-password">New Password</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter new password"
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
                  <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                  <Input
                    id="reset-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    leftIcon={Lock}
                    allowPasswordToggle
                    disabled={isLoading}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
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
                  {isLoading ? 'Updating Password...' : 'Save New Password'}
                </Button>
              </CardContent>

              <CardFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
