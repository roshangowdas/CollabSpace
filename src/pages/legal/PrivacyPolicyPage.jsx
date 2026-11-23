import React from 'react'
import { LegalLayout } from './LegalLayout'
import { ShieldCheck, Lock, UserCheck, AlertTriangle, FileCheck, Mail } from 'lucide-react'

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Detailed notice on how CollabSpace processes, protects, and respects your personal data in compliance with India's Digital Personal Data Protection Act, 2023 (DPDP Act) and international data privacy frameworks."
      lastUpdated="November 22, 2026"
    >
      <div className="space-y-8 text-foreground/90 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">1.</span> Introduction & Data Fiduciary Details
          </h2>
          <p>
            Welcome to <strong>CollabSpace</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), operated by{' '}
            <strong>CollabSpace Technologies Private Limited</strong>, an incorporated company having its registered office at{' '}
            Bangalore, Karnataka, India (560001).
          </p>
          <p>
            This Privacy Policy serves as the mandatory statutory notice under <strong>Section 6 of the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act 2023&quot;)</strong>{' '}
            and applicable global data protection regulations (including the EU General Data Protection Regulation &quot;GDPR&quot;). CollabSpace acts as the{' '}
            <strong>Data Fiduciary</strong> regarding your account credentials, and as a <strong>Data Processor</strong> regarding proprietary customer workspace content uploaded by teams.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">2.</span> Personal Data We Collect (Data Minimization Principle)
          </h2>
          <p>
            In strict adherence to the statutory principle of data minimization, CollabSpace collects only the personal data strictly necessary to deliver the SaaS platform services:
          </p>
          <div className="overflow-x-auto my-3">
            <table className="w-full text-left border border-border/60 rounded-lg overflow-hidden text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-foreground font-semibold">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Data Fields</th>
                  <th className="p-3">Purpose & Lawful Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="p-3 font-medium">Account Credentials</td>
                  <td className="p-3 font-mono">Full Name, Work Email Address, Password (hashed)</td>
                  <td className="p-3">Identity verification, user authentication, and workspace invitation matching.</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Profile Metadata</td>
                  <td className="p-3 font-mono">Avatar URL, Username, Job Title / Bio (Optional)</td>
                  <td className="p-3">Team collaboration display, member presence indicators, and mentions.</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Workspace Content</td>
                  <td className="p-3 font-mono">Sprint tasks, project boards, realtime chat messages, documents</td>
                  <td className="p-3">User-directed collaboration; stored under isolated Row Level Security (RLS).</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Technical Telemetry</td>
                  <td className="p-3 font-mono">Session tokens (localStorage), connection timestamps</td>
                  <td className="p-3">Essential security session maintenance and rate-limit abuse prevention.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground italic">
            *We do NOT collect sensitive biological data, financial card numbers (processed by PCI-DSS gateways), or background location trackers.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">3.</span> Lawful Grounds for Processing
          </h2>
          <p>Under the DPDP Act 2023, we process your personal data under the following legitimate grounds:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Consent:</strong> Explicit, affirmative, freely given consent provided when registering an account, accepting an invitation, or toggling cookie preferences.
            </li>
            <li>
              <strong>Performance of Contract:</strong> Delivering the CollabSpace SaaS features requested by your workspace administrator under our Terms of Service.
            </li>
            <li>
              <strong>Compliance with Law:</strong> Adhering to statutory audits, legal investigations, or requests from Indian regulatory bodies (such as CERT-In or Data Protection Board of India).
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">4.</span> Protection of Children’s Personal Data (Section 9 DPDP Act)
          </h2>
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Strict Prohibition on Children’s Data Processing</span>
            </div>
            <p>
              CollabSpace is strictly designed for enterprise business organizations, adult professionals, and software teams.
              In compliance with <strong>Section 9 of the DPDP Act 2023</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>We do not knowingly register, collect, or process personal data of individuals under 18 years of age.</li>
              <li>We do not engage in behavioral monitoring, tracking, or targeted marketing directed at minors.</li>
              <li>If we discover that personal data of a minor has been mistakenly collected, it will be expunged immediately from our databases.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">5.</span> Multi-Tenant Data Isolation & Security Architecture
          </h2>
          <p>
            Security is engineered directly into our infrastructure rather than treated as an afterthought:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Database Row Level Security (RLS):</strong> Every PostgreSQL table validates the authenticated user’s active workspace membership via Supabase RLS before any read or write operation is permitted.
            </li>
            <li>
              <strong>Cryptographic Storage:</strong> Passwords are encrypted using irreversible salted cryptographic hashing. Session tokens are verified on every WebSocket message.
            </li>
            <li>
              <strong>Private Storage Buckets:</strong> Workspace project files and document attachments are stored in private, signed storage buckets requiring authenticated tenant access keys.
            </li>
            <li>
              <strong>Zero Secret Key Leakage:</strong> Client browsers receive strictly scoped anon/public keys. Privileged <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">service_role</code> keys reside exclusively in sandboxed backend edge functions.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">6.</span> Third-Party Sub-Processors & Data Transfers
          </h2>
          <p>
            We <strong>never sell, lease, or monetize</strong> your personal data or uploaded workspace assets to advertisers or data brokers.
            We engage only verified technical infrastructure partners bound by rigorous confidentiality agreements:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li><strong>Supabase Inc.</strong> — Managed PostgreSQL database, authentication services, and private S3-compatible cloud storage.</li>
            <li><strong>Deno Land Inc.</strong> — Serverless Edge Functions for automated team invitations and backend notifications.</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Any cross-border transfer of personal data is executed strictly in compliance with Section 16 of the DPDP Act 2023 and central government notifications.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">7.</span> Your Statutory Rights as a Data Principal (Section 12 & 14)
          </h2>
          <p>
            Under the DPDP Act 2023, you have guaranteed statutory rights regarding your personal data:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <h4 className="font-semibold text-foreground text-xs">Right to Access Information</h4>
              <p className="text-xs text-muted-foreground">Request a plain-language summary of your personal data being processed and identities of Data Fiduciaries.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <h4 className="font-semibold text-foreground text-xs">Right to Correction & Erasure</h4>
              <p className="text-xs text-muted-foreground">Update outdated information or request permanent deletion of your account and personal identifiers.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <h4 className="font-semibold text-foreground text-xs">Right of Grievance Redressal</h4>
              <p className="text-xs text-muted-foreground">Lodge complaints directly with our Grievance Officer and escalate to the Data Protection Board of India.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <h4 className="font-semibold text-foreground text-xs">Right to Nominate (Section 14)</h4>
              <p className="text-xs text-muted-foreground">Nominate an individual who shall exercise your rights in the event of death or legal incapacity.</p>
            </div>
          </div>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">8.</span> Grievance Redressal & Designated Grievance Officer (Section 13)
          </h2>
          <p>
            In accordance with <strong>Section 13 of the DPDP Act 2023</strong> and the <strong>Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>,{' '}
            CollabSpace has designated an official Grievance Officer:
          </p>

          <div className="rounded-xl border border-brand/30 bg-card p-5 space-y-3 shadow-subtle">
            <div className="font-semibold text-foreground text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-brand" />
              Office of the Grievance Redressal Officer
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Designated Officer:</span>
                <span className="font-medium text-foreground">Grievance & Privacy Officer</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Email Address:</span>
                <a href="mailto:grievance@collabspace.app" className="font-mono text-brand font-semibold hover:underline">
                  grievance@collabspace.app
                </a>
              </div>
              <div>
                <span className="text-muted-foreground block">Postal Address:</span>
                <span className="font-medium text-foreground">CollabSpace Technologies Pvt. Ltd., Outer Ring Road, Bangalore 560001, Karnataka, India</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Statutory Response Window:</span>
                <span className="font-medium text-foreground">Within 30 Calendar Days (acknowledged in 48 hours)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">9.</span> Data Retention & Account Deletion
          </h2>
          <p>
            We retain account personal data only for as long as your workspace account remains active. Upon voluntary account deletion or written erasure request:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li>Personal profile identifiers and authentication credentials are purged within 30 days.</li>
            <li>Backups are rotated out within 90 days in accordance with automated disaster-recovery cycles.</li>
            <li>Audit logs essential for statutory tax, fraud prevention, or financial compliance are archived under restricted access.</li>
          </ul>
        </section>

        {/* Section 10 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">10.</span> Policy Amendments
          </h2>
          <p>
            We may revise this Privacy Policy periodically to reflect technological advances, service modifications, or updates to Indian statutory rules.
            Whenever material revisions occur, we will notify registered users via in-app notification banner or email notification before the changes take effect.
          </p>
        </section>
      </div>
    </LegalLayout>
  )
}

export default PrivacyPolicyPage
