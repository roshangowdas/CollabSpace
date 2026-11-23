import React from 'react'
import { LegalLayout } from './LegalLayout'
import { FileText, ShieldAlert, CheckCircle, Scale, Building } from 'lucide-react'

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service & Conditions"
      subtitle="The binding legal contract governing your access to and usage of the CollabSpace software-as-a-service collaboration platform."
      lastUpdated="November 22, 2026"
    >
      <div className="space-y-8 text-foreground/90 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">1.</span> Agreement & Acceptance of Terms
          </h2>
          <p>
            These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Customer,&quot; &quot;User,&quot; or &quot;You&quot;)
            and <strong>CollabSpace Technologies Private Limited</strong> (&quot;CollabSpace,&quot; &quot;Company,&quot; &quot;we,&quot; or &quot;us&quot;).
          </p>
          <p>
            By accessing, creating an account, accepting an invitation, or utilizing any feature of the CollabSpace SaaS platform, you affirm that you are at least 18 years of age, legally capable of entering into binding contracts under the Indian Contract Act, 1872, and authorized to bind your enterprise or organization.
            If you do not agree to all provisions of these Terms, you must discontinue access immediately.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">2.</span> Account Registration & Workspace Administration
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Account Security:</strong> You are solely responsible for maintaining the confidentiality of your login credentials and authentication tokens. Any action performed under your account is deemed performed by you.
            </li>
            <li>
              <strong>Workspace Ownership:</strong> The organization or individual designated as the initial &quot;Owner&quot; of a workspace exercises administrative sovereignty over that workspace, including member invitations, role assignments (Admin, Member, Viewer, Guest), and data retention settings.
            </li>
            <li>
              <strong>Accurate Information:</strong> You agree to provide true, accurate, and complete registration details and maintain prompt updates if your email or profile information changes.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">3.</span> Acceptable Use Policy (AUP)
          </h2>
          <p>You agree not to misuse CollabSpace or assist others in doing so. You shall NOT:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-2 text-xs">
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="font-semibold text-destructive block">Prohibited Content</span>
              <p className="text-muted-foreground">Upload defamatory, abusive, sexually explicit, infringing, discriminatory, or unlawful content under Indian or international laws.</p>
            </div>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="font-semibold text-destructive block">Security Interference</span>
              <p className="text-muted-foreground">Probe, scan, reverse-engineer, benchmark, or exploit database RLS policies, WebSockets, or service endpoints.</p>
            </div>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="font-semibold text-destructive block">Malicious Code</span>
              <p className="text-muted-foreground">Inject viruses, trojans, worms, logic bombs, ransomware, or malicious scripts into chat channels or documents.</p>
            </div>
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <span className="font-semibold text-destructive block">Unsolicited Spam</span>
              <p className="text-muted-foreground">Send bulk promotional spam, phishing links, or unauthorized advertising through workspace invitation APIs.</p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">4.</span> Intellectual Property & Data Ownership
          </h2>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-4 rounded-xl border border-brand/20 bg-brand/5 space-y-2">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Customer Content Belongs 100% to Customer
              </h4>
              <p className="text-muted-foreground">
                You retain all right, title, interest, and intellectual property ownership in and to all tasks, sprint backlogs, chat records, uploaded documents, code snippets, and whiteboard assets (&quot;Customer Data&quot;). CollabSpace claims zero ownership over your proprietary team data.
                You grant CollabSpace strictly a limited, non-exclusive license to host, synchronize, and display your data solely as required to provide the SaaS services to you.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
              <h4 className="font-bold text-foreground">CollabSpace Intellectual Property</h4>
              <p className="text-muted-foreground">
                All platform software, user interface components, algorithms, databases, logos, product names, and visual designs are the exclusive intellectual property of CollabSpace Technologies Pvt. Ltd. and protected under Indian and international copyright and trademark laws.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">5.</span> Subscription Fees, Billing & Upgrades
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Billing Cycle:</strong> Paid subscriptions are billed in advance on a recurring monthly or annual basis depending on your plan selection.
            </li>
            <li>
              <strong>Sample & Production Pricing:</strong> Pricing displayed on marketing pages is denominated in USD or Indian Rupees (INR) as indicated, exclusive of applicable statutory Goods and Services Tax (GST) unless stated otherwise.
            </li>
            <li>
              <strong>Modifications:</strong> We reserve the right to revise subscription fees upon providing at least thirty (30) days advance notice to workspace administrators.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">6.</span> Service Availability & Disclaimer of Warranties
          </h2>
          <p>
            While CollabSpace targets 99.9% availability and implements resilient PostgreSQL replication:
          </p>
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 text-xs font-mono uppercase tracking-wide leading-relaxed text-muted-foreground">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE COLLABSPACE PLATFORM IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR UNINTERRUPTED ERROR-FREE OPERATION.
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">7.</span> Limitation of Liability
          </h2>
          <p>
            IN NO EVENT SHALL COLLABSPACE TECHNOLOGIES PVT. LTD., ITS DIRECTORS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS, DATA CORRUPTION, BUSINESS INTERRUPTION, OR PROCUREMENT OF SUBSTITUTE SERVICES).
          </p>
          <p className="text-xs text-muted-foreground">
            OUR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE USE OF THE SERVICES SHALL NOT EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY YOU TO COLLABSPACE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR FIVE THOUSAND INDIAN RUPEES (INR 5,000), WHICHEVER IS LESS.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">8.</span> Governing Law & Dispute Resolution (Jurisdiction)
          </h2>
          <p>
            These Terms, and any dispute or claim arising out of or in connection with them, shall be governed by and construed in accordance with the <strong>laws of the Republic of India</strong>, without regard to conflict of law principles.
          </p>
          <p>
            Any dispute shall first be referred to mutual consultation. If unresolved within thirty (30) days, it shall be referred to and finally resolved by binding arbitration seated in <strong>Bengaluru, Karnataka, India</strong> under the provisions of the <strong>Arbitration and Conciliation Act, 1996</strong> by a sole arbitrator mutually agreed upon. The language of arbitration shall be English.
            Subject to arbitration, the competent courts located in <strong>Bengaluru, Karnataka</strong> shall have exclusive jurisdiction.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">9.</span> DMCA & Copyright Infringement Takedown Notices
          </h2>
          <p>
            CollabSpace respects intellectual property rights and complies with Section 79 of the Information Technology Act, 2000 and global copyright standards. If you believe your copyrighted work has been infringed on a CollabSpace workspace, submit a formal written notice to our designated agent:
          </p>
          <p className="text-xs font-mono bg-muted/40 p-3 rounded-lg border border-border/60">
            Email: legal@collabspace.app<br />
            Attention: Copyright & Legal Compliance Officer<br />
            Include: Identification of the copyrighted work, description of location, your contact details, and statement under penalty of perjury.
          </p>
        </section>
      </div>
    </LegalLayout>
  )
}

export default TermsPage
