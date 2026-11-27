import React from 'react'

/**
 * High-performance loading skeleton matching Hoy Design System tokens (#191918, 6px radii).
 * Used as Suspense fallback for route-based lazy loading.
 */
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#191918] text-[#ECECEA] p-6 space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between border-b border-[#282827] pb-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-[#282827] rounded-[6px]" />
          <div className="h-4 w-72 bg-[#222221] rounded-[6px]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 bg-[#282827] rounded-[6px]" />
          <div className="h-9 w-32 bg-[#eb1b38]/40 rounded-[6px]" />
        </div>
      </div>

      {/* KPI Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#222221] border border-[#282827] rounded-[6px] p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-[#282827] rounded" />
              <div className="h-4 w-4 bg-[#282827] rounded-full" />
            </div>
            <div className="h-8 w-16 bg-[#282827] rounded" />
            <div className="h-3 w-28 bg-[#1f1f1e] rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#222221] border border-[#282827] rounded-[6px] p-6 space-y-4 min-h-[360px]">
          <div className="h-5 w-36 bg-[#282827] rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="h-12 w-full bg-[#1c1c1b] border border-[#262625] rounded-[6px]"
              />
            ))}
          </div>
        </div>

        <div className="bg-[#222221] border border-[#282827] rounded-[6px] p-6 space-y-4 min-h-[360px]">
          <div className="h-5 w-32 bg-[#282827] rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#282827]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-3/4 bg-[#282827] rounded" />
                  <div className="h-2.5 w-1/2 bg-[#1f1f1e] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
