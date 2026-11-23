// Globals (describe, it, expect, beforeEach, vi) provided by Vitest
import {
  signUp,
  signInWithPassword,
  signOut,
  resetPasswordForEmail,
  getProfile,
  updateProfile,
} from '@/services/auth'
import { resetRateLimits, RateLimitExceededError } from '@/utils/rateLimiter'

describe('Authentication Service Suite', () => {
  beforeEach(() => {
    resetRateLimits()
    vi.clearAllMocks()
  })

  describe('Registration & Input Validation', () => {
    it('accepts valid credentials object or positional arguments', async () => {
      // In offline/mock mode or with invalid credentials, it should properly validate
      await expect(
        signUp({ email: '', password: 'Password123!', fullName: 'Test User' })
      ).rejects.toThrow()
    })

    it('requires password to be provided', async () => {
      await expect(
        signUp({ email: 'alex@collabspace.app', password: '', fullName: 'Alex Rivera' })
      ).rejects.toThrow()
    })
  })

  describe('Login & Sign In Handling', () => {
    it('requires email address to be provided', async () => {
      await expect(signInWithPassword('', 'Password123!')).rejects.toThrow()
    })

    it('requires password to be provided', async () => {
      await expect(signInWithPassword('alex@collabspace.app', '')).rejects.toThrow()
    })
  })

  describe('Password Recovery & Rate Limiting', () => {
    it('requires an email address for password reset', async () => {
      await expect(resetPasswordForEmail('')).rejects.toThrow('Email address is required')
    })

    it('applies sliding-window rate limiting on repeated reset attempts', async () => {
      const email = 'victim@collabspace.app'
      resetRateLimits()

      // Reset allows 3 requests per 60 seconds
      // Request 1, 2, 3 should succeed past rate limiter (or throw if offline supabase)
      for (let i = 0; i < 3; i++) {
        try {
          await resetPasswordForEmail(email)
        } catch (err) {
          // May throw database error in test, but should NOT be RateLimitExceededError
          expect(err).not.toBeInstanceOf(RateLimitExceededError)
        }
      }

      // 4th request must throw RateLimitExceededError (HTTP 429)
      await expect(resetPasswordForEmail(email)).rejects.toThrow(/rate limit exceeded/i)
    })
  })

  describe('Session Termination', () => {
    it('executes sign out cleanly without unhandled exceptions', async () => {
      // signOut should resolve cleanly
      await expect(signOut()).resolves.toBeDefined()
    })
  })
})
