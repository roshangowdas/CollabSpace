import React from 'react'
import { motion } from 'framer-motion'
import {
  Layers,
  UserPlus,
  Rocket,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, Badge } from '@/components/ui'

const STEPS = [
  {
    step: '01',
    icon: Layers,
    title: 'Create Your Workspace',
    description:
      'Set up your organization in seconds. CollabSpace provisions an isolated PostgreSQL schema partition with dedicated storage buckets and real-time channels.',
    highlight: 'Instant Provisioning',
  },
  {
    step: '02',
    icon: UserPlus,
    title: 'Invite Teammates & Set Roles',
    description:
      'Invite collaborators via email or direct links. Grant role permissions (Owner, Admin, Member, or Guest) to protect sensitive operational data.',
    highlight: 'Granular RBAC',
  },
  {
    step: '03',
    icon: Rocket,
    title: 'Ship with Real-time Velocity',
    description:
      'Manage tasks across Kanban boards, collaborate in live channels, link project specifications, and monitor team velocity without delays.',
    highlight: '<50ms Latency',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 border-t bg-background scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-semibold text-brand">
            Simple 3-Step Setup
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            How CollabSpace Works
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Go from fragmented messaging apps to a unified, production-ready collaboration environment in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((s, index) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
                className="relative"
              >
                <Card className="h-full border-border/80 bg-card p-6 flex flex-col justify-between space-y-6 hover:border-brand/40 transition-colors">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xl font-extrabold text-brand/40">
                        {s.step}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-subtle">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                      {s.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Outcome:</span>
                    <Badge variant="brand" size="sm">
                      {s.highlight}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

