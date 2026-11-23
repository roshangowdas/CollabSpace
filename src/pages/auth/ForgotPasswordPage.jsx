import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  Layers,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react'
import { toast } from 'sonner'
import { forgotPasswordSchema } from '@/utils/validators'
import { useAuth } from '@/hooks/useAuth'
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardFooter
} from '@/components/ui'

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values) => {
    setIsLoading(true)
    setFormError(null)

    try {
      await resetPassword(values.email)

      setSubmittedEmail(values.email)
      setIsSubmitted(true)
      toast.success('Password reset link sent!', {
        description: `Instructions have been dispatched to ${values.email}.`,
      })
    } catch (err) {
      setFormError(err.message || 'Failed to dispatch reset instructions.')
      toast.error('Reset request failed', {
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
            Reset your password
          </h1>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            Enter your work email address and we will generate a recovery link.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-border/80 shadow-elevated bg-card">
          {isSubmitted ? (
            <CardContent className="p-6 sm:p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Reset Instructions Sent
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We sent a password recovery link to{' '}
                <strong className="text-foreground">{submittedEmail}</strong>. Please check your inbox and spam folder.
              </p>

              <div className="pt-3 space-y-2">
                <Link to="/reset-password" className="block w-full">
                  <Button variant="brand" className="w-full" rightIcon={KeyRound}>
                    Proceed to Reset Password Page
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsSubmitted(false)}
                >
                  Try another email address
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <CardContent className="p-6 sm:p-8 space-y-4">
                {formError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive animate-in fade-in-50">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold">Unable to Process</span>
                      <p className="leading-relaxed">{formError}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email">Account Work Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="alex@acme.inc"
                    leftIcon={Mail}
                    disabled={isLoading}
                    error={errors.email?.message}
                    {...register('email')}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    We will send a one-time verification link to this address.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="brand"
                  className="w-full mt-2"
                  size="default"
                  isLoading={isLoading}
                  rightIcon={ArrowRight}
                >
                  {isLoading ? 'Sending Link...' : 'Send Recovery Link'}
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
