import React from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Cpu,
  ShieldCheck,
  Sparkles,
  Zap,
  Clock,
  Layers,
  Database
} from 'lucide-react'
import { Card, CardContent, Badge } from '@/components/ui'

const METRICS = [
  {
    value: '<50ms',
    label: 'Realtime Latency',
    desc: 'Instant state hydration via Supabase WebSockets',
  },
  {
    value: '100%',
    label: 'Postgres RLS Isolation',
    desc: 'Database-enforced security boundaries per tenant',
  },
  {
    value: '4-in-1',
    label: 'Tool Consolidation',
    desc: 'Replaces separate chat, task tracker, docs & inbox',
  },
  {
    value: '0s',
    label: 'Context Switching Lag',
    desc: 'All project assets accessible from one unified window',
  },
]

export function CollaborationBenefits() {
  return (
    <section id="benefits" className="py-20 md:py-28 border-t bg-muted/20 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-semibold text-brand">
            <TrendingUp className="h-3.5 w-3.5" />
            Productivity Advantages
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Why Teams Choose CollabSpace
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Engineered from the ground up for modern software companies that refuse to compromise between speed, security, and developer experience.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRICS.map((m, index) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-6 rounded-lg border bg-card text-center space-y-2 shadow-subtle"
            >
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand">
                {m.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-foreground">
                {m.label}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {m.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Technical Advantages Deep Dive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <Card className="p-6 space-y-4 border-border/80 bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Architected with Supabase PostgreSQL
                </h3>
                <span className="text-xs text-muted-foreground">True ACID compliance and enterprise reliability</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Unlike fragile proprietary backends, CollabSpace runs on open-standard PostgreSQL. Every record is protected by Row Level Security (RLS) policies, ensuring your private tasks, discussions, and documents never cross organization borders.
            </p>
          </Card>

          <Card className="p-6 space-y-4 border-border/80 bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  High Performance Vite & React Core
                </h3>
                <span className="text-xs text-muted-foreground">Sub-second page transitions & instant keyboard navigation</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Built with pure ESM modules and TanStack Query state caching. Experience seamless navigation, instantaneous board filters, and responsive design whether working on a 4K studio monitor, tablet, or smartphone.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}

