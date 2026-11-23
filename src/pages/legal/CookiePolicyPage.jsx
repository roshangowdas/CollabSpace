import React from 'react'
import { LegalLayout } from './LegalLayout'
import { Cookie, CheckCircle2, ShieldCheck, Settings, Info } from 'lucide-react'

export function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie & Local Storage Policy"
      subtitle="Transparent disclosure on how CollabSpace utilizes browser local storage and essential session cookies to authenticate users and persist workspace state."
      lastUpdated="November 22, 2026"
    >
      <div className="space-y-8 text-foreground/90 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">1.</span> What Are Cookies & Web Storage?
          </h2>
          <p>
            Cookies are small text files placed on your computer or mobile device when you browse websites.
            Modern Single Page Applications (SPAs) like CollabSpace also utilize HTML5 <strong>Web Storage (<code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">localStorage</code> and <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">sessionStorage</code>)</strong>{' '}
            to securely store cryptographic session tokens, user interface preferences (such as Dark/Light mode), and cached active workspace selections.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">2.</span> Does CollabSpace Need Cookie Consent?
          </h2>
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Zero Advertising or Invasive Cross-Site Trackers</span>
            </div>
            <p>
              Unlike consumer ad-tech websites, CollabSpace does <strong>NOT</strong> embed third-party marketing trackers, Facebook Pixels, or cross-site tracking cookies.
              Under both the <strong>DPDP Act 2023</strong> and the <strong>EU ePrivacy Directive</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Strictly Essential cookies & storage:</strong> Do not require opt-in consent because the service cannot function without them (e.g. keeping you logged in).</li>
              <li><strong>Functional & Analytics preferences:</strong> We provide you an upfront Cookie Consent Banner with full controls to accept or reject optional telemetry.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">3.</span> Inventory of Cookies & Local Storage Items
          </h2>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-left border border-border/60 rounded-lg overflow-hidden text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-foreground font-semibold">
                <tr>
                  <th className="p-3">Key Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Exact Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                <tr>
                  <td className="p-3 font-semibold text-foreground">sb-[project]-auth-token</td>
                  <td className="p-3">Essential (localStorage)</td>
                  <td className="p-3">Persistent (until logout)</td>
                  <td className="p-3 font-sans">Cryptographic JWT bearer session for Supabase authentication and WebSocket authorization.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-foreground">collabspace_theme</td>
                  <td className="p-3">Functional (localStorage)</td>
                  <td className="p-3">1 Year</td>
                  <td className="p-3 font-sans">Persists user visual theme selection (Dark, Light, or System default) to prevent UI flicker.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-foreground">collabspace_current_workspace</td>
                  <td className="p-3">Functional (localStorage)</td>
                  <td className="p-3">Persistent</td>
                  <td className="p-3 font-sans">Remembers the active workspace ID to automatically route returning users to their project sprint board.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-foreground">collabspace_cookie_consent</td>
                  <td className="p-3">Essential (localStorage)</td>
                  <td className="p-3">1 Year</td>
                  <td className="p-3 font-sans">Records your explicit consent choices from our Cookie Consent Banner.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">4.</span> Categories of Storage Used
          </h2>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                1. Strictly Necessary Storage (Always Active)
              </h4>
              <p className="text-xs text-muted-foreground">
                Required for core platform security, authenticating user identities, enforcing Row Level Security, and maintaining WebSocket channels for real-time sprint changes. These cannot be disabled without breaking the application.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1.5">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-brand" />
                2. Functional Storage (Optional)
              </h4>
              <p className="text-xs text-muted-foreground">
                Enhances user experience by remembering your active workspace, sidebar collapsed status, and draft document state to prevent accidental loss of unsaved work.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">5.</span> How You Can Manage or Clear Browser Storage
          </h2>
          <p>
            You have full control over browser storage. You can delete or block storage at any time through your browser settings:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Third-party cookies & Site Data.</li>
            <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data.</li>
            <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data.</li>
            <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and delete cookies and site data.</li>
          </ul>
          <p className="text-xs text-muted-foreground italic">
            *Please note: Clearing your local storage will log you out of your current session, requiring you to re-enter your email and password to access your workspace.
          </p>
        </section>
      </div>
    </LegalLayout>
  )
}

export default CookiePolicyPage
