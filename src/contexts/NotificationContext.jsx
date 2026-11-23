import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  clearReadNotifications as apiClearRead,
} from '@/services/notifications'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'unread' | 'mentions' | 'assignments' | 'tasks' | 'chat'

  const currentUserId = user?.id

  // Load user notifications and unread count
  const loadNotifications = useCallback(async () => {
    if (!currentUserId) {
      setNotifications([])
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [list, count] = await Promise.all([
        getUserNotifications(currentUserId, {
          filter,
          workspaceId: currentWorkspace?.id,
          limit: 50,
        }),
        getUnreadNotificationCount(currentUserId, currentWorkspace?.id),
      ])

      setNotifications(list || [])
      setUnreadCount(count || 0)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId, filter, currentWorkspace?.id])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Supabase Realtime live notification delivery
  useEffect(() => {
    if (!currentUserId || !isSupabaseConfigured) return

    const channelName = `user-notifications:${currentUserId}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotif.id)) return prev
              return [newNotif, ...prev]
            })
            setUnreadCount((prev) => prev + 1)

            // Live toast notification
            toast(newNotif.title, {
              description: newNotif.message,
              action: newNotif.link
                ? {
                    label: 'View',
                    onClick: () => {
                      window.location.href = newNotif.link
                    },
                  }
                : undefined,
            })
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
            )
            // Re-sync unread count
            getUnreadNotificationCount(currentUserId, currentWorkspace?.id).then(setUnreadCount)
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
            getUnreadNotificationCount(currentUserId, currentWorkspace?.id).then(setUnreadCount)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, currentWorkspace?.id])

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    if (!currentUserId || !notificationId) return
    try {
      await apiMarkAsRead(notificationId, currentUserId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification read:', err)
      toast.error('Failed to mark notification as read')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUserId) return
    try {
      await apiMarkAllAsRead(currentUserId, currentWorkspace?.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (err) {
      console.error('Failed to mark all notifications read:', err)
      toast.error('Failed to mark all as read')
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!currentUserId || !notificationId) return
    try {
      const target = notifications.find((n) => n.id === notificationId)
      await apiDeleteNotification(notificationId, currentUserId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      toast.success('Notification removed')
    } catch (err) {
      console.error('Failed to delete notification:', err)
      toast.error('Failed to delete notification')
    }
  }

  // Clear all read notifications
  const clearRead = async () => {
    if (!currentUserId) return
    try {
      await apiClearRead(currentUserId, currentWorkspace?.id)
      setNotifications((prev) => prev.filter((n) => !n.is_read))
      toast.success('Cleared read notifications')
    } catch (err) {
      console.error('Failed to clear read notifications:', err)
      toast.error('Failed to clear read notifications')
    }
  }

  const value = {
    notifications,
    unreadCount,
    isLoading,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
    refreshNotifications: loadNotifications,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
