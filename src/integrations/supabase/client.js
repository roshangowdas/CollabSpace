import { createClient } from '@supabase/supabase-js'

/**
 * Normalizes a Supabase project URL by removing trailing REST endpoints or slashes.
 * Ensures compatibility if VITE_SUPABASE_URL contains /rest/v1/ or trailing slashes.
 * @param {string} url
 * @returns {string}
 */
export function normalizeSupabaseUrl(url) {
  if (!url) return ''
  let cleaned = url.trim()
  // Strip trailing /rest/v1/ or /rest/v1
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '')
  // Strip any trailing slash
  cleaned = cleaned.replace(/\/+$/, '')
  return cleaned
}

/**
 * Validates the current Supabase environment configuration.
 * @returns {{
 *   isValid: boolean,
 *   rawUrl: string,
 *   normalizedUrl: string,
 *   anonKey: string,
 *   keySnippet: string,
 *   errors: string[]
 * }}
 */
export function validateSupabaseConfig() {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  const errors = []

  if (!rawUrl) {
    errors.push('VITE_SUPABASE_URL is missing in environment variables.')
  } else if (!rawUrl.startsWith('https://') && !rawUrl.startsWith('http://')) {
    errors.push('VITE_SUPABASE_URL must start with https:// or http://')
  }

  if (!anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing in environment variables.')
  } else if (anonKey.length < 15) {
    errors.push('VITE_SUPABASE_ANON_KEY appears too short to be a valid key.')
  }

  const normalizedUrl = normalizeSupabaseUrl(rawUrl)
  const isPlaceholder =
    rawUrl.includes('your-project') ||
    rawUrl.includes('placeholder') ||
    anonKey.includes('your-anon-key')

  if (isPlaceholder) {
    errors.push('Placeholder values detected in environment variables.')
  }

  const isValid = errors.length === 0

  return {
    isValid,
    rawUrl,
    normalizedUrl,
    anonKey,
    keySnippet: anonKey ? `${anonKey.slice(0, 10)}...${anonKey.slice(-4)}` : 'None',
    errors,
  }
}

// Perform config validation
export const configValidation = validateSupabaseConfig()
export const isSupabaseConfigured = configValidation.isValid

// Safe initialization URL & key
const clientUrl = isSupabaseConfigured
  ? configValidation.normalizedUrl
  : 'https://collabspace-unconfigured.supabase.co'

const clientKey = isSupabaseConfigured
  ? configValidation.anonKey
  : 'collabspace-unconfigured-anon-key'

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.info(
    '[CollabSpace] Supabase environment is pending configuration. Update .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

/**
 * Primary Supabase Client instance for CollabSpace.
 */
export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'collabspace-auth-token',
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
})

/**
 * Checks the live connection status of the Supabase instance.
 * Measures response latency and reports operational status.
 * @returns {Promise<{
 *   ok: boolean,
 *   latencyMs: number,
 *   message: string,
 *   details: {
 *     rest: boolean,
 *     auth: boolean,
 *     normalizedUrl: string
 *   }
 * }>}
 */
export async function checkSupabaseConnection() {
  const validation = validateSupabaseConfig()

  if (!validation.isValid) {
    return {
      ok: false,
      latencyMs: 0,
      message: validation.errors[0] || 'Supabase configuration is invalid.',
      details: {
        rest: false,
        auth: false,
        normalizedUrl: validation.normalizedUrl,
      },
    }
  }

  const startTime = performance.now()

  try {
    // 1. Probe Auth endpoint
    const { error: authError } = await supabase.auth.getSession()

    // 2. Probe REST endpoint (probe schema without throwing error)
    const { error: restError } = await supabase
      .from('profiles')
      .select('count')
      .limit(0)

    const endTime = performance.now()
    const latencyMs = Math.round(endTime - startTime)

    // In Supabase, if connection succeeds, even if table is empty or requires auth,
    // the HTTP status is 200 or 401/PGRST204, confirming host reachability
    const isRestReachable = !restError || restError.code === 'PGRST116' || restError.code === 'PGRST204' || restError.code === '42501'
    const isAuthReachable = !authError

    const isConnected = isAuthReachable && isRestReachable

    return {
      ok: isConnected,
      latencyMs,
      message: isConnected
        ? `Connected to Supabase in ${latencyMs}ms.`
        : 'Reached endpoint, but received restricted response.',
      details: {
        rest: isRestReachable,
        auth: isAuthReachable,
        normalizedUrl: validation.normalizedUrl,
      },
    }
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime)
    return {
      ok: false,
      latencyMs,
      message: err.message || 'Failed to connect to Supabase server.',
      details: {
        rest: false,
        auth: false,
        normalizedUrl: validation.normalizedUrl,
      },
    }
  }
}
