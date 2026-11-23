import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { FolderKanban, CheckCircle2, AlertCircle } from 'lucide-react'

export function ProjectCompletionChart({ projects = [] }) {
  if (!projects || projects.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-primary" />
            Project Completion
          </CardTitle>
          <CardDescription>Progress across active projects</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm">
          No project data available in this scope.
        </CardContent>
      </Card>
    )
  }

  // Prepare data for Recharts BarChart
  const chartData = projects.map((p) => ({
    name: p.key || p.name.slice(0, 12),
    fullName: p.name,
    completed: p.completed,
    inProgress: p.inProgress,
    pending: p.pending,
    percentage: p.percentage,
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover text-popover-foreground border border-border shadow-md rounded-lg p-3 text-xs space-y-1 z-50">
          <p className="font-semibold text-foreground">{data.fullName}</p>
          <p className="text-emerald-500 font-medium">Completed: {data.completed} tasks</p>
          <p className="text-blue-500">In Progress: {data.inProgress} tasks</p>
          <p className="text-slate-400">Pending: {data.pending} tasks</p>
          <div className="pt-1 border-t border-border/60 font-bold text-foreground">
            Progress: {data.percentage}%
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-border/60 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              Project Completion Percentages
            </CardTitle>
            <CardDescription>
              Task delivery progress across all active projects
            </CardDescription>
          </div>
          <div className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
            {projects.length} Projects
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 flex-1">
        {/* Recharts Stacked Horizontal / Vertical Bar Chart */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                iconType="circle"
              />
              <Bar dataKey="completed" name="Completed" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pending" name="Pending" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Project Progress Breakdown */}
        <div className="space-y-3 pt-2 border-t border-border/60">
          {projects.map((p) => (
            <div key={p.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.color || '#6366f1' }}
                  />
                  <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[280px]">
                    {p.name}
                  </span>
                  {p.key && (
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1 py-0.5 rounded">
                      {p.key}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {p.completed} / {p.total} tasks
                  </span>
                  <span className="font-semibold text-foreground w-10 text-right">
                    {p.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${p.percentage}%` }}
                />
                <div
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{
                    width: `${p.total > 0 ? (p.inProgress / p.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
