import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar
} from '@/components/common/Sidebar'
import {
  Layers,
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Settings,
  Sparkles
} from 'lucide-react'
import {
  Button,
  Badge,
  Avatar,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Tooltip
} from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'

export function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile, logout, isDemoUser } = useAuth()
  const { currentWorkspace, role } = useWorkspace()
  const location = useLocation()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = profile?.email || user?.email || 'user@collabspace.app'
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top App Header */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label="Open Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <span className="font-semibold text-foreground truncate max-w-[140px] sm:max-w-[200px]">
                {currentWorkspace?.name || 'Workspace'}
              </span>
              <span>/</span>
              <span className="capitalize truncate max-w-[120px]">{location.pathname.replace('/', '') || 'Dashboard'}</span>
              <Badge variant="brand" size="sm" className="font-mono text-[9px] uppercase px-1 py-0 shrink-0">
                {role}
              </Badge>
            </div>

            {isDemoUser && (
              <Badge variant="warning" size="sm" className="hidden sm:inline-flex gap-1 py-0.5">
                <Sparkles className="h-3 w-3" />
                Demo Session Active
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2.5">
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

            {/* User Dropdown Profile Menu */}
            <DropdownMenu
              align="right"
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
                >
                  <Avatar
                    src={avatarUrl}
                    name={displayName}
                    size="sm"
                    status="online"
                  />
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />
                </button>
              }
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-0.5 text-left">
                  <span className="font-semibold text-foreground text-xs">{displayName}</span>
                  <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[150px]">
                    {userEmail}
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <Link to="/dashboard">
                <DropdownMenuItem icon={Layers}>Workspace Dashboard</DropdownMenuItem>
              </Link>
              <Link to="/profile">
                <DropdownMenuItem icon={User}>Account Profile</DropdownMenuItem>
              </Link>
              <Link to="/settings">
                <DropdownMenuItem icon={Settings}>Account Settings</DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />

              <DropdownMenuItem icon={LogOut} destructive onClick={logout}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

