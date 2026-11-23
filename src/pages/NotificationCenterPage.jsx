import React, { useState } from 'react'
import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  Filter,
  Inbox,
  UserCheck,
  AtSign,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { AppLayout } from '@/components/common/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { NotificationItem } from '@/components/notification'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/utils/cn'

export function NotificationCenterPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
  } = useNotifications()

  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: 'all', label: 'All', icon: Bell },
    { id: 'unread', label: 'Unread', icon: Clock, count: unreadCount },
    { id: 'mentions', label: 'Mentions', icon: AtSign },
    { id: 'assignments', label: 'Assignments', icon: UserCheck },
    { id: 'tasks', label: 'Tasks & Deadlines', icon: CheckCircle2 },
    { id: 'chat', label: 'Chat & Comments', icon: MessageSquare },
  ]

  const filteredNotifications = notifications.filter((n) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q) ||
      n.actor?.full_name?.toLowerCase().includes(q)
    )
  })

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand/10 text-brand border border-brand/20">
                <Bell className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Notification Center
              </h1>
              {unreadCount > 0 && (
                <Badge variant="brand" size="sm" className="font-mono">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review mentions, task assignments, deadline warnings, and team collaboration alerts.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={CheckCheck}
              onClick={markAllAsRead}
              disabled={unreadCount === 0 || isLoading}
            >
              Mark all as read
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={Trash2}
              onClick={clearRead}
              disabled={notifications.every((n) => !n.is_read) || isLoading}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear read
            </Button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-border pb-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              const isActive = filter === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                    isActive
                      ? 'bg-secondary text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-brand/10 text-brand text-[10px] font-mono font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter notifications..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        {/* Notification List Container */}
        <div className="space-y-2.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
              <span>Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-dashed border-border bg-card/50 p-8 space-y-3">
              <div className="p-4 rounded-md bg-secondary text-muted-foreground">
                <Inbox className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                No notifications found
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                {searchQuery
                  ? `No alerts matching "${searchQuery}". Try adjusting your keywords.`
                  : filter === 'unread'
                  ? "You're all caught up! No unread notifications remaining."
                  : 'You have no notifications in this category right now.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                compact={false}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}
