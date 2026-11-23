import React, { useState } from 'react'
import {
  Layers,
  ChevronDown,
  Plus,
  Check,
  Settings,
  Sparkles,
} from 'lucide-react'
import {
  Badge,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui'
import { useWorkspace } from '@/hooks/useWorkspace'
import { CreateWorkspaceModal } from './CreateWorkspaceModal'
import { cn } from '@/utils/cn'

export function WorkspaceSwitcher({ onOpenSettings, className }) {
  const { workspaces, currentWorkspace, switchWorkspace, role, isAdmin } = useWorkspace()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const activeName = currentWorkspace?.name || 'My Workspace'
  const activeInitials = activeName.slice(0, 2).toUpperCase()

  return (
    <>
      <div className={cn('w-full', className)}>
        <DropdownMenu
          align="left"
          className="w-64"
          trigger={
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg p-1.5 hover:bg-sidebar-accent transition-colors text-left cursor-pointer"
            >
              {/* Workspace Logo or Initials */}
              {currentWorkspace?.logo_url ? (
                <img
                  src={currentWorkspace.logo_url}
                  alt={activeName}
                  className="h-7 w-7 rounded-md object-cover border shadow-subtle shrink-0"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-xs shadow-subtle shrink-0">
                  {activeInitials}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs tracking-tight text-foreground truncate">
                    {activeName}
                  </span>
                  <Badge variant="brand" size="sm" className="px-1 py-0 text-[9px] uppercase font-mono">
                    {role}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {currentWorkspace?.slug ? `/${currentWorkspace.slug}` : 'Default Workspace'}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          }
        >
          <DropdownMenuLabel>
            <div className="flex items-center justify-between">
              <span>Workspaces</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {workspaces.length} active
              </span>
            </div>
          </DropdownMenuLabel>

          {/* Workspace List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {workspaces.map((ws) => {
              const isActive = ws.id === currentWorkspace?.id
              return (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => switchWorkspace(ws.id)}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-bold">
                      {ws.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {isActive ? (
                    <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                  ) : (
                    <Badge variant="outline" size="sm" className="text-[9px] py-0">
                      {ws.role}
                    </Badge>
                  )}
                </DropdownMenuItem>
              )
            })}
          </div>

          <DropdownMenuSeparator />

          {/* Quick Actions */}
          <DropdownMenuItem
            icon={Plus}
            onClick={() => setIsCreateOpen(true)}
          >
            Create New Workspace
          </DropdownMenuItem>

          {isAdmin && onOpenSettings && (
            <DropdownMenuItem
              icon={Settings}
              onClick={onOpenSettings}
            >
              Workspace Settings
            </DropdownMenuItem>
          )}
        </DropdownMenu>
      </div>

      {/* Creation Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  )
}

