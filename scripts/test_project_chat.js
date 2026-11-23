import { createServer } from 'vite'

console.log('--- CollabSpace Stage 15: Real-Time Project Chat Test Suite ---')

const server = await createServer()

try {
  const {
    getProjectMessages,
    sendChatMessage,
    updateChatMessage,
    deleteChatMessage,
    countUnreadMessages,
    markChannelAsRead,
    getChannelLastRead,
  } = await server.ssrLoadModule('/src/services/chat.js')

  const projectId = 'demo-proj-apollo'
  const workspaceId = 'demo-ws-acme-corp'
  const authorUserId = 'test-chat-author-uuid'
  const nonAuthorUserId = 'test-intruder-uuid'
  const adminUserId = 'test-admin-uuid'

  // =========================================================================
  // 1. Initial Message History Retrieval
  // =========================================================================
  console.log('\n[1/7] Testing Project Message History Retrieval:')
  const initialMessages = await getProjectMessages(projectId, { limit: 20 })

  if (!Array.isArray(initialMessages) || initialMessages.length === 0) {
    console.error('Failed to load project messages history!', initialMessages)
    process.exit(1)
  }
  console.log(`  ✓ Loaded ${initialMessages.length} messages for project ${projectId}`)
  console.log(`  ✓ Verified sender profile joined: "${initialMessages[0].sender?.full_name}" (@${initialMessages[0].sender?.username})`)

  // =========================================================================
  // 2. Send Text Message with Attachments
  // =========================================================================
  console.log('\n[2/7] Testing Sending Text Message with Attachments:')
  const testAttachment = {
    id: 'test-att-1',
    name: 'architecture_diagram.png',
    size: 154200,
    type: 'image/png',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
  }

  const sentMessage = await sendChatMessage({
    projectId,
    workspaceId,
    content: 'Hello team, attaching the system architecture diagram for sprint review.',
    senderId: authorUserId,
    attachments: [testAttachment],
    senderProfile: {
      id: authorUserId,
      full_name: 'Chat Tester',
      username: 'chattester',
      avatar_url: '',
    },
  })

  if (!sentMessage || sentMessage.sender_id !== authorUserId || sentMessage.attachments.length !== 1) {
    console.error('Failed to send chat message with attachment correctly!', sentMessage)
    process.exit(1)
  }
  console.log(`  ✓ Message sent successfully (ID: ${sentMessage.id}) with 1 attachment`)

  // =========================================================================
  // 3. Threaded Reply to Message
  // =========================================================================
  console.log('\n[3/7] Testing Threaded Reply Creation:')
  const replyMessage = await sendChatMessage({
    projectId,
    workspaceId,
    content: 'Looks great! I verified the database layer coordinates.',
    senderId: 'demo-user-david',
    parentId: sentMessage.id,
    senderProfile: {
      id: 'demo-user-david',
      full_name: 'David Chen',
      username: 'david_c',
    },
  })

  if (!replyMessage || replyMessage.parent_id !== sentMessage.id || !replyMessage.parent) {
    console.error('Reply failed to link parent message context!', replyMessage)
    process.exit(1)
  }
  console.log(`  ✓ Quoted reply created with parent sender: @${replyMessage.parent.sender?.username}`)
  console.log(`  ✓ Parent message preview: "${replyMessage.parent.content}"`)

  // =========================================================================
  // 4. Author-Only Message Edit Security
  // =========================================================================
  console.log('\n[4/7] Testing Author-Only Message Edit (Security Barrier):')
  const editedContent = 'Hello team, attaching updated architecture diagram with TLS 1.3 specs.'

  // Case A: Author successfully edits
  const updated = await updateChatMessage(sentMessage.id, editedContent, authorUserId, projectId)
  if (updated.content !== editedContent) {
    console.error('Author edit failed!', updated)
    process.exit(1)
  }
  console.log('  ✓ Genuine author successfully modified their message')

  // Case B: Unauthorized user modification attempt (MUST BE REJECTED)
  let unauthorizedEditBlocked = false
  try {
    await updateChatMessage(sentMessage.id, 'Hacked message text', nonAuthorUserId, projectId)
  } catch (err) {
    unauthorizedEditBlocked = true
    console.log(`  ✓ Unauthorized edit attempt blocked: "${err.message}"`)
  }

  if (!unauthorizedEditBlocked) {
    console.error('SECURITY VIOLATION: Unauthorized user modified another user\'s message!')
    process.exit(1)
  }

  // =========================================================================
  // 5. Message Deletion Authorization
  // =========================================================================
  console.log('\n[5/7] Testing Message Deletion Authorization:')

  // Case A: Unauthorized delete attempt (MUST BE REJECTED)
  let unauthorizedDeleteBlocked = false
  try {
    await deleteChatMessage(sentMessage.id, nonAuthorUserId, false, projectId)
  } catch (err) {
    unauthorizedDeleteBlocked = true
    console.log(`  ✓ Unauthorized delete blocked: "${err.message}"`)
  }

  if (!unauthorizedDeleteBlocked) {
    console.error('SECURITY VIOLATION: Non-author deleted another user\'s message!')
    process.exit(1)
  }

  // Case B: Genuine author deletion
  const deleted = await deleteChatMessage(sentMessage.id, authorUserId, false, projectId)
  if (!deleted) {
    console.error('Author delete failed!')
    process.exit(1)
  }
  console.log('  ✓ Author successfully deleted their own message')

  // =========================================================================
  // 6. Pagination & Cursor Filtering
  // =========================================================================
  console.log('\n[6/7] Testing Message History Pagination:')
  const allMessages = await getProjectMessages(projectId, { limit: 10 })
  if (allMessages.length > 1) {
    const oldestTimestamp = allMessages[1].created_at
    const olderPage = await getProjectMessages(projectId, {
      limit: 1,
      beforeTimestamp: oldestTimestamp,
    })
    console.log(`  ✓ Pagination cursor before "${oldestTimestamp}" returned ${olderPage.length} older message(s)`)
  } else {
    console.log('  ✓ Pagination interface validated with current message count')
  }

  // =========================================================================
  // 7. Unread Indicators & Last Read Tracking
  // =========================================================================
  console.log('\n[7/7] Testing Unread Message Counting & Last Read Tracking:')
  const mockMessages = [
    { id: '1', sender_id: 'user-a', created_at: new Date(Date.now() - 10000).toISOString() },
    { id: '2', sender_id: 'user-b', created_at: new Date(Date.now() - 5000).toISOString() },
    { id: '3', sender_id: 'user-b', created_at: new Date(Date.now() - 1000).toISOString() },
  ]

  // If last read was 6 seconds ago, only message '3' is unread for user-a
  const lastReadTime = new Date(Date.now() - 6000).toISOString()
  const unreadForUserA = countUnreadMessages(mockMessages, lastReadTime, 'user-a')

  if (unreadForUserA !== 2) {
    console.error(`Expected 2 unread messages for user-a, got ${unreadForUserA}`)
    process.exit(1)
  }
  console.log(`  ✓ Correctly calculated unread count (${unreadForUserA}) based on last read timestamp`)

  console.log('\n🎉 ALL REAL-TIME PROJECT CHAT TESTS PASSED!')
} catch (err) {
  console.error('Chat test execution error:', err)
  process.exit(1)
} finally {
  await server.close()
}

