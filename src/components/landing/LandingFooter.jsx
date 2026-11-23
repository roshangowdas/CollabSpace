import React from 'react'
import { Link } from 'react-router-dom'
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'

export function LandingFooter() {
  const scrollTo = (href) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="border-t bg-muted/40 text-muted-foreground" role="contentinfo" aria-label="CollabSpace Site Footer">
      {/* Bottom CTA Pre-footer banner */}
      <div className="border-b bg-gradient-to-b from-transparent to-muted/60 py-16 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto rounded-lg border border-border bg-card p-8 sm:p-12 text-center space-y-6 shadow-21 backdrop-blur relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Ready to Accelerate Your Team’s Velocity?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Join modern software teams shipping faster with CollabSpace. Start your free 14-day team trial today.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/register">
              <Button size="lg" variant="brand" rightIcon={ArrowRight}>
                Get Started Free
              </Button>
            </Link>

            <a href="#features" onClick={() => scrollTo('#features')}>
              <Button size="lg" variant="outline">
                Explore Features
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand & Business Details */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-subtle">
                <Layers className="h-4 w-4" />
              </div>
              <span className="font-bold text-base text-foreground tracking-tight">
                Collab<span className="text-brand">Space</span>
              </span>
            </Link>

            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              The high-velocity team collaboration SaaS. Kanban sprint boards, real-time channels, collaborative documentation, and multi-tenant security.
            </p>

            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-brand" />
                CollabSpace Technologies Pvt. Ltd.
              </div>
              <div>Bangalore, Karnataka, India • PIN: 560001</div>
              <div>Grievance Desk: <a href="mailto:grievance@collabspace.app" className="text-brand hover:underline">grievance@collabspace.app</a></div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">All systems operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3 text-xs">
            <h3 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Product
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" onClick={() => scrollTo('#features')} className="hover:text-foreground">
                  Sprint Kanban
                </a>
              </li>
              <li>
                <a href="#features" onClick={() => scrollTo('#features')} className="hover:text-foreground">
                  Realtime Channels
                </a>
              </li>
              <li>
                <a href="#features" onClick={() => scrollTo('#features')} className="hover:text-foreground">
                  Collaborative Docs
                </a>
              </li>
              <li>
                <a href="#pricing" onClick={() => scrollTo('#pricing')} className="hover:text-foreground">
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3 text-xs">
            <h3 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" onClick={() => scrollTo('#features')} className="hover:text-foreground">
                  Feature Suite
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={() => scrollTo('#how-it-works')} className="hover:text-foreground">
                  Architecture
                </a>
              </li>
              <li>
                <a href="#faq" onClick={() => scrollTo('#faq')} className="hover:text-foreground">
                  Frequently Asked
                </a>
              </li>
              <li>
                <Link to="/design-system" className="hover:text-foreground">
                  Design System
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3 text-xs">
            <h3 className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Account
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-foreground">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-foreground">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-foreground">
                  Forgot Password
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance (New dedicated column) */}
          <div className="space-y-3 text-xs">
            <h3 className="font-semibold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              Legal & Trust
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="hover:text-foreground font-medium text-brand">
                  Privacy Policy (DPDP)
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-foreground">
                  Refund & Cancellation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and legal pill strip */}
        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            &copy; {new Date().getFullYear()} CollabSpace Technologies Private Limited. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link to="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
            <span className="text-border/80">•</span>
            <Link to="/terms" className="hover:text-foreground hover:underline">Terms of Service</Link>
            <span className="text-border/80">•</span>
            <Link to="/cookies" className="hover:text-foreground hover:underline">Cookie Policy</Link>
            <span className="text-border/80">•</span>
            <Link to="/refund" className="hover:text-foreground hover:underline">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
