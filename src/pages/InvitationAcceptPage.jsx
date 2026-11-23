import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
  UserCheck,
  LogOut,
  Sparkles,
  RefreshCw,
  Mail,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Avatar,
} from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getInvitationDetails, acceptInvitation } from '@/services/invitations'

const ROLE_DESCRIPTIONS = {
  Admin: 'Full administrative access to manage members, workspace settings, and projects.',
  Developer: 'Access to code repositories, issue tracking, tasks, and technical documentation.',
  Designer: 'Access to canvas whiteboards, design specs, wireframes, and project assets.',
  Tester: 'Access to QA verification workflows, bug reporting, and acceptance testing.',
  Member: 'General collaboration across channels, discussion threads, and project tasks.',
}

export function InvitationAcceptPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { refreshWorkspaces, switchWorkspace } = useWorkspace()

  const [invite, setInvite] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [errorState, setErrorState] = useState(null)
  const [alreadyMember, setAlreadyMember] = useState(false)

  // Verify and load invitation details
  useEffect(() => {
    let isMounted = true

    async function verify() {
      setIsLoading(true)
      setErrorState(null)
      try {
        const details = await getInvitationDetails(token)
        if (!isMounted) return

        if (!details.valid) {
          setErrorState(details.reason || 'Invalid invitation link.')
        } else {
          setInvite(details)
        }
      } catch (err) {
        if (!isMounted) return
        setErrorState(err.message || 'Failed to verify invitation.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    verify()

    return () => {
      isMounted = false
    }
  }, [token])

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const res = await acceptInvitation(token)

      toast.success(`You have joined ${invite.workspace_name}!`, {
        description: `Assigned role: ${res.role || invite.role}`,
      })

      // Refresh workspaces in context and switch to newly joined workspace
      const updatedList = await refreshWorkspaces(res.workspace_id)
      if (res.workspace_id) {
        switchWorkspace(res.workspace_id)
      }

      navigate('/dashboard')
    } catch (err) {
      if (err.message?.includes('already a member') || err.message?.includes('already_member')) {
        setAlreadyMember(true)
        toast.info('You are already an active member of this workspace.')
      } else {
        toast.error('Could not accept invitation', {
          description: err.message || 'Please verify your account and try again.',
        })
      }
    } finally {
      setIsAccepting(false)
    }
  }

  const handleSwitchAccount = async () => {
    await logout()
    navigate(`/login?from=/invite/${token}`)
  }

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-muted-foreground text-xs">
          <RefreshCw className="h-6 w-6 animate-spin text-brand" />
          <span>Verifying security token and workspace invitation...</span>
        </div>
      </div>
    )
  }

  // 2. Error / Expired / Invalid State
  if (errorState) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-modal border p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Invitation Unavailable</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {errorState}
            </p>
          </div>

          <div className="pt-2">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const currentUserEmail = user?.email?.toLowerCase() || ''
  const invitedEmail = invite?.email?.toLowerCase() || ''
  const isEmailMatch = isAuthenticated && currentUserEmail === invitedEmail
  const isEmailMismatch = isAuthenticated && currentUserEmail !== invitedEmail

  const roleDesc = ROLE_DESCRIPTIONS[invite?.role] || 'Collaborate with your team members.'

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Brand pill */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 shadow-subtle text-xs font-medium text-brand">
            <Sparkles className="h-3.5 w-3.5" />
            <span>CollabSpace Workspace Invitation</span>
          </div>
        </div>

        {/* Main Invitation Card */}
        <Card className="shadow-modal border overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-brand/10 via-primary/5 to-transparent border-b text-center space-y-3">
            {invite?.workspace_logo ? (
              <img
                src={invite.workspace_logo}
                alt={invite.workspace_name}
                className="h-16 w-16 rounded-xl object-cover border shadow-card mx-auto ring-2 ring-background"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-primary text-primary-foreground font-bold text-xl shadow-card flex items-center justify-center mx-auto">
                {invite?.workspace_name?.slice(0, 2).toUpperCase() || 'WS'}
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Join {invite?.workspace_name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {invite?.inviter_name} has invited you to collaborate on CollabSpace.
              </p>
            </div>
          </div>

          <CardContent className="p-6 space-y-5">
            {/* Role & Invitation Meta */}
            <div className="rounded-xl border p-4 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Assigned Role:</span>
                <Badge variant="brand" size="sm" className="font-semibold text-xs">
                  {invite?.role}
                </Badge>
              </div>

              <p className="text-xs text-foreground/80 leading-relaxed bg-muted/40 p-2.5 rounded-lg border">
                {roleDesc}
              </p>

              <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t">
                <span>Invited Email:</span>
                <span className="font-mono font-medium text-foreground">{invite?.email}</span>
              </div>
            </div>

            {/* STATE 1: Already Member */}
            {alreadyMember && (
              <div className="p-4 rounded-xl border border-brand/20 bg-brand/5 text-center space-y-2 text-xs">
                <CheckCircle2 className="h-5 w-5 text-brand mx-auto" />
                <h4 className="font-semibold text-foreground">You are already a member!</h4>
                <p className="text-muted-foreground">
                  You already have active access to {invite?.workspace_name}.
                </p>
                <div className="pt-2">
                  <Button
                    variant="brand"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/dashboard')}
                  >
                    Go to Workspace Dashboard
                  </Button>
                </div>
              </div>
            )}

            {/* STATE 2: Unauthenticated */}
            {!isAuthenticated && !alreadyMember && (
              <div className="p-4 rounded-xl border bg-muted/30 text-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-foreground block">
                      Account Authentication Required
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      To verify your identity, please sign in or register with{' '}
                      <strong className="text-foreground">{invite?.email}</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link to={`/login?from=/invite/${token}`}>
                    <Button variant="brand" size="sm" className="w-full">
                      Log In to Accept
                    </Button>
                  </Link>
                  <Link to={`/register?email=${encodeURIComponent(invite?.email || '')}&from=/invite/${token}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Register Account
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* STATE 3: Authenticated with Email Mismatch */}
            {isEmailMismatch && !alreadyMember && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-3">
                <div className="flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold block">Email Mismatch Detected</span>
                    <p className="leading-relaxed">
                      You are signed in as <strong className="font-mono">{currentUserEmail}</strong>, but this invitation was sent to <strong className="font-mono">{invitedEmail}</strong>.
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={LogOut}
                    onClick={handleSwitchAccount}
                  >
                    Switch Account
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* STATE 4: Authenticated with Matching Email (Ready to Accept) */}
            {isEmailMatch && !alreadyMember && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Verified identity for <strong>{currentUserEmail}</strong>.
                  </span>
                </div>

                <Button
                  variant="brand"
                  size="default"
                  className="w-full"
                  isLoading={isAccepting}
                  rightIcon={ArrowRight}
                  onClick={handleAccept}
                >
                  Accept Invitation & Join {invite?.workspace_name}
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-muted/10 border-t p-4 text-center justify-center text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-brand" />
              <span>CollabSpace multi-tenant zero-trust security architecture.</span>
            </span>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

