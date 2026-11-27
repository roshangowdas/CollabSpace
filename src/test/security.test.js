import { describe, it, expect } from 'vitest'
import {
  timingSafeEqual,
  computeHmacSha256,
  verifyWebhookSignature,
} from '@/utils/webhookVerifier'
import { escapeHtml, stripHtml, sanitizeText } from '@/utils/sanitizer'
import { checkRateLimit, consumeRateLimit, RateLimitExceededError } from '@/utils/rateLimiter'

describe('Security Utilities Suite', () => {
  describe('Timing-Safe Comparison & Webhook Verification', () => {
    it('accurately compares equal strings with constant-time check', () => {
      expect(timingSafeEqual('secret_token_123', 'secret_token_123')).toBe(true)
      expect(timingSafeEqual('secret_token_123', 'secret_token_456')).toBe(false)
      expect(timingSafeEqual('short', 'longer_string')).toBe(false)
      expect(timingSafeEqual(null, 'test')).toBe(false)
    })

    it('computes and validates HMAC-SHA256 webhook signatures', async () => {
      const payload = JSON.stringify({ event: 'task.created', id: '123' })
      const secret = 'whsec_collabspace_super_secret_test'
      const signature = await computeHmacSha256(payload, secret)

      const result = await verifyWebhookSignature({
        payload,
        signature: `sha256=${signature}`,
        secret,
      })

      expect(result.isValid).toBe(true)
    })

    it('rejects tampered or mismatched webhook signatures', async () => {
      const payload = JSON.stringify({ event: 'task.created', id: '123' })
      const secret = 'whsec_collabspace_super_secret_test'

      const result = await verifyWebhookSignature({
        payload,
        signature: 'sha256=0000000000000000000000000000000000000000000000000000000000000000',
        secret,
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('signature verification failed')
    })

    it('detects and rejects expired webhook timestamps (replay attack defense)', async () => {
      const payload = JSON.stringify({ event: 'invoice.paid' })
      const secret = 'whsec_test'
      const signature = await computeHmacSha256(payload, secret)
      const expiredTimestamp = Date.now() - 10 * 60 * 1000 // 10 minutes old

      const result = await verifyWebhookSignature({
        payload,
        signature,
        secret,
        timestamp: expiredTimestamp,
        toleranceSeconds: 300, // 5 min tolerance
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('replay attack')
    })
  })

  describe('Input Sanitization & XSS Defense', () => {
    it('escapes dangerous HTML characters', () => {
      const raw = '<script>alert("XSS")</script>'
      const escaped = escapeHtml(raw)
      expect(escaped).not.toContain('<script>')
      expect(escaped).toContain('&lt;script&gt;')
    })

    it('strips script tags and control characters', () => {
      const dirty = 'Safe Title <script>malicious()</script>\x00'
      const clean = stripHtml(dirty)
      expect(clean).toBe('Safe Title')
    })

    it('sanitizes user text and respects max length limit', () => {
      const longInput = 'A'.repeat(50)
      const sanitized = sanitizeText(longInput, 20)
      expect(sanitized.length).toBe(20)
    })
  })

  describe('Sliding-Window Rate Limiting', () => {
    it('allows requests within window and throws on quota exhaustion', () => {
      const key = `test_rate_limit_${Date.now()}`
      const config = { maxRequests: 3, windowMs: 1000 }

      expect(() => consumeRateLimit(key, config)).not.toThrow()
      expect(() => consumeRateLimit(key, config)).not.toThrow()
      expect(() => consumeRateLimit(key, config)).not.toThrow()

      // 4th request must throw RateLimitExceededError
      expect(() => consumeRateLimit(key, config)).toThrow(RateLimitExceededError)
    })
  })
})
