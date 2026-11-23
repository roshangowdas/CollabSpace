// ==============================================================================
// CollabSpace Component: ActiveCollaboratorsBar
// File: src/components/document/ActiveCollaboratorsBar.jsx
// Description:
//   Displays active peer collaborators with distinctive presence rings,
//   connection status (connected, connecting, disconnected), and last saved time.
// ==============================================================================

import React from 'react'
import {
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/utils/cn'

export function ActiveCollaboratorsBar({
  collaborators = [],
  connectionStatus = 'connected', // 'connected' | 'connecting' | 'disconnected'
  lastSavedTime = null,
  isSaving = false,
  className = '',
}) {
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync</span>
          </div>
        )
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-medium">
            <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
            <span>Connecting...</span>
          </div>
        )
      case 'disconnected':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-medium">
            <WifiOff className="h-3 w-3 text-rose-500" />
            <span>Offline (Saved Locally)</span>
          </div>
        )
    }
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 border-b border-border bg-card text-xs text-muted-foreground select-none',
        className
      )}
    >
      {/* Left: Connection status & save state */}
      <div className="flex items-center gap-3">
        {getStatusBadge()}

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving updates...</span>
            </>
          ) : lastSavedTime ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>Saved {new Date(lastSavedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          ) : (
            <span>Ready</span>
          )}
        </div>
      </div>

      {/* Right: Active Collaborators List */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium hidden sm:inline">
          Collaborators ({collaborators.length}):
        </span>

        <div className="flex items-center -space-x-1.5 overflow-hidden p-0.5">
          {collaborators.map((user, idx) => (
            <Tooltip
              key={user.id || user.name || idx}
              content={`${user.name || 'Collaborator'} (Editing now)`}
            >
              <div
                className="relative rounded-full ring-2 transition-transform hover:scale-110 hover:z-10 cursor-default"
                style={{ ringColor: user.color || '#3b82f6' }}
              >
                <Avatar
                  src={user.avatar}
                  name={user.name || 'User'}
                  size="xs"
                  className="h-6 w-6 text-[10px]"
                />
              </div>
            </Tooltip>
          ))}

          {collaborators.length === 0 && (
            <span className="text-[11px] text-muted-foreground/70 italic">
              Only you currently viewing
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
