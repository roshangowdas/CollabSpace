// ==============================================================================
// CollabSpace Security Utility: Rate Limiter
// File: src/utils/rateLimiter.js
// Description:
//   Sliding-window rate limiter for sensitive operations:
//   - Authentication & password recovery requests
//   - Workspace member invitations
//   - Bulk file uploads
//   - Administrative role changes & deletions
//   Prevents brute-force, resource exhaustion, and abuse vectors.
// ==============================================================================

export class RateLimitExceededError extends Error {
  constructor(message, retryAfterSeconds = 60) {
    super(message || `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`)
    this.name = 'RateLimitExceededError'
    this.status = 429
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/**
 * In-memory sliding window request timestamps
 * Key -> Array<number> (timestamps in ms)
 */
const rateLimitBuckets = new Map()

/**
 * Default preset rate limits for sensitive actions
 */
export const RATE_LIMIT_PRESETS = {
  // Sign in attempts: max 5 requests per 60 seconds per email/IP
  AUTH_SIGNIN: { maxRequests: 5, windowMs: 60 * 1000, label: 'Sign-in attempt' },

  // Sign up attempts: max 5 registrations per 60 seconds
  AUTH_SIGNUP: { maxRequests: 5, windowMs: 60 * 1000, label: 'Sign-up attempt' },

  // Admin login attempts: max 5 attempts per 60 seconds
  ADMIN_LOGIN: { maxRequests: 5, windowMs: 60 * 1000, label: 'Admin login attempt' },

  // Password reset / recovery: max 3 requests per 60 seconds
  AUTH_PASSWORD_RESET: { maxRequests: 3, windowMs: 60 * 1000, label: 'Password reset' },

  // Invitations dispatch: max 10 invitations per 60 seconds
  WORKSPACE_INVITATION: { maxRequests: 10, windowMs: 60 * 1000, label: 'Workspace invitation' },

  // Rapid file uploads: max 25 uploads per 60 seconds
  FILE_UPLOAD: { maxRequests: 25, windowMs: 60 * 1000, label: 'File upload' },

  // Sensitive admin operations: max 15 operations per 60 seconds
  ADMIN_ACTION: { maxRequests: 15, windowMs: 60 * 1000, label: 'Administrative action' },

  // Realtime broadcast events: max 60 per 10 seconds
  REALTIME_BROADCAST: { maxRequests: 60, windowMs: 10 * 1000, label: 'Live broadcast' },
}

/**
 * Checks whether an action key is within rate limits.
 *
 * @param {string} key Identifier (e.g. `invite:workspace_uuid`, `auth:user@email.com`)
 * @param {{ maxRequests: number, windowMs: number, label?: string }} [options]
 * @returns {{ allowed: boolean, remaining: number, resetInMs: number, retryAfterSeconds: number }}
 */
export function checkRateLimit(key, options = {}) {
  const maxRequests = options.maxRequests || 10
  const windowMs = options.windowMs || 60 * 1000
  const now = Date.now()
  const windowStart = now - windowMs

  let timestamps = rateLimitBuckets.get(key) || []
  // Filter out expired timestamps outside the sliding window
  timestamps = timestamps.filter((ts) => ts > windowStart)
  rateLimitBuckets.set(key, timestamps)

  const count = timestamps.length
  const allowed = count < maxRequests
  const remaining = Math.max(0, maxRequests - count)
  const oldest = timestamps[0] || now
  const resetInMs = Math.max(0, windowMs - (now - oldest))
  const retryAfterSeconds = Math.ceil(resetInMs / 1000)

  return {
    allowed,
    remaining,
    resetInMs,
    retryAfterSeconds,
  }
}

/**
 * Consumes a rate limit token or throws RateLimitExceededError if limit is reached.
 *
 * @param {string} key
 * @param {{ maxRequests: number, windowMs: number, label?: string }} [options]
 * @returns {{ remaining: number, resetInMs: number }}
 */
export function consumeRateLimit(key, options = {}) {
  const result = checkRateLimit(key, options)

  if (!result.allowed) {
    const label = options.label || 'Sensitive operation'
    throw new RateLimitExceededError(
      `${label} rate limit exceeded. Please wait ${result.retryAfterSeconds}s before retrying.`,
      result.retryAfterSeconds
    )
  }

  const timestamps = rateLimitBuckets.get(key) || []
  timestamps.push(Date.now())
  rateLimitBuckets.set(key, timestamps)

  return {
    remaining: result.remaining - 1,
    resetInMs: result.resetInMs,
  }
}

/**
 * Clears rate limiting timestamps for a given key or all keys.
 * Useful for automated tests or after successful verification.
 *
 * @param {string} [key]
 */
export function resetRateLimits(key) {
  if (key) {
    rateLimitBuckets.delete(key)
  } else {
    rateLimitBuckets.clear()
  }
}
