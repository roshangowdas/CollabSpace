import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import {
  Activity,
  CheckCircle2,
  Clock,
  UserCheck,
  PlusCircle,
  FileEdit,
} from 'lucide-react'

function formatRelativeTime(dateString) {
  if (!dateString) return 'recently'
  const date = new Date(dateString)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 7 * 86400) return `${Math.floor(diffSec / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getActionBadge(action) {
  switch (action) {
    case 'status_changed':
      return { label: 'Status Update', icon: Clock, color: 'text-blue-500 bg-blue-500/10' }
    case 'completed':
      return { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' }
    case 'assigned':
      return { label: 'Assigned', icon: UserCheck, color: 'text-indigo-500 bg-indigo-500/10' }
    case 'created':
      return { label: 'Created', icon: PlusCircle, color: 'text-purple-500 bg-purple-500/10' }
    default:
      return { label: 'Updated', icon: FileEdit, color: 'text-slate-500 bg-slate-500/10' }
  }
}

export function RecentActivityFeed({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Live audit timeline of workspace changes</CardDescription>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          No recent activity logged in this scope.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Recent Activities
            </CardTitle>
            <CardDescription>Live project and task audit trail</CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] font-normal">
            {activities.length} recent
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {activities.map((act) => {
          const badge = getActionBadge(act.action)
          const Icon = badge.icon
          return (
            <div
              key={act.id}
              className="flex items-start gap-3 p-2.5 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <Avatar
                src={act.userAvatar}
                name={act.userName}
                className="w-7 h-7 text-xs border border-border mt-0.5 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {act.userName}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatRelativeTime(act.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-foreground/90 font-medium truncate mt-0.5">
                  {act.entityTitle}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {badge.label}
                  </span>
                  {act.details?.new_status && (
                    <span className="text-[10px] text-muted-foreground">
                      → <span className="font-medium text-foreground">{act.details.new_status}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
