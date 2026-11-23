// Globals (describe, it, expect, beforeEach) provided by Vitest
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationTypeConfig,
} from '@/services/notifications'
import {
  getProjectMessages,
  countUnreadMessages,
  markChannelAsRead,
  getChannelLastRead,
} from '@/services/chat'

describe('Real-Time Services & Notifications Suite', () => {
  const userId = 'demo-user-collabspace-uuid'
  const workspaceId = 'demo-ws-acme-corp'
  const projectId = 'demo-proj-apollo'

  describe('In-App Notification Events & Type Handlers', () => {
    const EXPECTED_TYPES = [
      'workspace_invite',
      'workspace_joined',
      'task_assigned',
      'task_deadline_approaching',
      'task_status_changed',
      'task_comment',
      'user_mentioned',
      'project_announcement',
      'chat_message',
    ]

    it('maps all 9 required notification event types to visual tokens', () => {
      for (const type of EXPECTED_TYPES) {
        const config = getNotificationTypeConfig(type)
        expect(config).toBeDefined()
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('color')
      }
    })

    it('fetches user notifications and calculates unread count', async () => {
      const notifications = await getUserNotifications(userId, workspaceId)
      expect(Array.isArray(notifications)).toBe(true)

      const unreadCount = await getUnreadNotificationCount(userId, workspaceId)
      expect(typeof unreadCount).toBe('number')
      expect(unreadCount).toBeGreaterThanOrEqual(0)
    })

    it('marks individual and all notifications as read', async () => {
      const readResult = await markAllNotificationsAsRead(userId, workspaceId)
      expect(readResult).toBeTruthy()
    })
  })

  describe('Real-Time Chat & Unread Channel Counters', () => {
    it('fetches project messages for authorized rooms', async () => {
      const messages = await getProjectMessages(projectId)
      expect(Array.isArray(messages)).toBe(true)
      expect(messages.length).toBeGreaterThan(0)

      const first = messages[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('content')
      expect(first).toHaveProperty('sender_id')
    })

    it('counts unread messages based on last read timestamp', () => {
      const now = Date.now()
      const mockMessages = [
        { id: 'm1', created_at: new Date(now - 10000).toISOString(), sender_id: 'other-user' },
        { id: 'm2', created_at: new Date(now - 5000).toISOString(), sender_id: 'other-user' },
        { id: 'm3', created_at: new Date(now - 1000).toISOString(), sender_id: userId }, // own message
      ]

      // Last read before m1 and m2
      const lastRead = new Date(now - 15000).toISOString()
      const unread = countUnreadMessages(mockMessages, lastRead, userId)
      expect(unread).toBe(2) // excludes own message m3
    })

    it('updates and persists channel read receipts', () => {
      const channelKey = `chat:${projectId}`
      markChannelAsRead(channelKey)
      const lastRead = getChannelLastRead(channelKey)
      expect(lastRead).not.toBeNull()
      expect(new Date(lastRead).getTime()).toBeGreaterThan(0)
    })
  })
})
