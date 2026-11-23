import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  FileText,
  Cookie,
  CreditCard,
  Building2,
  Mail,
  ArrowLeft,
  Layers,
  ExternalLink
} from 'lucide-react'
import { LandingNavbar, LandingFooter } from '@/components/landing'
import { Badge } from '@/components/ui'

const LEGAL_TABS = [
  { path: '/privacy', label: 'Privacy Policy', icon: ShieldCheck, subtitle: 'DPDP Act 2023 & GDPR' },
  { path: '/terms', label: 'Terms & Conditions', icon: FileText, subtitle: 'SaaS Agreement' },
  { path: '/cookies', label: 'Cookie Policy', icon: Cookie, subtitle: 'Storage & Consent' },
  { path: '/refund', label: 'Refund Policy', icon: CreditCard, subtitle: 'Cancellations & Refunds' },
]

export function LegalLayout({ title, subtitle, lastUpdated, children }) {
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-brand/20 selection:text-brand">
      {/* Navbar */}
      <LandingNavbar />

      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Back button and Breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                DPDP Act 2023 Compliant
              </Badge>
              <Badge variant="secondary" className="text-[11px] font-mono">
                Last Updated: {lastUpdated || 'November 22, 2026'}
              </Badge>
            </div>
          </div>

          {/* Header */}
          <div className="border-b border-border/60 pb-6 space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Business Entity Details Card */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-brand/10 text-brand shrink-0 mt-0.5">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">
                  CollabSpace Technologies Private Limited
                </div>
                <div className="text-muted-foreground leading-normal">
                  Registered Data Fiduciary • Bangalore, Karnataka, India • PIN: 560001
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-muted-foreground border-t md:border-t-0 md:border-l border-border/60 pt-3 md:pt-0 md:pl-5">
              <div className="space-y-0.5">
                <span className="font-medium text-foreground block">Grievance & Privacy Desk:</span>
                <a
                  href="mailto:grievance@collabspace.app"
                  className="text-brand hover:underline flex items-center gap-1 font-mono"
                >
                  <Mail className="h-3 w-3" />
                  grievance@collabspace.app
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-border/60 pb-4">
            {LEGAL_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = location.pathname === tab.path
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isActive
                      ? 'border-brand/40 bg-brand/5 shadow-subtle text-foreground'
                      : 'border-border/60 bg-card/60 hover:bg-card hover:border-border text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-brand' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-semibold ${isActive ? 'text-foreground' : ''}`}>
                      {tab.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {tab.subtitle}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Content Document */}
          <div className="prose prose-sm dark:prose-invert max-w-none bg-card border border-border rounded-lg p-6 sm:p-10 shadow-subtle space-y-6">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  )
}

export default LegalLayout
