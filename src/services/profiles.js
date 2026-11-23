import { supabase, isSupabaseConfigured } from '@/integrations/supabase'
import { handleDatabaseError } from '@/integrations/supabase/errorHandler'
import { RESERVED_USERNAMES } from '@/utils/validators'

/**
 * Supported avatar image types
 */
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Maximum avatar file size: 5 MB
 */
export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024

/**
 * Fetches user profile from public.profiles table by user ID.
 * Returns only public fields to safeguard user privacy.
 *
 * @param {string} userId
 * @returns {Promise<object | null>}
 */
export async function getProfile(userId) {
  if (!isSupabaseConfigured || !userId) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[CollabSpace Profiles] Profile fetch error:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('[CollabSpace Profiles] Profile fetch exception:', err.message)
    return null
  }
}

/**
 * Fetches a user's public profile by their username.
 * Does not expose email or internal credentials.
 *
 * @param {string} username
 * @returns {Promise<object | null>}
 */
export async function getProfileByUsername(username) {
  if (!isSupabaseConfigured || !username) {
    return null
  }

  try {
    const cleanUsername = username.trim().toLowerCase()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio, role, created_at')
      .ilike('username', cleanUsername)
      .maybeSingle()

    if (error) {
      console.warn('[CollabSpace Profiles] Username lookup error:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('[CollabSpace Profiles] Username lookup exception:', err.message)
    return null
  }
}

/**
 * Checks whether a proposed username is valid and available.
 * Validates format, reserved list, and uniqueness in Supabase PostgreSQL.
 *
 * @param {string} username
 * @param {string} [currentUserId]
 * @returns {Promise<{ available: boolean, reason?: string, isCurrent?: boolean }>}
 */
export async function checkUsernameAvailability(username, currentUserId = null) {
  if (!username || typeof username !== 'string') {
    return { available: false, reason: 'Username is required' }
  }

  const clean = username.trim().toLowerCase()

  // Format validation
  if (clean.length < 3) {
    return { available: false, reason: 'Username must be at least 3 characters' }
  }
  if (clean.length > 30) {
    return { available: false, reason: 'Username cannot exceed 30 characters' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return {
      available: false,
      reason: 'Username can only contain letters, numbers, and underscores',
    }
  }
  if (!/^[a-zA-Z0-9].*[a-zA-Z0-9]$/.test(clean)) {
    return {
      available: false,
      reason: 'Username must start and end with a letter or number',
    }
  }

  // Reserved keyword validation
  if (RESERVED_USERNAMES.includes(clean)) {
    return { available: false, reason: 'This username is reserved' }
  }

  if (!isSupabaseConfigured) {
    // In demo or offline mode, simulate availability
    const mockTaken = ['admin', 'alex', 'demo', 'sarah']
    if (mockTaken.includes(clean) && clean !== 'alex') {
      return { available: false, reason: 'Username is already taken' }
    }
    return { available: true }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', clean)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 indicates no row found with single()
      console.warn('[CollabSpace Profiles] Uniqueness query error:', error.message)
    }

    if (data) {
      // If the found user is the current user, it is their existing username
      if (currentUserId && data.id === currentUserId) {
        return { available: true, isCurrent: true }
      }
      return { available: false, reason: 'This username is already taken' }
    }

    return { available: true }
  } catch (err) {
    console.warn('[CollabSpace Profiles] Uniqueness check exception:', err.message)
    return { available: true }
  }
}

/**
 * Updates a user's profile in the `profiles` table and updates `supabase.auth.updateUser` metadata.
 *
 * @param {string} userId
 * @param {{
 *   fullName?: string,
 *   username?: string,
 *   bio?: string,
 *   avatarUrl?: string
 * }} updates
 * @returns {Promise<object>}
 */
export async function updateProfile(userId, { fullName, username, bio, avatarUrl }) {
  if (!isSupabaseConfigured || !userId) {
    throw new Error('Supabase credentials are not configured in .env.')
  }

  // If username is being updated, verify it is available first
  if (username !== undefined) {
    const availability = await checkUsernameAvailability(username, userId)
    if (!availability.available && !availability.isCurrent) {
      throw new Error(availability.reason || 'This username is not available.')
    }
  }

  try {
    const payload = {
      updated_at: new Date().toISOString(),
    }

    if (fullName !== undefined) payload.full_name = fullName.trim()
    if (username !== undefined) payload.username = username.trim().toLowerCase()
    if (bio !== undefined) payload.bio = bio.trim()
    if (avatarUrl !== undefined) payload.avatar_url = avatarUrl ? avatarUrl.trim() : null

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id, full_name, username, avatar_url, bio, role, created_at, updated_at')
      .single()

    if (error) throw error

    // Sync auth user_metadata
    const metaUpdates = {}
    if (fullName !== undefined) metaUpdates.full_name = fullName.trim()
    if (username !== undefined) metaUpdates.username = username.trim().toLowerCase()
    if (bio !== undefined) metaUpdates.bio = bio.trim()
    if (avatarUrl !== undefined) metaUpdates.avatar_url = avatarUrl ? avatarUrl.trim() : null

    if (Object.keys(metaUpdates).length > 0) {
      await supabase.auth.updateUser({
        data: metaUpdates,
      })
    }

    return data
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Uploads a profile avatar image to Supabase Storage in the 'avatars' bucket.
 * Stores files under `{userId}/{timestamp}-{filename}`.
 * Updates the user's `profiles.avatar_url` automatically.
 *
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<{ publicUrl: string, path: string }>}
 */
export async function uploadAvatar(userId, file) {
  if (!isSupabaseConfigured || !userId) {
    throw new Error('Supabase credentials are not configured in .env.')
  }

  if (!file) {
    throw new Error('No image file selected.')
  }

  // Validate MIME type
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid image format (${file.type}). Please select a JPG, PNG, WEBP, or GIF image.`
    )
  }

  // Validate file size
  if (file.size > MAX_AVATAR_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(
      `File size (${sizeInMb} MB) exceeds maximum allowed limit of 5 MB.`
    )
  }

  try {
    // Sanitize filename and create unique path
    const fileExt = file.name.split('.').pop() || 'png'
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase()
    const filePath = `${userId}/${Date.now()}-${sanitizedName}`

    // 1. Upload to Supabase Storage 'avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    // 2. Obtain Public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    const publicUrl = urlData?.publicUrl
    if (!publicUrl) {
      throw new Error('Failed to retrieve public URL for uploaded avatar.')
    }

    // 3. Update profiles table with new avatar_url
    await updateProfile(userId, { avatarUrl: publicUrl })

    return {
      publicUrl,
      path: filePath,
    }
  } catch (err) {
    const parsed = handleDatabaseError(err)
    throw new Error(parsed.message)
  }
}

/**
 * Removes the user's avatar from their profile.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function removeAvatar(userId) {
  return await updateProfile(userId, { avatarUrl: null })
}

