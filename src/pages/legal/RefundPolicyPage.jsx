import React from 'react'
import { LegalLayout } from './LegalLayout'
import { CreditCard, CheckCircle2, Clock, AlertCircle, HelpCircle, Mail } from 'lucide-react'

export function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Subscription Cancellation & Refund Policy"
      subtitle="Clear and fair terms governing subscription renewals, cancellations, trials, and refund eligibility for CollabSpace paid tiers."
      lastUpdated="November 22, 2026"
    >
      <div className="space-y-8 text-foreground/90 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">1.</span> 14-Day Free Evaluation Trial
          </h2>
          <p>
            We believe you should evaluate CollabSpace with your real team before making any financial commitment.
            All new organizations receive a <strong>14-day free trial</strong> with access to Pro Team features.
            No credit card is required to initiate the trial. If you do not upgrade to a paid plan at the conclusion of the trial period, your workspace automatically reverts to the Starter Free plan without any charge.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">2.</span> 14-Day Money-Back Guarantee (First Purchase)
          </h2>
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>100% Risk-Free Initial Purchase Guarantee</span>
            </div>
            <p>
              If you purchase a paid CollabSpace plan (monthly or annual) and find that the software does not meet your team’s workflow requirements, you are eligible for a <strong>full 100% refund</strong> if requested within <strong>fourteen (14) calendar days</strong> of your initial payment date.
            </p>
            <p className="text-muted-foreground">
              To claim this guarantee, simply send an email to <a href="mailto:billing@collabspace.app" className="text-brand font-mono font-medium hover:underline">billing@collabspace.app</a> with your workspace name and account email. No questions asked.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">3.</span> How to Cancel Your Subscription
          </h2>
          <p>
            You can cancel your recurring subscription at any time without penalty or contacting sales:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>Log in to CollabSpace as a Workspace Owner or Administrator.</li>
            <li>Navigate to <strong>Workspace Admin &gt; Settings &gt; Billing &amp; Subscriptions</strong>.</li>
            <li>Click <strong>&quot;Cancel Subscription&quot;</strong> and confirm your cancellation.</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2">
            Upon cancellation, your paid subscription will remain active until the end of your current paid billing period (month or year). You will retain full access to all paid features and project boards until that date, after which your account will transition to the free Starter tier without automatic renewal.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">4.</span> Recurring Renewals & Pro-Rata Policy
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li>
              <strong>Monthly Plans:</strong> Monthly billing is non-refundable after the initial 14-day money-back guarantee period has expired. We do not offer prorated refunds for partial month usage.
            </li>
            <li>
              <strong>Annual Plans:</strong> Annual plans provide significant billing discounts. If you cancel an annual subscription after the initial 14 days, you may request a prorated refund for unused full future months remaining, minus the standard non-discounted monthly rate for elapsed months.
            </li>
            <li>
              <strong>Enterprise Contracts:</strong> Bespoke Enterprise Master Service Agreements (MSAs) with custom invoicing terms are governed strictly by the refund provisions stipulated in the signed contract.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">5.</span> Refund Processing Timelines
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-brand" />
                Review & Approval
              </span>
              <p className="text-muted-foreground">Refund requests are reviewed and approved by our finance desk within two (2) business days.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                Bank Credit Window
              </span>
              <p className="text-muted-foreground">Approved refunds are credited to the original payment method (Card, UPI, or NetBanking) within 5 to 7 banking days.</p>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
            <span className="text-brand">6.</span> Chargeback & Payment Disputes
          </h2>
          <p>
            We encourage users to contact our support desk directly before initiating a chargeback or dispute with their issuing bank. Unwarranted chargebacks may result in temporary suspension of workspace access pending verification.
          </p>
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-foreground">Need Assistance with a Charge or Invoice?</span>
              <p className="text-muted-foreground">Our billing team is available Monday through Friday, 9:00 AM - 6:00 PM IST.</p>
            </div>
            <a
              href="mailto:billing@collabspace.app"
              className="px-3.5 py-1.5 rounded-lg bg-brand text-primary-foreground font-semibold hover:bg-brand/90 transition-colors shrink-0"
            >
              Contact Billing Desk
            </a>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}

export default RefundPolicyPage
