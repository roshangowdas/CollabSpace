import React, { useState } from 'react'
import {
  History,
  ShieldAlert,
  UserCheck,
  UserX,
  UserPlus,
  PlusCircle,
  FileEdit,
  FolderPlus,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  Layers,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

function getActivityBadge(action) {
  switch (action) {
    case 'member_joined':
    case 'invited':
      return {
        label: 'Member Joined',
        color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
        icon: UserPlus,
      }
    case 'role_changed':
      return {
        label: 'Role Changed',
        color: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
        icon: UserCheck,
      }
    case 'member_removed':
      return {
        label: 'Member Removed',
        color: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
        icon: UserX,
      }
    case 'project_created':
    case 'created':
      return {
        label: 'Project Created',
        color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
        icon: FolderPlus,
      }
    case 'task_completed':
    case 'completed':
      return {
        label: 'Task Completed',
        color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
        icon: CheckCircle2,
      }
    case 'task_assigned':
    case 'assigned':
      return {
        label: 'Task Assigned',
        color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
        icon: UserCheck,
      }
    case 'status_changed':
      return {
        label: 'Status Change',
        color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20',
        icon: ArrowRight,
      }
    default:
      return {
        label: 'Workspace Event',
        color: 'text-slate-600 bg-slate-500/10 border-slate-500/20',
        icon: Activity,
      }
  }
}

export function AdminActivityTab({ activities = [] }) {
  const [filter, setFilter] = useState('all')

  const filtered = activities.filter((act) => {
    if (filter === 'all') return true
    if (filter === 'members') {
      return ['member_joined', 'invited', 'role_changed', 'member_removed'].includes(act.action)
    }
    if (filter === 'projects') {
      return ['project_created', 'created', 'project_updated', 'project_archived'].includes(act.action)
    }
    if (filter === 'tasks') {
      return ['task_completed', 'completed', 'task_assigned', 'assigned', 'status_changed'].includes(act.action)
    }
    return act.action === filter
  })

  return (
    <div className="space-y-4">
      {/* Top Header & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Workspace Activity & Audit Trail
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete timeline of member events, project additions, task assignments, and status updates.
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Workspace Events</option>
          <option value="members">Member Events</option>
          <option value="projects">Project Events</option>
          <option value="tasks">Task & Status Events</option>
          <option value="role_changed">Role Modifications</option>
          <option value="task_completed">Task Completions</option>
        </select>
      </div>

      {/* Activity Timeline Card */}
      <Card className="border-border/60 overflow-hidden">
        {filtered.length === 0 ? (
          <CardContent className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Activity className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">No Activities Recorded</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
              Workspace actions like member joins, project creations, and task changes will automatically appear here.
            </p>
          </CardContent>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((act) => {
              const badge = getActivityBadge(act.action)
              const Icon = badge.icon
              const actorName = act.user?.full_name || act.user?.username || 'Team Member'

              return (
                <div
                  key={act.id}
                  className="p-3.5 flex items-start gap-3 hover:bg-muted/20 transition-colors text-xs"
                >
                  <Avatar
                    src={act.user?.avatar_url}
                    name={actorName}
                    className="w-8 h-8 text-xs border border-border shrink-0 mt-0.5"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{actorName}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 px-1.5 font-medium border ${badge.color}`}
                        >
                          <Icon className="w-3 h-3 mr-1 inline" />
                          {badge.label}
                        </Badge>
                      </div>

                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {act.created_at
                          ? new Date(act.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </span>
                    </div>

                    <p className="text-foreground/90 font-medium mt-1">
                      {act.entity_title || act.description || 'Workspace event'}
                    </p>

                    {act.details && (
                      <div className="mt-1 text-[11px] text-muted-foreground font-mono bg-muted/40 p-1.5 rounded inline-block">
                        {act.details.old_role && act.details.new_role
                          ? `Role updated: ${act.details.old_role} → ${act.details.new_role}`
                          : act.details.previous_role
                          ? `Removed role: ${act.details.previous_role}`
                          : act.details.new_status
                          ? `Status: ${act.details.old_status || 'todo'} → ${act.details.new_status}`
                          : act.details.assigned_to
                          ? `Assigned to: ${act.details.assigned_to}`
                          : typeof act.details === 'string'
                          ? act.details
                          : JSON.stringify(act.details)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
