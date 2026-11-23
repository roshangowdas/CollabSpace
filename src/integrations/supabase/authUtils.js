/**
 * Reusable Supabase Authentication Utilities for CollabSpace.
 */
import { supabase } from './client'
import { handleDatabaseError } from './errorHandler'

/**
 * Gets the current authenticated session from cache or memory.
 * @returns {Promise<import('@supabase/supabase-js').Session | null>}
 */
export async function getActiveSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data?.session || null
  } catch (err) {
    console.warn('[CollabSpace] getActiveSession error:', err.message)
    return null
  }
}

/**
 * Gets the current user object.
 * @returns {Promise<import('@supabase/supabase-js').User | null>}
 */
export async function getActiveUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data?.user || null
  } catch {
    return null
  }
}

/**
 * Checks if a session is currently active.
 * @returns {Promise<boolean>}
 */
export async function isUserLoggedIn() {
  const session = await getActiveSession()
  return Boolean(session?.user)
}

/**
 * Extracts a formatted display name from user metadata or email.
 * @param {import('@supabase/supabase-js').User | { full_name?: string, email?: string }} user
 * @returns {string}
 */
export function getUserDisplayName(user) {
  if (!user) return 'Guest'
  if (user.full_name) return user.full_name
  if (user.user_metadata?.full_name) return user.user_metadata.full_name
  if (user.email) return user.email.split('@')[0]
  return 'User'
}

/**
 * Generates 1-2 character initials from user name or email.
 * @param {import('@supabase/supabase-js').User | { full_name?: string, email?: string }} user
 * @returns {string}
 */
export function getUserInitials(user) {
  const name = getUserDisplayName(user)
  if (!name || name === 'Guest') return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Subscribes to auth state changes and returns cleanup function.
 * @param {(event: string, session: import('@supabase/supabase-js').Session | null) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToAuthChanges(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => {
    subscription?.unsubscribe()
  }
}

