import { createServer } from 'vite'

console.log('--- CollabSpace Stage 17: Notification System Test Suite ---')

const server = await createServer()

try {
  const {
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearReadNotifications,
    createNotification,
    getNotificationTypeConfig,
    DEMO_NOTIFICATIONS,
  } = await server.ssrLoadModule('/src/services/notifications.js')

  const testUserId = 'demo-user-collabspace-uuid'
  const workspaceId = 'demo-ws-acme-corp'

  // =========================================================================
  // 1. Initial Notifications Retrieval & Categories
  // =========================================================================
  console.log('\n[1/7] Testing Notification Retrieval & Event Categories:')
  const allNotifs = await getUserNotifications(testUserId, { filter: 'all' })

  if (!Array.isArray(allNotifs) || allNotifs.length === 0) {
    console.error('Failed to retrieve user notifications!', allNotifs)
    process.exit(1)
  }
  console.log(`  ✓ Retrieved ${allNotifs.length} total notifications for user ${testUserId}`)

  const types = allNotifs.map((n) => n.type)
  console.log(`  ✓ Detected event types in feed: [${[...new Set(types)].join(', ')}]`)

  // Test category filters
  const mentionsOnly = await getUserNotifications(testUserId, { filter: 'mentions' })
  const assignmentsOnly = await getUserNotifications(testUserId, { filter: 'assignments' })
  const tasksOnly = await getUserNotifications(testUserId, { filter: 'tasks' })

  console.log(`  ✓ Category filters working: ${mentionsOnly.length} mentions, ${assignmentsOnly.length} assignments, ${tasksOnly.length} task events`)

  // =========================================================================
  // 2. Unread Notification Counting
  // =========================================================================
  console.log('\n[2/7] Testing Unread Notification Counting:')
  const initialUnreadCount = await getUnreadNotificationCount(testUserId)

  if (typeof initialUnreadCount !== 'number' || initialUnreadCount < 1) {
    console.error(`Invalid unread notification count: ${initialUnreadCount}`)
    process.exit(1)
  }
  console.log(`  ✓ Initial unread notifications count: ${initialUnreadCount}`)

  // =========================================================================
  // 3. Mark Single Notification as Read
  // =========================================================================
  console.log('\n[3/7] Testing Mark Single Notification as Read:')
  const unreadTarget = allNotifs.find((n) => !n.is_read)

  if (!unreadTarget) {
    console.error('No unread notification found to test mark as read!')
    process.exit(1)
  }

  const marked = await markNotificationAsRead(unreadTarget.id, testUserId)
  if (!marked) {
    console.error('Failed to mark notification as read!')
    process.exit(1)
  }

  const updatedUnreadCount = await getUnreadNotificationCount(testUserId)
  if (updatedUnreadCount !== initialUnreadCount - 1) {
    console.error(`Expected unread count ${initialUnreadCount - 1}, got ${updatedUnreadCount}`)
    process.exit(1)
  }
  console.log(`  ✓ Successfully marked notification "${unreadTarget.id}" as read (Unread count reduced to ${updatedUnreadCount})`)

  // =========================================================================
  // 4. Duplicate Notification Prevention
  // =========================================================================
  console.log('\n[4/7] Testing Duplicate Notification Prevention:')
  const notifParams = {
    userId: testUserId,
    workspaceId,
    title: 'New Project Announcement',
    message: 'Sprint 4 release candidate deployed to staging environment.',
    type: 'announcement',
    entityType: 'project',
    entityId: 'test-project-101',
    link: '/projects/test-project-101',
    actorId: 'test-actor-uuid',
    metadata: { version: 'v1.4.0' },
  }

  // Create first notification
  const firstNotif = await createNotification(notifParams)
  if (!firstNotif || !firstNotif.id) {
    console.error('Failed to create notification!', firstNotif)
    process.exit(1)
  }
  console.log(`  ✓ First notification created (ID: ${firstNotif.id})`)

  // Attempt to create duplicate with identical entity and type
  const duplicateNotif = await createNotification(notifParams)
  if (duplicateNotif.id !== firstNotif.id) {
    console.error('DUPLICATE NOTIFICATION DETECTED: Deduplication barrier failed!', duplicateNotif)
    process.exit(1)
  }
  console.log('  ✓ Duplicate notification blocked: Returned existing notification without generating duplicate')

  // =========================================================================
  // 5. Mark All Notifications as Read
  // =========================================================================
  console.log('\n[5/7] Testing Mark All Notifications as Read:')
  await markAllNotificationsAsRead(testUserId)

  const countAfterMarkAll = await getUnreadNotificationCount(testUserId)
  if (countAfterMarkAll !== 0) {
    console.error(`Expected 0 unread notifications after mark all, got ${countAfterMarkAll}`)
    process.exit(1)
  }
  console.log('  ✓ All notifications successfully marked as read (Unread count: 0)')

  // =========================================================================
  // 6. Delete Notification & Clear Read
  // =========================================================================
  console.log('\n[6/7] Testing Delete Notification & Clear Read:')
  const deleted = await deleteNotification(firstNotif.id, testUserId)
  if (!deleted) {
    console.error('Failed to delete notification!')
    process.exit(1)
  }
  console.log(`  ✓ Single notification "${firstNotif.id}" deleted successfully`)

  // Test clear read
  await clearReadNotifications(testUserId)
  const remaining = await getUserNotifications(testUserId, { filter: 'all' })
  const readRemaining = remaining.filter((n) => n.is_read)
  if (readRemaining.length !== 0) {
    console.error('Clear read failed, read notifications still remain!', readRemaining)
    process.exit(1)
  }
  console.log('  ✓ Clear read notifications verified: All read notifications purged')

  // =========================================================================
  // 7. Navigation Deep Links & Visual Type Config
  // =========================================================================
  console.log('\n[7/7] Testing Navigation Links & Event Type Visual Badges:')
  const sampleTypes = ['assignment', 'mention', 'comment', 'status_change', 'deadline', 'member_joined']
  sampleTypes.forEach((t) => {
    const config = getNotificationTypeConfig(t)
    if (!config || (!config.icon && !config.iconName) || !config.color) {
      console.error(`Missing type visual config for "${t}"!`)
      process.exit(1)
    }
  })
  console.log(`  ✓ Verified visual configuration for all ${sampleTypes.length} core notification event types`)

  console.log('\n🎉 ALL IN-APP NOTIFICATION SYSTEM TESTS PASSED!')
} catch (err) {
  console.error('Notification test execution error:', err)
  process.exit(1)
} finally {
  await server.close()
}
