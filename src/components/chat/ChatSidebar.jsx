import React, { useState } from 'react'
import {
  Hash,
  Search,
  FolderKanban,
  MessageSquare,
  Sparkles,
  Lock,
  Globe,
  Plus,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

export function ChatSidebar({
  projects = [],
  activeProjectId = null,
  activeChannelName = null,
  onSelectProject,
  onSelectChannel,
  unreadCounts = {},
  className,
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.key?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    )
  })

  return (
    <div className={cn('flex flex-col h-full bg-card border-r border-border w-64 lg:w-72 shrink-0 select-none', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-bold text-foreground">Project Chat</h2>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
            {projects.length} rooms
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chat rooms..."
            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Workspace Channels */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace Channels
          </div>
          <button
            type="button"
            onClick={() => onSelectChannel && onSelectChannel('general')}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer',
              !activeProjectId && activeChannelName === 'general'
                ? 'bg-brand/10 text-brand font-semibold'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">general</span>
            </div>
          </button>
        </div>

        {/* Project Specific Rooms */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Project Rooms
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {filteredProjects.length}
            </span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No matching projects
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const isActive = activeProjectId === proj.id
              const unread = unreadCounts[proj.id] || 0

              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => onSelectProject && onSelectProject(proj)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left group cursor-pointer',
                    isActive
                      ? 'bg-brand/10 text-brand font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={cn(
                        'font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 border',
                        isActive
                          ? 'bg-brand text-brand-foreground border-brand'
                          : 'bg-secondary text-foreground border-border/80'
                      )}
                    >
                      {proj.key || 'PRJ'}
                    </span>
                    <span className="truncate text-xs font-medium text-foreground">
                      {proj.name}
                    </span>
                  </div>

                  {/* Unread Message Indicator Badge */}
                  {unread > 0 && (
                    <span className="ml-2 px-1.5 py-0.2 rounded-full bg-brand text-brand-foreground text-[10px] font-mono font-bold shrink-0">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

