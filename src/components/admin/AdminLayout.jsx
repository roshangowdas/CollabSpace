import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Building2,
  Moon,
  Sun,
} from 'lucide-react'
import { AdminSidebar, ADMIN_NAV_ITEMS } from './AdminSidebar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function AdminLayout({
  activeTab,
  onSelectTab,
  workspace,
  callerRole = 'Owner',
  userEmail = '0243roshan@gmail.com',
  counts = {},
  onLock,
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  )

  const toggleTheme = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark')
      setIsDark(document.documentElement.classList.contains('dark'))
    }
  }

  const currentItem = ADMIN_NAV_ITEMS.find((item) => item.id === activeTab) || ADMIN_NAV_ITEMS[0]

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Admin Sidebar with the 6 core options */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        workspace={workspace}
        callerRole={callerRole}
        userEmail={userEmail}
        counts={counts}
        onLock={onLock}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Administrative Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-xs px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted focus:outline-none"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                Admin Console
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">/</span>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate flex items-center gap-2">
                <currentItem.icon className="w-4 h-4 text-primary shrink-0" />
                <span>{currentItem.label}</span>
              </h1>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Lock Console */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLock}
              className="h-8 text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground border-border"
              title="Lock administration console"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Console</span>
            </Button>

            {/* Exit Admin */}
            <Link to="/dashboard">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit to App</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
