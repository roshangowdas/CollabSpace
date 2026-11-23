import React from 'react'
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Mail,
  FolderKanban,
  Settings,
  History,
  Building2,
  Lock,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ROLE_CONFIG } from '@/services/admin'

export const ADMIN_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'members', label: 'Members & Roles', icon: Users },
  { id: 'invitations', label: 'Invitations', icon: Mail },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'activity', label: 'Audit Log', icon: History },
]

export function AdminHeader({
  workspace,
  callerRole,
  activeTab,
  onSelectTab,
  memberCount = 0,
  pendingInviteCount = 0,
  onLock,
}) {
  const roleMeta = ROLE_CONFIG[callerRole] || ROLE_CONFIG.Admin

  return (
    <div className="space-y-4 pb-4 border-b border-border/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Workspace Administration
            </h1>
            <Badge className={`text-xs px-2 py-0.5 font-medium border ${roleMeta.badgeClass}`}>
              {callerRole}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            Managing <span className="font-semibold text-foreground">{workspace?.name || 'Workspace'}</span> ({workspace?.slug})
          </p>
        </div>

        {onLock && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLock}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-border hover:bg-muted"
              title="Lock administration console"
            >
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Lock Console</span>
            </Button>
          </div>
        )}
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-2 no-scrollbar border-t border-border/40">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          let badgeCount = null

          if (tab.id === 'members' && memberCount > 0) badgeCount = memberCount
          if (tab.id === 'invitations' && pendingInviteCount > 0) badgeCount = pendingInviteCount

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {badgeCount !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted-foreground/15 text-muted-foreground'
                  }`}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
