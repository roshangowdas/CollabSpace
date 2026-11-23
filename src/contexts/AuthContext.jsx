import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import {
  signInWithPassword,
  signUp,
  signOut as authSignOut,
  resetPasswordForEmail,
  updatePassword as authUpdatePassword,
  getSession,
} from '@/services/auth'
import {
  getProfile,
  updateProfile as profileUpdateProfile,
  uploadAvatar as profileUploadAvatar,
  removeAvatar as profileRemoveAvatar,
  checkUsernameAvailability,
} from '@/services/profiles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDemoUser, setIsDemoUser] = useState(false)

  // Load user profile from Supabase profiles table
  const loadProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null)
      return
    }

    try {
      const data = await getProfile(currentUser.id)
      if (data) {
        setProfile(data)
      } else {
        // Fallback to user metadata if database row has not yet propagated
        const defaultUsername =
          currentUser.user_metadata?.username ||
          currentUser.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
          'user'

        setProfile({
          id: currentUser.id,
          email: currentUser.email,
          full_name:
            currentUser.user_metadata?.full_name ||
            currentUser.email?.split('@')[0] ||
            'User',
          username: defaultUsername,
          avatar_url: currentUser.user_metadata?.avatar_url || '',
          bio: currentUser.user_metadata?.bio || '',
          role: 'Member',
          created_at: currentUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.warn('[CollabSpace AuthContext] Profile load issue:', err.message)
      setProfile({
        id: currentUser.id,
        email: currentUser.email,
        full_name:
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split('@')[0] ||
          'User',
        username: currentUser.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user',
        avatar_url: currentUser.user_metadata?.avatar_url || '',
        bio: '',
        role: 'Member',
        created_at: currentUser.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }

  useEffect(() => {
    let isMounted = true

    // 0. Check saved demo session for session persistence across reloads
    try {
      const savedDemo = localStorage.getItem('collabspace-demo-session')
      if (savedDemo) {
        const parsed = JSON.parse(savedDemo)
        if (parsed?.user) {
          setUser(parsed.user)
          setProfile(parsed.profile)
          setSession({ access_token: 'demo-token', user: parsed.user })
          setIsDemoUser(true)
          setIsLoading(false)
          return
        }
      }
    } catch {
      // Ignore
    }

    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    // 1. Initial session hydration
    getSession().then(async (initialSession) => {
      if (!isMounted) return

      if (initialSession?.user) {
        setSession(initialSession)
        setUser(initialSession.user)
        try {
          await loadProfile(initialSession.user)
        } finally {
          if (isMounted) setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    })

    // 2. Auth state change listener (handles SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, PASSWORD_RECOVERY)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return

      if (event === 'TOKEN_REFRESHED') {
        setSession(currentSession)
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfile(null)
        setIsDemoUser(false)
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setSession(currentSession)
        setUser(currentSession?.user || null)
        if (currentSession?.user) {
          await loadProfile(currentSession.user)
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        toast.info('Password recovery mode active', {
          description: 'Please set your new password below.',
        })
      }

      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  /**
   * 1. Register with email, password, and full name
   */
  const register = async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      loginAsDemo('Owner')
      return {
        user: { id: 'demo-user', email },
        session: { access_token: 'demo-token' },
        needsEmailVerification: false,
      }
    }

    try {
      localStorage.removeItem('collabspace-demo-session')
      localStorage.removeItem('collabspace_current_workspace_id')
    } catch {
      // Ignore
    }

    const result = await signUp({ email, password, fullName })
    setIsDemoUser(false)

    if (result.session?.user) {
      setSession(result.session)
      setUser(result.session.user)
      await loadProfile(result.session.user)
    }

    return result
  }

  /**
   * 2. Sign in with email and password
   */
  const login = async (email, password) => {
    if (!isSupabaseConfigured) {
      loginAsDemo('Owner')
      return { user: { id: 'demo-user', email }, session: { access_token: 'demo-token' } }
    }

    try {
      localStorage.removeItem('collabspace-demo-session')
      localStorage.removeItem('collabspace_current_workspace_id')
    } catch {
      // Ignore
    }

    const data = await signInWithPassword({ email, password })
    setIsDemoUser(false)
    setSession(data.session)
    setUser(data.user)
    await loadProfile(data.user)
    return data
  }

  /**
   * 3. Sign out
   */
  const logout = async () => {
    try {
      localStorage.removeItem('collabspace-demo-session')
    } catch {
      // Ignore
    }
    if (isDemoUser) {
      setUser(null)
      setSession(null)
      setProfile(null)
      setIsDemoUser(false)
      toast.success('Signed out from demo session')
      return
    }

    await authSignOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    toast.success('Signed out successfully')
  }

  /**
   * 4. Forgot password recovery email
   */
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) {
      return { success: true }
    }
    return await resetPasswordForEmail(email)
  }

  /**
   * 5. Password update
   */
  const updateUserPassword = async (newPassword) => {
    if (isDemoUser) {
      return { success: true }
    }
    return await authUpdatePassword(newPassword)
  }

  /**
   * 6. Update current profile data (fullName, username, bio, avatarUrl)
   */
  const updateProfileData = async (updates) => {
    if (isDemoUser) {
      const updated = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString(),
      }
      setProfile(updated)
      return updated
    }

    if (!user) throw new Error('No authenticated user')
    const updated = await profileUpdateProfile(user.id, updates)
    setProfile(updated)
    return updated
  }

  /**
   * 7. Upload avatar file to Supabase Storage
   */
  const uploadAvatarFile = async (file) => {
    if (isDemoUser) {
      const localPreviewUrl = URL.createObjectURL(file)
      const updated = {
        ...profile,
        avatar_url: localPreviewUrl,
        updated_at: new Date().toISOString(),
      }
      setProfile(updated)
      toast.success('Avatar updated for demo session')
      return { publicUrl: localPreviewUrl, path: 'demo/avatar.png' }
    }

    if (!user) throw new Error('No authenticated user')
    const result = await profileUploadAvatar(user.id, file)
    setProfile((prev) => ({
      ...prev,
      avatar_url: result.publicUrl,
      updated_at: new Date().toISOString(),
    }))
    return result
  }

  /**
   * 8. Remove avatar
   */
  const removeAvatarFile = async () => {
    if (isDemoUser) {
      setProfile((prev) => ({ ...prev, avatar_url: null }))
      toast.success('Avatar removed')
      return
    }

    if (!user) throw new Error('No authenticated user')
    await profileRemoveAvatar(user.id)
    setProfile((prev) => ({ ...prev, avatar_url: null }))
    toast.success('Avatar removed')
  }

  /**
   * 9. Check username availability
   */
  const checkUsername = async (candidateUsername) => {
    return await checkUsernameAvailability(candidateUsername, user?.id)
  }

  /**
   * Demo Mode Login Helper:
   * Rule: "Demo data must be clearly separated from real data."
   */
  const loginAsDemo = (role = 'Owner') => {
    const demoUser = {
      id: 'demo-user-collabspace-uuid',
      email: 'alex.rivera@collabspace.demo',
      user_metadata: {
        full_name: 'Alex Rivera (Demo)',
        username: 'alex_rivera',
        bio: 'Lead product architect & collaborative systems engineer.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
      },
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    }
    const demoProfile = {
      id: demoUser.id,
      email: demoUser.email,
      full_name: 'Alex Rivera (Demo)',
      username: 'alex_rivera',
      bio: 'Lead product architect & collaborative systems engineer.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
      role,
      created_at: demoUser.created_at,
      updated_at: new Date().toISOString(),
    }
    setUser(demoUser)
    setProfile(demoProfile)
    setSession({ access_token: 'demo-token', user: demoUser })
    setIsDemoUser(true)
    try {
      localStorage.setItem(
        'collabspace-demo-session',
        JSON.stringify({ user: demoUser, profile: demoProfile, role })
      )
    } catch {
      // Ignore
    }
  }

  const loginAsSuperAdmin = (email = '0243roshan@gmail.com') => {
    const adminUser = {
      id: 'admin-roshan-uuid',
      email,
      user_metadata: {
        full_name: 'Roshan (Super Admin)',
        username: 'roshan_admin',
        role: 'Owner',
        avatar_url: '',
      },
      created_at: new Date().toISOString(),
    }
    const adminProfile = {
      id: adminUser.id,
      email: adminUser.email,
      full_name: 'Roshan (Super Admin)',
      username: 'roshan_admin',
      bio: 'Workspace Super Administrator & Platform Owner',
      avatar_url: '',
      role: 'Owner',
      created_at: adminUser.created_at,
      updated_at: new Date().toISOString(),
    }
    setUser(adminUser)
    setProfile(adminProfile)
    setSession({ access_token: 'superadmin-token', user: adminUser })
    setIsDemoUser(true)
    try {
      localStorage.setItem(
        'collabspace-demo-session',
        JSON.stringify({ user: adminUser, profile: adminProfile, role: 'Owner' })
      )
    } catch {
      // Ignore
    }
    return { user: adminUser, profile: adminProfile }
  }

  const value = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: Boolean(user),
    isConfigured: isSupabaseConfigured,
    isDemoUser,
    login,
    register,
    logout,
    resetPassword,
    updateUserPassword,
    updateProfile: updateProfileData,
    uploadAvatarFile,
    removeAvatarFile,
    checkUsername,
    refreshProfile: () => loadProfile(user),
    loginAsDemo,
    loginAsSuperAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
