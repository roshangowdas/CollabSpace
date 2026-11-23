import React from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { formatTypingLabel } from '@/services/presence'
import { cn } from '@/utils/cn'

export function TypingIndicator({ typingUsers = [], className }) {
  if (!typingUsers || typingUsers.length === 0) return null

  const label = formatTypingLabel(typingUsers)

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground animate-in fade-in-50 duration-200',
        className
      )}
    >
      {/* Small overlapping avatars */}
      <div className="flex -space-x-1.5 overflow-hidden shrink-0">
        {typingUsers.slice(0, 3).map((u) => (
          <Avatar
            key={u.user_id}
            src={u.avatar_url}
            name={u.full_name || u.username}
            size="xs"
            className="ring-2 ring-card shadow-xs"
          />
        ))}
      </div>

      {/* Animated 3-dot pulse */}
      <span className="flex items-center gap-0.5 px-1">
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" />
      </span>

      {/* Typing user names label */}
      <span className="font-medium text-foreground/80 truncate text-[11px]">
        {label}
      </span>
    </div>
  )
}

