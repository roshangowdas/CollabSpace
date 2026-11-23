import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cookie,
  ShieldCheck,
  Check,
  X,
  Settings,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui'

const STORAGE_KEY = 'collabspace_cookie_consent'

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [preferences, setPreferences] = useState({
    essential: true, // Always true and locked
    functional: true,
    analytics: false,
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        // Small delay so it doesn't pop aggressively on immediate load
        const timer = setTimeout(() => setIsVisible(true), 1200)
        return () => clearTimeout(timer)
      }
    } catch {
      // In case of restricted localStorage
      setIsVisible(false)
    }
  }, [])

  const handleSaveConsent = (choices) => {
    try {
      const payload = {
        ...choices,
        timestamp: new Date().toISOString(),
        version: '1.0',
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore write errors in sandbox
    }
    setIsVisible(false)
    setIsModalOpen(false)
  }

  const handleAcceptAll = () => {
    handleSaveConsent({
      essential: true,
      functional: true,
      analytics: true,
    })
  }

  const handleRejectNonEssential = () => {
    handleSaveConsent({
      essential: true,
      functional: false,
      analytics: false,
    })
  }

  if (!isVisible) return null

  return (
    <>
      {/* 1. Floating Bottom Banner */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 md:left-auto md:right-8 md:max-w-xl z-50 pointer-events-auto"
          role="region"
          aria-label="Cookie and Privacy Consent"
        >
          <div className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-21 text-foreground space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-md bg-brand/10 text-brand shrink-0 mt-0.5">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Cookie & Storage Notice
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    DPDP Act 2023
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  CollabSpace uses strictly necessary local storage to keep your session authenticated and enforce multi-tenant Row Level Security.
                  We do <strong>not</strong> sell your data or use cross-site ad trackers.{' '}
                  <Link to="/cookies" className="text-brand hover:underline font-medium inline-flex items-center gap-0.5">
                    Read Cookie Policy
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors flex items-center gap-1.5"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Customize</span>
              </button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRejectNonEssential}
                className="text-xs"
              >
                Reject Non-Essential
              </Button>

              <Button
                type="button"
                size="sm"
                variant="brand"
                onClick={handleAcceptAll}
                className="text-xs"
              >
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 2. Customization Preferences Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-21 text-foreground space-y-5"
              role="dialog"
              aria-labelledby="cookie-settings-title"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-brand" />
                  <h3 id="cookie-settings-title" className="text-base font-bold">
                    Cookie & Storage Preferences
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Category 1: Strictly Necessary */}
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">Strictly Necessary Storage</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 font-semibold">
                        Always Active
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Essential for user authentication, maintaining active WebSocket connections, and enforcing Row Level Security. Cannot be disabled.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand opacity-60 cursor-not-allowed"
                  />
                </div>

                {/* Category 2: Functional Preferences */}
                <div className="p-3.5 rounded-xl border border-border/60 bg-card flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground">Functional State (Theme & Workspace)</span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Remembers your dark/light theme choice, active workspace selection, and sidebar layout to prevent interface flickering.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="pref-functional"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences((p) => ({ ...p, functional: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand cursor-pointer"
                  />
                </div>

                {/* Category 3: Anonymized Analytics */}
                <div className="p-3.5 rounded-xl border border-border/60 bg-card flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground">Anonymized Performance Telemetry</span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Helps us identify client-side performance bottlenecks and errors. No personal data is attached.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="pref-analytics"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <Link
                  to="/cookies"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs text-brand hover:underline"
                >
                  Learn more in Cookie Policy
                </Link>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="brand"
                    onClick={() => handleSaveConsent(preferences)}
                    className="text-xs"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default CookieConsentBanner
