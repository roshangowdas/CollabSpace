import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Check,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  Zap
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge } from '@/components/ui'

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  const plans = [
    {
      name: 'Starter Plan',
      tagline: 'Ideal for exploratory teams and open-source projects.',
      monthlyPrice: 0,
      annualPrice: 0,
      highlight: false,
      badge: 'Free Forever',
      cta: 'Start for Free',
      features: [
        'Up to 5 workspace members',
        '3 active sprint boards',
        'Unlimited public channels',
        '1 GB encrypted cloud storage',
        'Standard community support',
        'Real-time WebSocket sync',
      ],
    },
    {
      name: 'Pro Team Plan',
      tagline: 'Full power for high-velocity software and product teams.',
      monthlyPrice: 15,
      annualPrice: 12,
      highlight: true,
      badge: 'Most Popular',
      cta: 'Start 14-Day Free Trial',
      features: [
        'Unlimited workspace members',
        'Unlimited sprint boards & backlogs',
        'Private channels & direct messages',
        '50 GB encrypted cloud storage',
        'Role-Based Access Control (RBAC)',
        'Priority email & chat support',
        'Full markdown spec documentation',
        'Custom workspace subdomain',
      ],
    },
    {
      name: 'Enterprise Plan',
      tagline: 'Tailored for scale, strict compliance, and dedicated support.',
      monthlyPrice: 35,
      annualPrice: 29,
      highlight: false,
      badge: 'Dedicated Scale',
      cta: 'Contact Sales',
      features: [
        'Dedicated PostgreSQL database tier',
        'Custom SAML SSO & Okta integration',
        'Unlimited cloud storage',
        'Comprehensive audit logs & export',
        '99.9% target availability (Enterprise MSA)',
        'Dedicated technical account manager',
        'Custom legal agreements & BAA',
      ],
    },
  ]

  return (
    <section id="pricing" className="py-20 md:py-28 border-t bg-background scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-semibold text-brand">
            Sample Pricing
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Transparent Plans for Teams of Any Size
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Simple, predictable pricing with zero hidden fees. Clearly labelled sample tiers designed for demonstration and evaluation.
          </p>

          {/* Billing Interval Switcher */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span
              className={`text-xs font-medium cursor-pointer ${
                !isAnnual ? 'text-foreground font-bold' : 'text-muted-foreground'
              }`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly Billing
            </span>

            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-primary"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isAnnual ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setIsAnnual(true)}>
              <span
                className={`text-xs font-medium ${
                  isAnnual ? 'text-foreground font-bold' : 'text-muted-foreground'
                }`}
              >
                Annual Billing
              </span>
              <Badge variant="brand" size="sm" className="text-[10px]">
                Save 20%
              </Badge>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, index) => {
            const price = isAnnual ? p.annualPrice : p.monthlyPrice
            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
                className="flex"
              >
                <Card
                  className={`flex flex-col justify-between w-full p-6 sm:p-8 transition-all duration-200 ${
                    p.highlight
                      ? 'border-brand ring-1 ring-brand shadow-modal bg-card relative'
                      : 'border-border/80 bg-card hover:border-brand/40 shadow-subtle'
                  }`}
                >
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="brand" size="sm" className="shadow-subtle">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                        {!p.highlight && (
                          <Badge variant="secondary" size="sm">
                            {p.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.tagline}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">
                        ${price}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.monthlyPrice === 0 ? 'forever' : '/ user / month'}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-border/60">
                      <span className="text-xs font-semibold text-foreground">Included features:</span>
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        {p.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8">
                    <Link to="/register" className="w-full block">
                      <Button
                        variant={p.highlight ? 'brand' : 'outline'}
                        className="w-full"
                        size="lg"
                        rightIcon={ArrowRight}
                      >
                        {p.cta}
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground max-w-lg mx-auto pt-4 space-y-2">
          <p className="border-t pt-4">
            * Note: These are sample plans for demonstration purposes. All paid tiers include our 14-day evaluation trial and money-back guarantee. Read our{' '}
            <Link to="/refund" className="text-brand hover:underline font-medium">
              Refund &amp; Cancellation Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  )
}

