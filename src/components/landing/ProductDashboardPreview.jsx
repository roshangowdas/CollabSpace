import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Kanban,
  ListFilter,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Plus,
  MessageSquare,
  FileText,
  Users,
  Bell,
  MoreHorizontal,
  Hash,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Circle
} from 'lucide-react'
import { Badge, Avatar, AvatarGroup, Button } from '@/components/ui'

export function ProductDashboardPreview() {
  const [activeTab, setActiveTab] = useState('kanban')

  const kanbanColumns = [
    {
      id: 'backlog',
      title: 'BACKLOG',
      count: 6,
      dotColor: 'bg-muted-foreground',
      cards: [
        {
          id: 'CS-101',
          title: 'Set up cluster telemetry & Prometheus alerts',
          tags: [
            { label: 'Low', variant: 'secondary' },
            { label: 'DevOps', variant: 'outline' },
          ],
          assignee: 'David Chen',
          comments: 2,
        },
        {
          id: 'CS-102',
          title: 'Integrate Webhook alerts for GitHub PR merges',
          tags: [
            { label: 'Backend', variant: 'outline' },
          ],
          assignee: 'Alex Rivera',
          comments: 4,
        },
      ],
    },
    {
      id: 'todo',
      title: 'TO DO',
      count: 14,
      dotColor: 'bg-amber-500',
      cards: [
        {
          id: 'CS-103',
          title: 'Implement Row Level Security (RLS) for tenant isolation',
          tags: [
            { label: 'High', variant: 'destructive' },
            { label: 'Security', variant: 'brand' },
          ],
          assignee: 'Sarah Jenkins',
          comments: 7,
        },
        {
          id: 'CS-104',
          title: 'Sales pipeline monitoring & transaction charts',
          tags: [
            { label: 'Medium', variant: 'warning' },
            { label: 'CRM', variant: 'secondary' },
          ],
          assignee: 'Marcus Vance',
          comments: 1,
        },
      ],
    },
    {
      id: 'in-progress',
      title: 'IN PROGRESS',
      count: 4,
      dotColor: 'bg-brand',
      cards: [
        {
          id: 'CS-105',
          title: 'Supabase Realtime WebSocket presence channel sync',
          tags: [
            { label: 'Critical', variant: 'destructive' },
            { label: 'Realtime', variant: 'brand' },
          ],
          assignee: 'Elena Rostova',
          comments: 9,
        },
      ],
    },
    {
      id: 'done',
      title: 'DONE',
      count: 28,
      dotColor: 'bg-emerald-500',
      cards: [
        {
          id: 'CS-106',
          title: 'Commercial SaaS Design System & UI tokens',
          tags: [
            { label: 'Done', variant: 'success' },
            { label: 'Design', variant: 'outline' },
          ],
          assignee: 'Sarah Jenkins',
          comments: 12,
        },
      ],
    },
  ]

  const inboxMessages = [
    {
      id: 1,
      sender: 'Elizabeth Reynolds',
      action: 'mentioned you in',
      target: 'Q4 Product Roadmap',
      time: '8m ago',
      unread: true,
      avatar: 'ER',
    },
    {
      id: 2,
      sender: 'Sonya Wolf',
      action: 'joined workspace',
      target: 'Next Platform Project',
      time: '14m ago',
      unread: false,
      avatar: 'SW',
    },
    {
      id: 3,
      sender: 'Kenny Osinski',
      action: 'commented in #general',
      target: '"Realtime sync is live with <50ms latency!"',
      time: '25m ago',
      unread: false,
      avatar: 'KO',
    },
  ]

  return (
    <section className="relative px-4 sm:px-8 max-w-7xl mx-auto pb-20">
      {/* Glow Beam Background inspired by reference image */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-80 bg-brand/20 blur-[130px] -z-10 rounded-full pointer-events-none" />

      {/* Main Container Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative rounded-lg border border-border bg-card shadow-21 overflow-hidden"
      >
        {/* Top Window Bar */}
        <div className="flex h-11 items-center justify-between border-b border-border/60 bg-muted/40 px-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-destructive/60" />
            <span className="h-3 w-3 rounded-full bg-amber-500/60" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
            <span className="ml-3 font-mono text-[11px] text-muted-foreground/80 hidden sm:inline">
              collabspace.app / acme-inc / engineering-tracker
            </span>
          </div>

          <div className="flex items-center gap-1 bg-background/80 rounded-lg p-0.5 border shadow-subtle">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'kanban'
                  ? 'bg-primary text-primary-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sprint Kanban
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-primary text-primary-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Live Channels
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'docs'
                  ? 'bg-primary text-primary-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Collaborative Docs
            </button>
          </div>
        </div>

        {/* Inner App Interface */}
        <div className="grid grid-cols-12 min-h-[520px]">
          {/* Micro App Sidebar */}
          <div className="hidden lg:flex col-span-2 flex-col border-r border-border/60 bg-sidebar/50 p-3 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs">
                  CS
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-foreground truncate">Acme Core</div>
                  <span className="text-[10px] text-brand font-medium">Sprint 4 Active</span>
                </div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-background/80 border text-center space-y-1">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                Sprint Progress
              </div>
              <div className="text-xl font-bold text-foreground">68%</div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full w-[68%]" />
              </div>
            </div>

            <div className="space-y-1 text-xs font-medium text-muted-foreground">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Workspace
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent text-accent-foreground font-medium">
                <Kanban className="h-3.5 w-3.5 text-brand" />
                <span>Issues & Boards</span>
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent/50 hover:text-foreground">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Channels</span>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 hover:text-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>Documentation</span>
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 hover:text-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Team Directory</span>
              </div>
            </div>

            <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar name="Sarah Jenkins" size="xs" status="online" />
                <span className="text-[11px] text-foreground font-medium truncate">Sarah J.</span>
              </div>
              <Badge variant="brand" size="sm" className="text-[9px] px-1 py-0">PRO</Badge>
            </div>
          </div>

          {/* Main Board Center Area */}
          <div className="col-span-12 lg:col-span-7 flex flex-col p-4 sm:p-5 border-r border-border/60 overflow-x-auto">
            {/* Header / Filter bar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
              <div className="space-y-0.5">
                <div className="text-[11px] text-muted-foreground font-mono">
                  Projects / CRM / Sprint S4
                </div>
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  Sprint Backlog & Realtime Pipeline
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <AvatarGroup max={3} size="sm">
                  <Avatar name="Sarah Jenkins" fallback="SJ" />
                  <Avatar name="Alex Rivera" fallback="AR" />
                  <Avatar name="David Chen" fallback="DC" />
                  <Avatar name="Elena Rostova" fallback="ER" />
                </AvatarGroup>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1 items-start">
              {kanbanColumns.map((col) => (
                <div key={col.id} className="rounded-xl bg-muted/40 p-2.5 space-y-2.5 border border-border/40">
                  <div className="flex items-center justify-between text-xs font-semibold px-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                      <span className="text-[11px] tracking-wide text-foreground">{col.title}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">{col.count}</span>
                  </div>

                  <div className="space-y-2">
                    {col.cards.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-lg border bg-card p-3 shadow-subtle hover:border-brand/40 transition-colors space-y-2"
                      >
                        <span className="text-[10px] font-mono text-muted-foreground block">
                          {card.id}
                        </span>
                        <h4 className="text-xs font-medium text-foreground leading-snug">
                          {card.title}
                        </h4>
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex flex-wrap gap-1">
                            {card.tags.map((t) => (
                              <Badge key={t.label} variant={t.variant} size="sm" className="text-[9px] px-1.5 py-0">
                                {t.label}
                              </Badge>
                            ))}
                          </div>
                          <Avatar name={card.assignee} size="xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Live Inbox / Activity Panel (matching Huly style) */}
          <div className="hidden sm:flex col-span-12 lg:col-span-3 flex-col p-4 bg-muted/20">
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                <Bell className="h-3.5 w-3.5 text-brand" />
                <span>Live Inbox & Activity</span>
              </div>
              <Badge variant="brand" size="sm" dot ping>
                Live
              </Badge>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {inboxMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg border bg-card shadow-subtle space-y-1.5 text-xs transition-colors hover:border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={msg.sender} fallback={msg.avatar} size="xs" status="online" />
                      <span className="font-semibold text-foreground truncate max-w-[110px]">
                        {msg.sender}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {msg.action}{' '}
                    <strong className="text-foreground font-medium">{msg.target}</strong>
                  </p>
                </div>
              ))}

              <div className="p-3 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                <span className="block font-medium text-foreground mb-0.5">50ms Sync Active</span>
                All channel updates are broadcast via Supabase Realtime WebSockets.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

