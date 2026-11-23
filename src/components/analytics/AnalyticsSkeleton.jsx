import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="w-7 h-7 rounded-lg bg-muted" />
              </div>
              <div className="h-6 w-12 bg-muted rounded" />
              <div className="h-2.5 w-20 bg-muted/60 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-3 w-60 bg-muted/60 rounded" />
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="w-full h-full bg-muted/40 rounded-lg" />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <div className="h-4 w-44 bg-muted rounded" />
            <div className="h-3 w-56 bg-muted/60 rounded" />
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <div className="w-full h-full bg-muted/40 rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Secondary Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted/60 rounded" />
          </CardHeader>
          <CardContent className="h-56 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-muted/50" />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted/60 rounded" />
          </CardHeader>
          <CardContent className="h-56 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/40 rounded-lg" />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="space-y-2">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted/60 rounded" />
          </CardHeader>
          <CardContent className="h-56 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/40 rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
