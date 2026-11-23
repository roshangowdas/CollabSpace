import { createServer } from 'vite'

console.log('--- CollabSpace Stage 14: Task Discussions & Activity Test Suite ---')

const server = await createServer()

try {
  const {
    getTaskComments,
    createTaskComment,
    updateTaskComment,
    deleteTaskComment,
    getTaskActivityHistory,
    formatActivityDescription,
    extractMentions,
  } = await server.ssrLoadModule('/src/services/discussions.js')

  const taskId = 'demo-task-1'
  const authorUserId = 'test-author-uuid'
  const nonAuthorUserId = 'test-unauthorized-uuid'
  const adminUserId = 'test-admin-uuid'

  // =========================================================================
  // 1. Mentions Extraction Test
  // =========================================================================
  console.log('\n[1/6] Testing @username Mentions Extraction:')
  const sampleText = 'Hey @alex_rivera and @sarah_j, please check this bug with @alex_rivera!'
  const mentions = extractMentions(sampleText)

  if (mentions.length !== 2 || !mentions.includes('alex_rivera') || !mentions.includes('sarah_j')) {
    console.error('Failed to extract unique mentions correctly:', mentions)
    process.exit(1)
  }
  console.log(`  ✓ Successfully parsed unique @username mentions: [${mentions.join(', ')}]`)

  // =========================================================================
  // 2. Comments Retrieval Test
  // =========================================================================
  console.log('\n[2/6] Testing Task Comments Retrieval:')
  const initialComments = await getTaskComments(taskId)
  if (!Array.isArray(initialComments) || initialComments.length === 0) {
    console.error('Failed to load initial task comments!')
    process.exit(1)
  }
  console.log(`  ✓ Retrieved ${initialComments.length} existing comments for task ${taskId}`)
  console.log(`  ✓ Sample comment author: ${initialComments[0].user?.full_name} (@${initialComments[0].user?.username})`)

  // =========================================================================
  // 3. Comment Creation & Activity Generation Test
  // =========================================================================
  console.log('\n[3/6] Testing Comment Creation & Lifecycle Audit Logging:')
  const commentContent = 'Testing automated discussion thread @sarah_j on unit test run.'
  const newComment = await createTaskComment({
    taskId,
    content: commentContent,
    userId: authorUserId,
    workspaceId: 'demo-ws-acme-corp',
    currentUserProfile: {
      id: authorUserId,
      full_name: 'Author User',
      username: 'author_u',
      avatar_url: '',
    },
  })

  if (!newComment || newComment.content !== commentContent || newComment.user_id !== authorUserId) {
    console.error('Failed to create new task comment correctly!', newComment)
    process.exit(1)
  }
  console.log(`  ✓ New comment created with ID: ${newComment.id}`)

  // Verify activity history was updated
  const activities = await getTaskActivityHistory(taskId)
  const commentActivity = activities.find((a) => a.action === 'commented')
  if (!commentActivity) {
    console.error('Activity history missing new comment event!')
    process.exit(1)
  }
  console.log('  ✓ Task activity timeline reflects "commented" event')

  // =========================================================================
  // 4. Author-Only Comment Modification Security Test
  // =========================================================================
  console.log('\n[4/6] Testing Author-Only Modification Enforcement (Security Barrier):')
  const updatedContent = 'Updated comment content by the genuine author.'

  // Case A: Legitimate author update
  const updatedComment = await updateTaskComment(newComment.id, updatedContent, authorUserId)
  if (updatedComment.content !== updatedContent) {
    console.error('Legitimate author update failed!')
    process.exit(1)
  }
  console.log('  ✓ Genuine author successfully modified their own comment')

  // Case B: Unauthorized user modification attempt (MUST BE REJECTED)
  let unauthorizedBlocked = false
  try {
    await updateTaskComment(newComment.id, 'Hacked content by intruder', nonAuthorUserId)
  } catch (err) {
    unauthorizedBlocked = true
    console.log(`  ✓ Unauthorized edit correctly rejected: "${err.message}"`)
  }

  if (!unauthorizedBlocked) {
    console.error('SECURITY VIOLATION: Unauthorized user was able to modify another user\'s comment!')
    process.exit(1)
  }

  // =========================================================================
  // 5. Deletion Authorization Test (Author or Admin)
  // =========================================================================
  console.log('\n[5/6] Testing Deletion Authorization:')

  // Case A: Unauthorized deletion attempt
  let deleteBlocked = false
  try {
    await deleteTaskComment(newComment.id, nonAuthorUserId, false)
  } catch (err) {
    deleteBlocked = true
    console.log(`  ✓ Unauthorized delete correctly rejected: "${err.message}"`)
  }

  if (!deleteBlocked) {
    console.error('SECURITY VIOLATION: Non-author was able to delete someone else\'s comment!')
    process.exit(1)
  }

  // Case B: Author deletion
  const deletedByAuthor = await deleteTaskComment(newComment.id, authorUserId, false)
  if (!deletedByAuthor) {
    console.error('Author deletion failed!')
    process.exit(1)
  }
  console.log('  ✓ Author successfully deleted their own comment')

  // =========================================================================
  // 6. Activity Description Formatting Test
  // =========================================================================
  console.log('\n[6/6] Testing Activity Description Humanizer:')
  const statusDesc = formatActivityDescription({
    action: 'status_changed',
    details: { old_status: 'todo', new_status: 'in_progress' },
  })
  if (!statusDesc.includes('todo') || !statusDesc.includes('in progress')) {
    console.error('Status description mismatch:', statusDesc)
    process.exit(1)
  }
  console.log(`  ✓ Status change description: "${statusDesc}"`)

  const assignDesc = formatActivityDescription({
    action: 'assigned',
    details: { new_assignee_id: 'some-user' },
  })
  console.log(`  ✓ Assignment description: "${assignDesc}"`)

  const dueDesc = formatActivityDescription({
    action: 'updated',
    details: { field: 'due_date', old_due_date: '2026-11-15', new_due_date: '2026-11-20' },
  })
  console.log(`  ✓ Due date update description: "${dueDesc}"`)

  console.log('\n🎉 ALL TASK DISCUSSIONS & ACTIVITY TESTS PASSED!')
} catch (err) {
  console.error('Test execution failed:', err)
  process.exit(1)
} finally {
  await server.close()
}

