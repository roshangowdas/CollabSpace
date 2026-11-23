import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Users, CheckCircle, Clock, ListTodo } from 'lucide-react'

export function MemberDistributionChart({ members = [] }) {
  if (!members || members.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Member Task Distribution
          </CardTitle>
          <CardDescription>Team member workload and assignments</CardDescription>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          No team members with assigned tasks in this scope.
        </CardContent>
      </Card>
    )
  }

  // Find max tasks for proportional bar scaling
  const maxTasks = Math.max(...members.map((m) => m.total), 1)

  return (
    <Card className="border-border/60 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Member Task Distribution
            </CardTitle>
            <CardDescription>Workload across collaborators</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Todo
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 flex-1">
        {members.map((member) => {
          const completedWidth = member.total > 0 ? (member.completed / member.total) * 100 : 0
          const inProgressWidth = member.total > 0 ? (member.inProgress / member.total) * 100 : 0
          const pendingWidth = member.total > 0 ? (member.pending / member.total) * 100 : 0

          return (
            <div
              key={member.userId}
              className="p-2.5 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 truncate">
                  <Avatar
                    src={member.avatar}
                    name={member.name}
                    className="w-7 h-7 text-xs border border-border"
                  />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {member.name}
                    </p>
                    {member.username && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        @{member.username}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs shrink-0">
                  <div className="text-right">
                    <span className="font-bold text-foreground">{member.total}</span>
                    <span className="text-[11px] text-muted-foreground ml-1">tasks</span>
                  </div>
                  {member.overdue > 0 && (
                    <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      {member.overdue} overdue
                    </span>
                  )}
                </div>
              </div>

              {/* Stacked Segment Bar */}
              <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden flex">
                {member.completed > 0 && (
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${completedWidth}%` }}
                    title={`Completed: ${member.completed}`}
                  />
                )}
                {member.inProgress > 0 && (
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${inProgressWidth}%` }}
                    title={`In Progress: ${member.inProgress}`}
                  />
                )}
                {member.pending > 0 && (
                  <div
                    className="bg-slate-400 h-full transition-all duration-300"
                    style={{ width: `${pendingWidth}%` }}
                    title={`Todo: ${member.pending}`}
                  />
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {member.completed} completed
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {member.inProgress} in progress
                </span>
                <span className="text-slate-500 font-medium">
                  {member.pending} pending
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
