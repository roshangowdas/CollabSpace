import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { AlertCircle } from 'lucide-react'

export function TaskPriorityChart({ data = [] }) {
  const totalTasks = data.reduce((sum, item) => sum + (item.value || 0), 0)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const percent = totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0
      return (
        <div className="bg-popover text-popover-foreground border border-border shadow-md rounded-lg p-2.5 text-xs z-50">
          <p className="font-semibold" style={{ color: item.color }}>
            {item.name} Priority
          </p>
          <p className="text-foreground">
            {item.value} tasks ({percent}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="border-border/60 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          Task Priority Distribution
        </CardTitle>
        <CardDescription>Breakdown by urgency level</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-between flex-1 pt-2">
        {/* Donut Chart with Center Metric */}
        <div className="relative w-full h-48 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={74}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {totalTasks}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              Tasks
            </span>
          </div>
        </div>

        {/* Priority Grid Legend */}
        <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
          {data.map((item) => {
            const percent = totalTasks > 0 ? Math.round((item.value / totalTasks) * 100) : 0
            return (
              <div
                key={item.priority}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                  <span className="font-semibold text-foreground">{item.value}</span>
                  <span className="text-[10px]">({percent}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
