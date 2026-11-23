import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'
import { consumeRateLimit, RATE_LIMIT_PRESETS } from '@/utils/rateLimiter'

/**
 * Signs up a new user with email and password, setting full_name in user_metadata.
 * Handles both object and positional arguments.
 * Checks whether email verification is required by project settings.
 *
 * @param {string | { email: string, password: string, fullName: string }} emailOrObj
 * @param {string} [password]
 * @param {string} [fullName]
 * @returns {Promise<{
 *   user: import('@supabase/supabase-js').User | null,
 *   session: import('@supabase/supabase-js').Session | null,
 *   needsEmailVerification: boolean
 * }>}
 */
export async function signUp(emailOrObj, password, fullName) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase credentials are not configured in .env. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    )
  }

  const email = typeof emailOrObj === 'object' ? emailOrObj.email : emailOrObj
  const pass = typeof emailOrObj === 'object' ? emailOrObj.password : password
  const name = typeof emailOrObj === 'object' ? emailOrObj.fullName : fullName
  const cleanEmail = email ? email.trim().toLowerCase() : ''

  // Rate limiting to prevent bot sign-up abuse & resource exhaustion
  if (cleanEmail) {
    consumeRateLimit(`auth:signup:${cleanEmail}`, RATE_LIMIT_PRESETS.AUTH_SIGNUP)
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: pass,
      options: {
        data: {
          full_name: name?.trim(),
        },
      },
    })

    if (error) throw error

    // Supabase project email confirmation detection:
    // If confirmation is required, session is null or confirmed_at is null
    const needsEmailVerification = Boolean(
      data?.user && (!data?.session || !data?.user?.confirmed_at)
    )

    return {
      user: data.user,
      session: data.session,
      needsEmailVerification,
    }
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Signs in an existing user with email and password.
 * Handles both object and positional arguments.
 *
 * @param {string | { email: string, password: string }} emailOrObj
 * @param {string} [password]
 * @returns {Promise<{
 *   user: import('@supabase/supabase-js').User,
 *   session: import('@supabase/supabase-js').Session
 * }>}
 */
export async function signInWithPassword(emailOrObj, password) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase credentials are not configured in .env. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    )
  }

  const email = typeof emailOrObj === 'object' ? emailOrObj.email : emailOrObj
  const pass = typeof emailOrObj === 'object' ? emailOrObj.password : password
  const cleanEmail = email ? email.trim().toLowerCase() : ''

  // Rate limiting to protect against brute-force & credential stuffing
  if (cleanEmail) {
    consumeRateLimit(`auth:signin:${cleanEmail}`, RATE_LIMIT_PRESETS.AUTH_SIGNIN)
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    })

    if (error) throw error

    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Resends the signup confirmation email to the user.
 * @param {string} email
 */
export async function resendVerificationEmail(email) {
  if (!email) throw new Error('Email address is required.')
  const cleanEmail = email.trim().toLowerCase()

  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase credentials are not configured in .env. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    )
  }

  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    })

    if (error) throw error
    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Signs out the current user session from Supabase Auth.
 */
export async function signOut() {
  if (!isSupabaseConfigured) {
    return { error: null }
  }

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('fetch failed')) {
      return { error: null }
    }
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Sends a password reset email to the user.
 * @param {string} email
 */
export async function resetPasswordForEmail(email) {
  if (!email) throw new Error('Email address is required.')
  const cleanEmail = email.trim().toLowerCase()

  // Rate limit: prevent spam / brute-force password recovery triggers
  consumeRateLimit(`auth:reset:${cleanEmail}`, RATE_LIMIT_PRESETS.AUTH_PASSWORD_RESET)

  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase credentials are not configured in .env. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    )
  }

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://collabspace.app'
    const redirectTo = `${origin}/reset-password`
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo,
      }
    )

    if (error) throw error
    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Updates the user's password using Supabase Auth updateUser.
 * @param {string} newPassword
 */
export async function updatePassword(newPassword) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials are not configured in .env.')
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Fetches user profile from public.profiles table.
 * @param {string} userId
 */
export async function getProfile(userId) {
  if (!isSupabaseConfigured || !userId) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.warn('[CollabSpace Auth] Profile record not found:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('[CollabSpace Auth] Profile fetch error:', err.message)
    return null
  }
}

/**
 * Updates profile in public.profiles and auth user_metadata.
 * @param {string} userId
 * @param {{ fullName?: string, avatarUrl?: string }} updates
 */
export async function updateProfile(userId, { fullName, avatarUrl }) {
  if (!isSupabaseConfigured || !userId) {
    throw new Error('Supabase credentials are not configured in .env.')
  }

  try {
    const payload = {
      updated_at: new Date().toISOString(),
    }

    if (fullName !== undefined) payload.full_name = fullName.trim()
    if (avatarUrl !== undefined) payload.avatar_url = avatarUrl.trim()

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // Synchronize auth user_metadata
    if (fullName !== undefined || avatarUrl !== undefined) {
      await supabase.auth.updateUser({
        data: {
          ...(fullName !== undefined ? { full_name: fullName.trim() } : {}),
          ...(avatarUrl !== undefined ? { avatar_url: avatarUrl.trim() } : {}),
        },
      })
    }

    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Retrieves the current session.
 */
export async function getSession() {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data } = await supabase.auth.getSession()
  return data.session
}
