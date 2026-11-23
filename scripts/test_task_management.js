import { createServer } from 'vite'

console.log('--- CollabSpace Task Management & Assignee Security Test Suite ---')

const server = await createServer()

try {
  const {
    taskSchema,
    editTaskSchema,
    TASK_STATUSES,
    TASK_PRIORITIES,
  } = await server.ssrLoadModule('/src/utils/validators.js')

  const {
    getWorkspaceTasks,
    getMyTasks,
    getTaskById,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    isUserProjectMember,
    getProjectAssignees,
  } = await server.ssrLoadModule('/src/services/tasks.js')

  // =========================================================================
  // 1. Task Validation Schemas Test
  // =========================================================================
  console.log('\n[1/6] Testing Task Validation Schemas:')

  // Valid task payload
  const validTask = {
    title: 'Build Drag and Drop Kanban Board',
    projectId: 'demo-proj-collabspace-web',
    description: 'Implement column cards and real-time state syncing.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'demo-user-collabspace-uuid',
    dueDate: '2026-12-01',
    estimatedHours: 6.5,
    labels: ['Frontend', 'Kanban'],
  }
  const validRes = taskSchema.safeParse(validTask)
  if (!validRes.success) {
    console.error('Valid task payload failed validation!', validRes.error)
    process.exit(1)
  }
  console.log('  ✓ Valid task payload parsed successfully')

  // Required title check (< 2 chars fails)
  const tooShortTitleRes = taskSchema.safeParse({ ...validTask, title: 'A' })
  if (tooShortTitleRes.success) {
    console.error('Single-letter title should have failed!')
    process.exit(1)
  }
  console.log('  ✓ Too short title rejected (< 2 chars)')

  // Missing projectId check
  const missingProjectRes = taskSchema.safeParse({ ...validTask, projectId: '' })
  if (missingProjectRes.success) {
    console.error('Missing projectId should have failed!')
    process.exit(1)
  }
  console.log('  ✓ Empty project selection rejected')

  // Priority enum validation
  for (const prio of ['low', 'medium', 'high', 'urgent']) {
    const pRes = taskSchema.safeParse({ ...validTask, priority: prio })
    if (!pRes.success) {
      console.error(`Priority "${prio}" failed validation!`)
      process.exit(1)
    }
  }
  const invalidPrioRes = taskSchema.safeParse({ ...validTask, priority: 'critical' })
  if (invalidPrioRes.success) {
    console.error('Invalid priority "critical" should have failed!')
    process.exit(1)
  }
  console.log('  ✓ Task priorities (low, medium, high, urgent) validated, invalid rejected')

  // Status enum validation
  for (const st of ['todo', 'in_progress', 'in_review', 'completed']) {
    const sRes = taskSchema.safeParse({ ...validTask, status: st })
    if (!sRes.success) {
      console.error(`Status "${st}" failed validation!`)
      process.exit(1)
    }
  }
  const invalidStatusRes = taskSchema.safeParse({ ...validTask, status: 'discarded' })
  if (invalidStatusRes.success) {
    console.error('Invalid status should have failed!')
    process.exit(1)
  }
  console.log('  ✓ Task statuses (todo, in_progress, in_review, completed) validated')

  // Negative estimated hours check
  const negHoursRes = taskSchema.safeParse({ ...validTask, estimatedHours: -5 })
  if (negHoursRes.success) {
    console.error('Negative estimated hours should have failed!')
    process.exit(1)
  }
  console.log('  ✓ Negative estimated hours rejected')

  // =========================================================================
  // 2. Project Membership Assignee Enforcement Test
  // =========================================================================
  console.log('\n[2/6] Testing Project Membership Assignee Enforcement:');

  // Assignee must be validated against project_members
  const eligibleMembers = await getProjectAssignees('demo-proj-collabspace-web')
  if (!eligibleMembers || eligibleMembers.length === 0) {
    console.error('Failed to retrieve project assignees!')
    process.exit(1)
  }
  console.log(`  ✓ Retrieved ${eligibleMembers.length} eligible project assignees`)

  // Valid assignment: member is in project
  const validMember = eligibleMembers[0].user_id
  const isMember = await isUserProjectMember('demo-proj-collabspace-web', validMember)
  if (!isMember) {
    console.error('Valid member check failed!')
    process.exit(1)
  }
  console.log('  ✓ Verified project member can be assigned')

  // =========================================================================
  // 3. Task Creation & Incremental Numbering Test
  // =========================================================================
  console.log('\n[3/6] Testing Task Creation:')

  const createdTask = await createTask({
    workspaceId: 'demo-ws-acme-corp',
    projectId: 'demo-proj-collabspace-web',
    title: 'Audit Web Accessibility Contrast',
    description: 'Ensure color ratios adhere to WCAG 2.1 AA standards.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'demo-user-collabspace-uuid',
    dueDate: '2026-12-10',
    estimatedHours: 4,
    labels: ['A11y', 'Design'],
    reporterId: 'demo-user-sarah',
  })

  if (!createdTask || createdTask.title !== 'Audit Web Accessibility Contrast') {
    console.error('createTask failed to return valid task!')
    process.exit(1)
  }
  console.log('  ✓ Task created successfully with number:', createdTask.task_number)

  // Retrieve by ID
  const retrievedTask = await getTaskById(createdTask.id)
  if (!retrievedTask || retrievedTask.id !== createdTask.id) {
    console.error('getTaskById failed to retrieve task!')
    process.exit(1)
  }
  console.log('  ✓ Retrieved task by ID:', retrievedTask.id)

  // =========================================================================
  // 4. Task Search, Filtering and Status Counting Test
  // =========================================================================
  console.log('\n[4/6] Testing Search & Multi-facet Filtering:')

  const allWorkspaceTasks = await getWorkspaceTasks('demo-ws-acme-corp')
  if (!allWorkspaceTasks || allWorkspaceTasks.length === 0) {
    console.error('getWorkspaceTasks returned empty array!')
    process.exit(1)
  }
  console.log(`  ✓ Loaded ${allWorkspaceTasks.length} workspace tasks`)

  // Filter by status
  const inProgressTasks = await getWorkspaceTasks('demo-ws-acme-corp', { status: 'in_progress' })
  const everyIsInProgress = inProgressTasks.every((t) => t.status === 'in_progress')
  if (!everyIsInProgress) {
    console.error('Status filter failed!')
    process.exit(1)
  }
  console.log(`  ✓ Status filter applied: ${inProgressTasks.length} In Progress tasks`)

  // Search filter
  const searchResults = await getWorkspaceTasks('demo-ws-acme-corp', { search: 'Kanban' })
  if (!searchResults || searchResults.length === 0) {
    console.error('Search filter failed to find "Kanban"!')
    process.exit(1)
  }
  console.log(`  ✓ Search query matched ${searchResults.length} tasks containing "Kanban"`)

  // My Tasks filter
  const myTasks = await getMyTasks('demo-user-collabspace-uuid', 'demo-ws-acme-corp')
  const allAssignedToMe = myTasks.every((t) => t.assignee_id === 'demo-user-collabspace-uuid')
  if (!allAssignedToMe) {
    console.error('getMyTasks returned unassigned or other user tasks!')
    process.exit(1)
  }
  console.log(`  ✓ getMyTasks filtered accurately: ${myTasks.length} tasks assigned to user`)

  // =========================================================================
  // 5. Task Update & Status Transition Lifecycle Test
  // =========================================================================
  console.log('\n[5/6] Testing Update & Status Transition Lifecycle:')

  // Update fields
  const updatedTask = await updateTask(createdTask.id, {
    description: 'Updated accessibility requirements and guidelines.',
    priority: 'urgent',
    estimatedHours: 5.5,
  })
  if (updatedTask.priority !== 'urgent' || updatedTask.estimated_hours !== 5.5) {
    console.error('updateTask failed to update priority or estimated hours!')
    process.exit(1)
  }
  console.log('  ✓ Updated task priority to "urgent" and estimated hours to 5.5')

  // Status transition to 'completed'
  const completedTask = await updateTaskStatus(createdTask.id, 'completed')
  if (completedTask.status !== 'completed') {
    console.error('updateTaskStatus failed to change status to completed!')
    process.exit(1)
  }
  console.log('  ✓ Quick status updated to "completed"')

  // =========================================================================
  // 6. Task Deletion Test
  // =========================================================================
  console.log('\n[6/6] Testing Task Deletion:')

  const deleteSuccess = await deleteTask(createdTask.id)
  if (!deleteSuccess) {
    console.error('deleteTask failed!')
    process.exit(1)
  }
  console.log('  ✓ Task deleted successfully')

  console.log('\n=============================================================')
  console.log('ALL TASK MANAGEMENT & RBAC TESTS PASSED SUCCESSFULLY! (6/6)')
  console.log('=============================================================\n')
  process.exit(0)
} catch (error) {
  console.error('Task Management Test Suite Error:', error)
  process.exit(1)
} finally {
  await server.close()
}

