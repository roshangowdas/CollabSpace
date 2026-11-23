import React from 'react'
import {
  Users,
  X,
  Radio,
  CheckCircle2,
  Clock,
  Circle,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { UserPresenceBadge } from './UserPresenceBadge'
import { usePresence } from '@/hooks/usePresence'
import { cn } from '@/utils/cn'

export function ProjectMembersPresenceList({
  project = null,
  onClose = null,
  className,
}) {
  const {
    activeRoomMembers,
    onlineUsers,
    offlineMembers,
    getUserPresence,
  } = usePresence()

  // Project members if project is passed, otherwise workspace members
  const projectMemberIds = new Set(project?.members?.map((m) => m.user_id) || [])

  // Filter users active in this room
  const roomUsers = project
    ? activeRoomMembers.filter((u) => projectMemberIds.has(u.user_id))
    : activeRoomMembers

  // Filter other online members
  const roomUserIds = new Set(roomUsers.map((u) => u.user_id))
  const otherOnlineUsers = onlineUsers.filter((u) => !roomUserIds.has(u.user_id))

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-30 w-72 max-w-[85vw] shadow-modal md:static md:w-64 lg:w-72 md:shadow-none flex flex-col h-full bg-card border-l border-border shrink-0 select-none transition-transform duration-200 ease-in-out',
          className
        )}
      >
        {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/80">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-bold text-foreground">Room Presence</h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Close presence panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Member Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Active in this room */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5 text-brand">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Active in Room</span>
            </span>
            <span className="font-mono text-[10px] bg-brand/10 text-brand px-1.5 py-0.2 rounded-full font-bold">
              {roomUsers.length}
            </span>
          </div>

          {roomUsers.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground italic">
              No other members viewing this room
            </p>
          ) : (
            roomUsers.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="relative">
                  <Avatar
                    src={u.avatar_url}
                    name={u.full_name || u.username}
                    size="sm"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <UserPresenceBadge availability={u.availability} size="xs" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {u.full_name || u.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    @{u.username}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Online in Workspace */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Online in Workspace</span>
            <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.2 rounded-full font-bold">
              {otherOnlineUsers.length}
            </span>
          </div>

          {otherOnlineUsers.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground italic">
              No other workspace members online
            </p>
          ) : (
            otherOnlineUsers.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="relative">
                  <Avatar
                    src={u.avatar_url}
                    name={u.full_name || u.username}
                    size="sm"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <UserPresenceBadge availability={u.availability} size="xs" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {u.full_name || u.username}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    @{u.username}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Offline Members */}
        {offlineMembers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Offline</span>
              <span className="font-mono text-[10px] bg-muted text-muted-foreground px-1.5 py-0.2 rounded-full font-medium">
                {offlineMembers.length}
              </span>
            </div>

            {offlineMembers.slice(0, 10).map((m) => {
              const u = m.profile || m
              return (
                <div
                  key={m.user_id || m.id}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                >
                  <div className="relative">
                    <Avatar
                      src={u.avatar_url}
                      name={u.full_name || u.username || 'Member'}
                      size="sm"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <UserPresenceBadge availability="offline" size="xs" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {u.full_name || u.username || 'Member'}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      offline
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </>
  )
}

