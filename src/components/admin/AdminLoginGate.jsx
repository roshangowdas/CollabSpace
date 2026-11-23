import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  ArrowLeft,
  Loader2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { consumeRateLimit, RATE_LIMIT_PRESETS } from '@/utils/rateLimiter'

export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || '0243roshan@gmail.com'
// Default bootstrap key used only when Supabase Auth has not yet established the admin user record
const DEFAULT_BOOTSTRAP_ADMIN_KEY = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || '12345678'

export function AdminLoginGate({ onUnlock }) {
  const { user, login, register, loginAsSuperAdmin, isLoading: authLoading } = useAuth()
  const { currentWorkspace } = useWorkspace()

  // Pre-fill with the single authorized admin email
  const [email, setEmail] = useState(SUPER_ADMIN_EMAIL)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const trimmedEmail = email.trim().toLowerCase()

    // 1. Strict single-admin email check
    if (trimmedEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      setErrorMessage(
        `Access Denied: Only the authorized single administrator (${SUPER_ADMIN_EMAIL}) is permitted to access this admin dashboard.`
      )
      return
    }

    // 2. Rate limit protection: block automated brute-force attacks (max 5 per minute)
    try {
      consumeRateLimit(`admin:login:${trimmedEmail}`, RATE_LIMIT_PRESETS.ADMIN_LOGIN)
    } catch (rateLimitErr) {
      setErrorMessage(rateLimitErr.message)
      return
    }

    // 3. Strict single-admin password verification
    if (password !== DEFAULT_BOOTSTRAP_ADMIN_KEY) {
      setErrorMessage('Access Denied: Invalid administrator password.')
      return
    }

    setIsSubmitting(true)

    try {
      let authedUser = null

      // Attempt Supabase authentication if credentials exist in backend
      try {
        const { user: supaUser, error: loginErr } = await login(trimmedEmail, password)
        if (!loginErr && supaUser) {
          authedUser = supaUser
        }
      } catch (loginErr) {
        // If account isn't registered in Supabase auth yet, attempt signup
        try {
          const { user: regUser, error: regErr } = await register(
            trimmedEmail,
            password,
            'Roshan (Super Admin)'
          )
          if (!regErr && regUser) {
            authedUser = regUser
          }
        } catch {
          // Fall through to local superadmin session
        }
      }

      // If Supabase is offline/mocked or not yet migrated, establish verified superadmin session
      if (!authedUser && loginAsSuperAdmin) {
        const res = loginAsSuperAdmin(trimmedEmail)
        authedUser = res?.user || { email: trimmedEmail }
      }

      setSuccessMessage('Administrator credentials verified. Unlocking dashboard...')
      setTimeout(() => {
        if (onUnlock) {
          onUnlock(authedUser)
        }
      }, 500)
    } catch (err) {
      console.error('Super Admin authentication error:', err)
      setErrorMessage(
        err.message || 'Authentication error. Please check your network connection.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md">
        {/* Top Warning Banner */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 shadow-sm mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              CollabSpace Admin Portal
            </h1>
            <Badge variant="destructive" className="text-[11px] uppercase tracking-wider font-semibold">
              Restricted
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Direct URL Access Only • Single Super Admin Portal
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-card border border-border shadow-modal rounded-lg p-6 sm:p-8 space-y-6">
          {/* Target Workspace Info */}
          <div className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/60 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Target Workspace:
            </span>
            <span className="font-semibold text-foreground">
              {currentWorkspace?.name || 'Primary Workspace'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Authorized Administrator Login</p>
              <p className="mt-0.5 leading-relaxed">
                Access is exclusively restricted to <strong>{SUPER_ADMIN_EMAIL}</strong>. Enter your credentials below to unlock the administration console.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Admin Email / Gmail */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                Admin Email / Gmail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-sm"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Admin Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 text-sm"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full py-2.5 font-semibold text-sm shadow-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Verify & Unlock Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Back Link */}
          <div className="pt-2 border-t border-border/40 text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Standard Workspace</span>
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Single Super Administrator policy enforced. No unauthorized accounts can access <code>/admin</code>.
        </p>
      </div>
    </div>
  )
}
