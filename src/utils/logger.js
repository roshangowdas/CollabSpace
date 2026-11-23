// ==============================================================================
// CollabSpace Security Utility: Controlled Debug Logger
// File: src/utils/logger.js
// Description:
//   Controlled logging utility that supports runtime/environment debug mode
//   while automatically sanitizing and redacting sensitive tokens, passwords,
//   and credentials to prevent information leakage in production.
// ==============================================================================

const SENSITIVE_KEYS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'apikey',
  'anon_key',
  'service_role',
  'authorization',
]

/**
 * Recursively redacts sensitive keys from log data
 * @param {any} data
 * @returns {any} Redacted data
 */
function redactSensitiveData(data) {
  if (!data) return data
  if (typeof data === 'string') {
    // Redact JWT tokens
    return data.replace(/eyJh[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g, '[REDACTED_JWT]')
  }
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData)
  }
  if (typeof data === 'object') {
    const sanitized = {}
    for (const [key, value] of Object.entries(data)) {
      const isSensitive = SENSITIVE_KEYS.some((sensitive) =>
        key.toLowerCase().includes(sensitive)
      )
      if (isSensitive) {
        sanitized[key] = '[REDACTED_SECRET]'
      } else {
        sanitized[key] = redactSensitiveData(value)
      }
    }
    return sanitized
  }
  return data
}

/**
 * Checks whether debug mode is currently active
 * Enabled if:
 * 1. localStorage.getItem('collabspace:debug') === 'true'
 * 2. VITE_DEBUG_MODE === 'true'
 * 3. Vite development server (import.meta.env.DEV)
 */
export function isDebugMode() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const local = window.localStorage.getItem('collabspace:debug')
    if (local === 'true') return true
    if (local === 'false') return false
  }
  return (
    import.meta.env.VITE_DEBUG_MODE === 'true' ||
    import.meta.env.DEV ||
    import.meta.env.VITE_APP_ENV === 'development'
  )
}

/**
 * Programmatically enable or disable debug mode at runtime
 * @param {boolean} enabled
 */
export function setDebugMode(enabled) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('collabspace:debug', enabled ? 'true' : 'false')
    console.info(`[CollabSpace Security] Debug mode has been set to: ${enabled ? 'ENABLED' : 'DISABLED'}`)
  }
}

export const logger = {
  /**
   * Diagnostic debug log — only active in debug mode
   */
  debug(...args) {
    if (isDebugMode()) {
      const sanitized = args.map(redactSensitiveData)
      console.debug('[CollabSpace:DEBUG]', ...sanitized)
    }
  },

  /**
   * Informational event log
   */
  info(...args) {
    if (isDebugMode()) {
      const sanitized = args.map(redactSensitiveData)
      console.info('[CollabSpace:INFO]', ...sanitized)
    }
  },

  /**
   * Warning log — always displayed
   */
  warn(...args) {
    const sanitized = args.map(redactSensitiveData)
    console.warn('[CollabSpace:WARN]', ...sanitized)
  },

  /**
   * Error log — sanitized stack and details
   */
  error(...args) {
    const sanitized = args.map((arg) => {
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: redactSensitiveData(arg.message),
          stack: isDebugMode() ? arg.stack : undefined,
        }
      }
      return redactSensitiveData(arg)
    })
    console.error('[CollabSpace:ERROR]', ...sanitized)
  },

  /**
   * Security audit and telemetry log
   */
  security(event, details = {}) {
    const payload = redactSensitiveData(details)
    console.warn(`[CollabSpace:SECURITY_ALERT] ${event}`, payload)
  },
}
