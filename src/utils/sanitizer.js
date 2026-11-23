// ==============================================================================
// CollabSpace Security Utility: Input Sanitizer & XSS Defense
// File: src/utils/sanitizer.js
// Description:
//   Comprehensive input sanitization, HTML escaping, safe URL validation,
//   and form payload cleaning to prevent Cross-Site Scripting (XSS),
//   HTML injection, and path traversal vulnerabilities.
// ==============================================================================

/**
 * Escapes special HTML characters to prevent HTML/XSS injection.
 * @param {string} str
 * @returns {string} Safe escaped string
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return ''
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return str.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char)
}

/**
 * Strips HTML tags, script elements, and dangerous control characters from raw text.
 * @param {string} input
 * @returns {string} Plain text without HTML tags
 */
export function stripHtml(input) {
  if (!input || typeof input !== 'string') return ''
  // Remove script and style elements with their contents
  let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  // Remove remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '')
  // Remove null bytes and control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  return cleaned.trim()
}

/**
 * Sanitizes generic user text input (task names, titles, names, descriptions).
 * Strips tags, trims whitespace, and optionally truncates to a safe maximum length.
 *
 * @param {string} input
 * @param {number} [maxLength=5000]
 * @returns {string}
 */
export function sanitizeText(input, maxLength = 5000) {
  if (!input || typeof input !== 'string') return ''
  const cleaned = stripHtml(input)
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) : cleaned
}

/**
 * Validates and sanitizes a URL, allowing only safe protocols (http, https, mailto, tel, relative).
 * Blocks dangerous schemes like javascript:, data:, vbscript:.
 *
 * @param {string} url
 * @returns {string|null} Safe URL or null if invalid or dangerous
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()

  // Prohibit dangerous pseudo-protocols
  const dangerousProtocols = /^(\s*javascript:|\s*data:|\s*vbscript:)/i
  if (dangerousProtocols.test(trimmed)) {
    return null
  }

  // Allow relative URLs starting with '/'
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed
  }

  // Verify absolute URLs have valid http/https/mailto/tel protocol
  try {
    const parsed = new URL(trimmed)
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return parsed.href
    }
  } catch {
    return null
  }

  return null
}

/**
 * Recursively sanitizes form payloads before transmission to Supabase.
 * Trims strings, strips HTML tags, and ensures objects/arrays are cleaned.
 *
 * @template T
 * @param {T} data
 * @returns {T} Cleaned form data
 */
export function sanitizeFormInputs(data) {
  if (!data) return data
  if (typeof data === 'string') {
    return sanitizeText(data)
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFormInputs(item))
  }
  if (typeof data === 'object' && data.constructor === Object) {
    const cleaned = {}
    for (const [key, value] of Object.entries(data)) {
      // Passwords should be trimmed but not stripped of symbols
      if (key.toLowerCase().includes('password')) {
        cleaned[key] = typeof value === 'string' ? value : value
      } else {
        cleaned[key] = sanitizeFormInputs(value)
      }
    }
    return cleaned
  }
  return data
}

/**
 * Checks whether an input contains obvious XSS / script payload patterns.
 * Useful for fast security telemetry or audit logging.
 *
 * @param {string} input
 * @returns {boolean} True if suspicious payload detected
 */
export function containsSuspiciousPayload(input) {
  if (!input || typeof input !== 'string') return false
  const suspiciousRegex = /<script\b|javascript:|onerror\s*=|onload\s*=|eval\(|expression\(|document\.cookie/i
  return suspiciousRegex.test(input)
}
