import React from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Kanban,
  FileText,
  ShieldCheck,
  Zap,
  Users,
  Bell,
  Lock,
  ArrowRight
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui'

const FEATURES = [
  {
    icon: Kanban,
    title: 'High-Velocity Kanban Boards',
    description:
      'Manage complex sprint cycles, backlogs, priorities, and deadlines with drag-and-drop workflow columns synchronized across your entire team in real time.',
    badge: 'Sprint Management',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Channels & Threads',
    description:
      'Zero-latency team messaging powered by Supabase WebSocket channels. Topic-specific streams, instant mentions, reactions, and typing indicators.',
    badge: '50ms Latency',
  },
  {
    icon: FileText,
    title: 'Collaborative Notes & Specs',
    description:
      'Live markdown documents and engineering specs integrated directly with your issues. Link notes to tasks without switching between multiple apps.',
    badge: 'Unified Docs',
  },
  {
    icon: ShieldCheck,
    title: 'PostgreSQL Row Level Security',
    description:
      'Strict multi-tenant data isolation enforced directly at the database engine level. Never rely on leaky frontend-only role checks.',
    badge: 'Enterprise Security',
  },
  {
    icon: Users,
    title: 'Granular Workspace RBAC',
    description:
      'Easily administer team permissions with tailored roles: Owner, Admin, Member, and Guest Viewer. Protect proprietary files and settings.',
    badge: 'Multi-Tenancy',
  },
  {
    icon: Bell,
    title: 'Consolidated Activity Stream',
    description:
      'Never miss a critical task assignment, PR merge, or team mention with an intelligent unified activity stream and instant Sonner toast alerts.',
    badge: 'Smart Inbox',
  },
]

export function FeatureOverview() {
  return (
    <section id="features" className="py-20 md:py-28 border-t bg-muted/20 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-semibold text-brand">
            <Zap className="h-3.5 w-3.5" />
            Core Capabilities
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Engineered for Modern Product Teams
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Eliminate context switching between disconnected tools. CollabSpace consolidates your team's essential daily workflows into one seamless interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, index) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Card className="h-full border-border/80 bg-card hover:border-brand/40 hover:shadow-subtle transition-all duration-200">
                  <CardHeader className="p-6 pb-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
                        {feat.badge}
                      </Badge>
                    </div>

                    <CardTitle className="text-lg font-semibold tracking-tight text-foreground pt-1">
                      {feat.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feat.description}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

