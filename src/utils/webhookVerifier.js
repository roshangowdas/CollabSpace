// ==============================================================================
// CollabSpace Security Utility: Webhook Signature Verification
// File: src/utils/webhookVerifier.js
// Description:
//   Validates incoming webhook signatures using HMAC SHA-256 with constant-time
//   comparison to prevent timing attacks and timestamp verification to prevent
//   replay attacks.
// ==============================================================================

/**
 * Constant-time string comparison to prevent timing attack side-channels.
 * @param {string} a
 * @param {string} b
 * @returns {boolean} True if strings are strictly equal
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false

  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Computes HMAC-SHA256 digest in pure browser/Node environments.
 * @param {string} payload
 * @param {string} secret
 * @returns {Promise<string>} Hex-encoded HMAC digest
 */
export async function computeHmacSha256(payload, secret) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      encoder.encode(payload)
    )
    const hashArray = Array.from(new Uint8Array(signatureBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  // Fallback for Node.js backend environments
  try {
    const nodeCrypto = await import('crypto')
    return nodeCrypto.createHmac('sha256', secret).update(payload).digest('hex')
  } catch {
    throw new Error('HMAC SHA-256 requires Web Crypto API or Node.js crypto module.')
  }
}

/**
 * Verifies an incoming webhook signature.
 *
 * @param {object} params
 * @param {string} params.payload Raw request payload string
 * @param {string} params.signature Header signature (e.g. `sha256=...` or raw hex)
 * @param {string} params.secret Webhook signing secret
 * @param {number} [params.timestamp] Optional Unix timestamp in milliseconds for replay defense
 * @param {number} [params.toleranceSeconds=300] Max allowed clock drift (default 5 minutes)
 * @returns {Promise<{ isValid: boolean, error?: string }>}
 */
export async function verifyWebhookSignature({
  payload,
  signature,
  secret,
  timestamp = null,
  toleranceSeconds = 300,
}) {
  if (!payload || !signature || !secret) {
    return { isValid: false, error: 'Missing required webhook payload, signature, or secret.' }
  }

  // 1. Replay attack verification if timestamp is provided
  if (timestamp) {
    const now = Date.now()
    const ageSeconds = Math.abs((now - Number(timestamp)) / 1000)
    if (ageSeconds > toleranceSeconds) {
      return {
        isValid: false,
        error: `Webhook timestamp expired (${Math.round(ageSeconds)}s old > ${toleranceSeconds}s limit). Possible replay attack.`,
      }
    }
  }

  // 2. Extract clean hex signature (strips 'sha256=' prefix if present)
  const cleanSignature = signature.replace(/^sha256=/, '').trim().toLowerCase()

  try {
    const expectedSignature = await computeHmacSha256(payload, secret)
    const isMatch = timingSafeEqual(cleanSignature, expectedSignature.toLowerCase())

    if (!isMatch) {
      return { isValid: false, error: 'Webhook signature verification failed.' }
    }

    return { isValid: true }
  } catch (err) {
    return { isValid: false, error: err.message }
  }
}
