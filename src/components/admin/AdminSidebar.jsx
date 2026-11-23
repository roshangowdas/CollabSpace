import React from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  History,
  Settings,
  ShieldCheck,
  Lock,
  ArrowLeft,
  X,
  Building2,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export const ADMIN_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar({
  activeTab,
  onSelectTab,
  workspace,
  callerRole = 'Owner',
  userEmail = '0243roshan@gmail.com',
  counts = {},
  onLock,
  isOpen = false,
  onClose,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:max-h-screen md:translate-x-0',
          isOpen ? 'translate-x-0 shadow-modal' : '-translate-x-full'
        )}
      >
        {/* Admin Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 border border-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-foreground tracking-tight truncate">
                  Admin Portal
                </span>
                <Badge variant="destructive" className="text-[9px] px-1 py-0 uppercase font-mono font-bold">
                  Super
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate">{workspace?.name || 'Workspace'}</span>
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Core Navigation Menu Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Workspace Administration
          </div>

          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const count = counts[item.id]

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id)
                  if (onClose) onClose()
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left group',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {typeof count === 'number' && count > 0 && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Admin Footer Controls */}
        <div className="border-t border-sidebar-border p-3 space-y-2 bg-sidebar/50">
          {/* Admin User Info Card */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/60">
            <Avatar
              name="Roshan"
              className="h-8 w-8 text-xs font-semibold bg-primary/20 text-primary shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{userEmail}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[9px] px-1 py-0 font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                  {callerRole}
                </Badge>
                <span className="text-[10px] text-muted-foreground">Authorized</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Lock Console & Exit Admin */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLock}
              className="w-full text-[11px] h-8 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground border-sidebar-border"
              title="Lock administration console"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock</span>
            </Button>

            <Link to="/dashboard" className="w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-[11px] h-8 flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                title="Exit to standard workspace dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit</span>
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
