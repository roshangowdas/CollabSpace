import React from 'react'
import {
  Check,
  ChevronDown,
  Circle,
  Clock,
  MinusCircle,
  Sparkles,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu'
import { UserPresenceBadge } from './UserPresenceBadge'
import { AVAILABILITY_STATUSES } from '@/services/presence'
import { usePresence } from '@/hooks/usePresence'
import { cn } from '@/utils/cn'

export function AvailabilitySelector({ className, align = 'start' }) {
  const { myAvailability, setMyAvailability } = usePresence()

  const currentConfig =
    AVAILABILITY_STATUSES[(myAvailability || 'online').toUpperCase()] ||
    AVAILABILITY_STATUSES.ONLINE

  const options = [
    {
      ...AVAILABILITY_STATUSES.ONLINE,
      iconColor: 'text-emerald-500',
    },
    {
      ...AVAILABILITY_STATUSES.BUSY,
      iconColor: 'text-rose-500',
    },
    {
      ...AVAILABILITY_STATUSES.AWAY,
      iconColor: 'text-amber-500',
    },
  ]

  return (
    <DropdownMenu
      align={align}
      trigger={
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/80 bg-secondary/50 hover:bg-secondary text-xs font-medium text-foreground transition-colors cursor-pointer group shadow-2xs',
            className
          )}
          title="Change your online status"
        >
          <UserPresenceBadge availability={myAvailability} size="sm" />
          <span className="truncate">{currentConfig.label}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors ml-auto" />
        </button>
      }
    >
      <DropdownMenuLabel>Set Online Availability</DropdownMenuLabel>
      <DropdownMenuSeparator />

      {options.map((opt) => {
        const isSelected = myAvailability === opt.id

        return (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => setMyAvailability(opt.id)}
            className="flex items-start gap-2.5 py-2 cursor-pointer"
          >
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full mt-1 shrink-0 ring-2 ring-background',
                opt.badgeClass
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {opt.label}
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 text-brand" />}
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                {opt.description}
              </p>
            </div>
          </DropdownMenuItem>
        )
      })}
    </DropdownMenu>
  )
}

