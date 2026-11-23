import React from 'react'
import {
  FolderKanban,
  CheckSquare,
  CheckCircle2,
  Clock,
  ListTodo,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function AnalyticsStatCards({ metrics = {} }) {
  const {
    totalProjects = 0,
    totalTasks = 0,
    completedTasks = 0,
    pendingTasks = 0,
    inProgressTasks = 0,
    overdueTasks = 0,
    completionPercentage = 0,
  } = metrics

  const statCards = [
    {
      id: 'total-projects',
      label: 'Total Projects',
      value: totalProjects,
      subtext: 'Active in scope',
      icon: FolderKanban,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10',
    },
    {
      id: 'total-tasks',
      label: 'Total Tasks',
      value: totalTasks,
      subtext: 'In selected range',
      icon: CheckSquare,
      iconColor: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'completed-tasks',
      label: 'Completed Tasks',
      value: completedTasks,
      subtext: `${completionPercentage}% completion rate`,
      badge: `${completionPercentage}%`,
      badgeVariant: completionPercentage >= 70 ? 'success' : 'default',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      id: 'in-progress-tasks',
      label: 'In Progress',
      value: inProgressTasks,
      subtext: 'Active & In Review',
      icon: Clock,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'pending-tasks',
      label: 'Pending Tasks',
      value: pendingTasks,
      subtext: 'In Todo queue',
      icon: ListTodo,
      iconColor: 'text-slate-500 dark:text-slate-400',
      bgColor: 'bg-slate-500/10',
    },
    {
      id: 'overdue-tasks',
      label: 'Overdue Tasks',
      value: overdueTasks,
      subtext: overdueTasks > 0 ? 'Requires attention' : 'All deadlines on track',
      badge: overdueTasks > 0 ? 'Urgent' : null,
      badgeVariant: 'destructive',
      icon: AlertTriangle,
      iconColor: overdueTasks > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground',
      bgColor: overdueTasks > 0 ? 'bg-rose-500/10' : 'bg-muted/40',
      urgentBorder: overdueTasks > 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {statCards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.id}
            className={`border transition-all hover:shadow-sm ${
              card.urgentBorder ? 'border-rose-500/40 dark:border-rose-500/30' : 'border-border/60'
            }`}
          >
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {card.label}
                </span>
                <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.iconColor} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </div>
                {card.badge && (
                  <Badge variant={card.badgeVariant} className="text-[10px] px-1.5 py-0 font-medium">
                    {card.badge}
                  </Badge>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground truncate mt-1">
                {card.subtext}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
