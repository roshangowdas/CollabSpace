import React from 'react'
import { Heart, Layers } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-8 mt-auto">
      <div className="container px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground">
            <Layers className="h-3 w-3" />
          </div>
          <span className="font-semibold text-foreground">CollabSpace</span>
          <span>— Production-grade Team Collaboration SaaS</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Engineered with React + Vite & Supabase</span>
        </div>
      </div>
    </footer>
  )
}

