import React from 'react'
import { Link } from 'react-router-dom'
import {
  Layers,
  Menu,
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { NotificationDropdown } from '@/components/notification'

export function Header({ onMenuClick }) {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-subtle transition-transform group-hover:scale-105">
            <Layers className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-foreground leading-none">
              Collab<span className="text-brand">Space</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Enterprise SaaS
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip content="Toggle Theme">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </Tooltip>

        {/* Real-time In-App Notification Dropdown */}
        <NotificationDropdown />
      </div>
    </header>
  )
}
