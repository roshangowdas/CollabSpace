import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Layers,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ListTodo,
  MessageSquare,
  FileText,
  FolderOpen,
  Users,
  Settings,
  Search,
  ChevronDown,
  Plus,
  Hash,
  Bell,
  Sparkles,
  BarChart3,
  Moon,
  Sun,
  X,
  LogOut,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { WorkspaceSettingsModal } from '@/components/workspace/WorkspaceSettingsModal'
import { AvailabilitySelector } from '@/components/presence/AvailabilitySelector'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import { usePresence } from '@/hooks/usePresence'
import { useNotifications } from '@/hooks/useNotifications'

export function Sidebar({ isOpen, onClose, className }) {
  const location = useLocation()
  const { user, profile, logout } = useAuth()
  const { currentWorkspace, role } = useWorkspace()
  const { myAvailability } = usePresence()
  const { unreadCount } = useNotifications()
  const [isWorkspaceSettingsOpen, setIsWorkspaceSettingsOpen] = useState(false)

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = profile?.email || user?.email || 'user@collabspace.app'
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
    {
      title: 'Projects',
      href: '/projects',
      icon: FolderKanban,
    },
    {
      title: 'Tasks & Boards',
      href: '/tasks',
      icon: CheckSquare,
    },
    {
      title: 'My Tasks',
      href: '/my-tasks',
      icon: ListTodo,
    },
    {
      title: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : null,
      variant: 'brand',
    },
    {
      title: 'Real-time Chat',
      href: '/chat',
      icon: MessageSquare,
      unread: false,
    },
    {
      title: 'Files & Storage',
      href: '/files',
      icon: FolderOpen,
    },
    {
      title: 'Collaborative Docs',
      href: '/docs',
      icon: FileText,
    },
    {
      title: 'Whiteboards',
      href: '/whiteboards',
      icon: Sparkles,
    },
    {
      title: 'Team Directory',
      href: '/team-preview',
      icon: Users,
    },
  ]

  const channels = [
    { name: 'general', unread: false },
    { name: 'product-roadmap', unread: true },
    { name: 'design-system', unread: false },
    { name: 'engineering', unread: false },
  ]

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
          isOpen ? 'translate-x-0 shadow-modal' : '-translate-x-full',
          className
        )}
      >
        {/* Workspace Switcher Header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3.5">
          <WorkspaceSwitcher
            onOpenSettings={() => setIsWorkspaceSettingsOpen(true)}
            className="flex-1 min-w-0"
          />

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground shrink-0 ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Search trigger */}
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={() => {}}
            className="flex w-full items-center justify-between rounded-md border border-sidebar-border bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground shadow-subtle hover:bg-background hover:text-foreground transition-all duration-150"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Search workspace...</span>
            </div>
            <kbd className="rounded border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {/* Main items */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => onClose && onClose()}
                  className={cn(
                    'group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary font-semibold shadow-subtle'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-brand'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>

                  {item.badge ? (
                    <Badge variant={item.variant || 'secondary'} size="sm">
                      {item.badge}
                    </Badge>
                  ) : item.count ? (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {item.count}
                    </span>
                  ) : item.unread ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                  ) : null}
                </Link>
              )
            })}
          </div>

          {/* Channels / Streams */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
              <span>Channels</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground rounded p-0.5"
                title="Add channel"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {channels.map((chan) => (
              <Link
                key={chan.name}
                to="/chat"
                className="group flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-foreground" />
                  <span className="truncate">{chan.name}</span>
                </div>
                {chan.unread && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* User Footer Profile & Live Availability */}
        <div className="border-t border-sidebar-border p-2.5 space-y-2">
          <AvailabilitySelector className="w-full" />

          <DropdownMenu
            align="left"
            className="w-full"
            trigger={
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg p-1.5 hover:bg-sidebar-accent transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={avatarUrl}
                    name={displayName}
                    status={myAvailability}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {displayName}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
              </button>
            }
          >
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <Link to="/profile">
              <DropdownMenuItem icon={Users}>Profile</DropdownMenuItem>
            </Link>
            <Link to="/settings">
              <DropdownMenuItem icon={Settings}>Account Settings</DropdownMenuItem>
            </Link>
            <DropdownMenuItem
              icon={Moon}
              onClick={() => {
                document.documentElement.classList.toggle('dark')
              }}
            >
              Toggle Light / Dark
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={LogOut} destructive onClick={logout}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </aside>

      {/* Workspace Settings Dialog */}
      <WorkspaceSettingsModal
        isOpen={isWorkspaceSettingsOpen}
        onClose={() => setIsWorkspaceSettingsOpen(false)}
      />
    </>
  )
}
