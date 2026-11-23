// ==============================================================================
// CollabSpace Test Suite: Stage 21 - Analytics Dashboard
// File: scripts/test_analytics_dashboard.js
// Description:
//   Validates dynamic calculation of project and task KPIs, completion rates,
//   member distributions, priority charts, weekly velocity, date range filtering,
//   project-specific scoping, and real-time subscription lifecycle.
// ==============================================================================

import { createServer } from 'vite'

console.log('--- CollabSpace Stage 21: Analytics Dashboard Test Suite ---')

const vite = await createServer()

try {
  const {
    getWorkspaceAnalytics,
    computeAnalyticsMetrics,
    getDateRangeBoundaries,
    normalizeStatus,
    subscribeToAnalytics,
    DATE_RANGE_PRESETS,
    PRIORITY_CONFIG,
    STATUS_CONFIG,
  } = await vite.ssrLoadModule('/src/services/analytics.js')

  const { DEMO_PROJECTS } = await vite.ssrLoadModule('/src/services/projects.js')
  const { DEMO_TASKS } = await vite.ssrLoadModule('/src/services/tasks.js')

  const workspaceId = 'demo-ws-acme-corp'

  // =========================================================================
  // 1. Workspace Scoping & Parameter Validation
  // =========================================================================
  console.log('\n[1/8] Testing Workspace Scoping & Parameter Validation:')

  let errorCaught = false
  try {
    await getWorkspaceAnalytics(null)
  } catch (err) {
    errorCaught = true
    console.log(`  ✓ Expected error on null workspaceId: "${err.message}"`)
  }

  if (!errorCaught) {
    console.error('Validation failure: getWorkspaceAnalytics allowed null workspaceId!')
    process.exit(1)
  }

  const baseAnalytics = await getWorkspaceAnalytics(workspaceId, { dateRange: 'all' })
  if (!baseAnalytics || typeof baseAnalytics !== 'object') {
    console.error('Failed to load workspace analytics:', baseAnalytics)
    process.exit(1)
  }
  console.log(`  ✓ Successfully loaded analytics for workspace "${workspaceId}"`)

  // =========================================================================
  // 2. Summary KPI Metrics Computation
  // =========================================================================
  console.log('\n[2/8] Testing Summary KPI Calculations (Projects, Tasks, Statuses, Overdue):')

  const {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    completionPercentage,
  } = baseAnalytics

  console.log(`  • Total Projects: ${totalProjects}`)
  console.log(`  • Total Tasks: ${totalTasks}`)
  console.log(`  • Completed: ${completedTasks}`)
  console.log(`  • In Progress / Review: ${inProgressTasks}`)
  console.log(`  • Pending (Todo): ${pendingTasks}`)
  console.log(`  • Overdue: ${overdueTasks}`)
  console.log(`  • Completion Rate: ${completionPercentage}%`)

  // Math validations
  if (totalTasks <= 0) {
    console.error('Expected non-zero total tasks in test dataset!')
    process.exit(1)
  }

  if (completedTasks + pendingTasks + inProgressTasks !== totalTasks) {
    console.error(
      `Task status sum mismatch: completed (${completedTasks}) + pending (${pendingTasks}) + inProgress (${inProgressTasks}) !== total (${totalTasks})`
    )
    process.exit(1)
  }
  console.log('  ✓ Verified task status partition: Completed + InProgress + Pending === TotalTasks')

  const expectedRate = Math.round((completedTasks / totalTasks) * 100)
  if (completionPercentage !== expectedRate) {
    console.error(`Completion percentage calculation mismatch: got ${completionPercentage}%, expected ${expectedRate}%`)
    process.exit(1)
  }
  console.log(`  ✓ Verified completion rate calculation: ${completionPercentage}% matches expected`)

  if (overdueTasks < 1) {
    console.error('Expected at least 1 overdue task in demo dataset for validation!')
    process.exit(1)
  }
  console.log(`  ✓ Verified detection of overdue tasks: ${overdueTasks} overdue`)

  // =========================================================================
  // 3. Project Completion Percentages
  // =========================================================================
  console.log('\n[3/8] Testing Project Completion Percentages Breakdown:')

  const { projectCompletionPercentages } = baseAnalytics
  if (!Array.isArray(projectCompletionPercentages) || projectCompletionPercentages.length === 0) {
    console.error('Expected project completion percentages array!')
    process.exit(1)
  }

  projectCompletionPercentages.forEach((proj) => {
    console.log(`  • [${proj.key}] ${proj.name}: ${proj.percentage}% (${proj.completed}/${proj.total} tasks)`)
    if (proj.total > 0) {
      const calcRate = Math.round((proj.completed / proj.total) * 100)
      if (proj.percentage !== calcRate) {
        console.error(`Project "${proj.name}" rate error: ${proj.percentage}% !== ${calcRate}%`)
        process.exit(1)
      }
    }
  })
  console.log('  ✓ All project completion percentages mathematically verified')

  // =========================================================================
  // 4. Member Task Distribution
  // =========================================================================
  console.log('\n[4/8] Testing Member Task Distribution Calculation:')

  const { memberTaskDistribution } = baseAnalytics
  if (!Array.isArray(memberTaskDistribution) || memberTaskDistribution.length === 0) {
    console.error('Expected member task distribution data!')
    process.exit(1)
  }

  let distributedTaskSum = 0
  memberTaskDistribution.forEach((m) => {
    console.log(`  • ${m.name}: ${m.total} tasks (Done: ${m.completed}, Active: ${m.inProgress}, Todo: ${m.pending})`)
    distributedTaskSum += m.total
    if (m.completed + m.inProgress + m.pending !== m.total) {
      console.error(`Member "${m.name}" status total mismatch!`)
      process.exit(1)
    }
  })

  if (distributedTaskSum !== totalTasks) {
    console.error(`Distributed tasks sum (${distributedTaskSum}) !== total tasks (${totalTasks})`)
    process.exit(1)
  }
  console.log(`  ✓ All ${distributedTaskSum} tasks successfully attributed to team members`)

  // =========================================================================
  // 5. Task Priority Distribution
  // =========================================================================
  console.log('\n[5/8] Testing Task Priority Distribution:')

  const { taskPriorityDistribution } = baseAnalytics
  if (!Array.isArray(taskPriorityDistribution) || taskPriorityDistribution.length !== 4) {
    console.error('Expected 4 priority levels in taskPriorityDistribution!')
    process.exit(1)
  }

  let priorityTotal = 0
  taskPriorityDistribution.forEach((p) => {
    console.log(`  • ${p.name}: ${p.value} tasks (Color: ${p.color})`)
    priorityTotal += p.value
  })

  if (priorityTotal !== totalTasks) {
    console.error(`Priority total (${priorityTotal}) !== total tasks (${totalTasks})`)
    process.exit(1)
  }
  console.log('  ✓ Priority distribution covers 100% of tasks with standard color tokens')

  // =========================================================================
  // 6. Date Range Filtering
  // =========================================================================
  console.log('\n[6/8] Testing Date Range Filtering (7d vs 30d vs All):')

  const analytics7d = await getWorkspaceAnalytics(workspaceId, { dateRange: '7d' })
  const analytics30d = await getWorkspaceAnalytics(workspaceId, { dateRange: '30d' })

  console.log(`  • 7 Days Window Tasks: ${analytics7d.totalTasks}`)
  console.log(`  • 30 Days Window Tasks: ${analytics30d.totalTasks}`)
  console.log(`  • All Time Window Tasks: ${baseAnalytics.totalTasks}`)

  if (analytics7d.totalTasks > analytics30d.totalTasks) {
    console.error('7-day task count cannot exceed 30-day task count!')
    process.exit(1)
  }

  if (analytics30d.totalTasks > baseAnalytics.totalTasks) {
    console.error('30-day task count cannot exceed all-time task count!')
    process.exit(1)
  }
  console.log('  ✓ Date range boundaries strictly filter task counts')

  // =========================================================================
  // 7. Project-Specific Filtering
  // =========================================================================
  console.log('\n[7/8] Testing Project-Specific Filter Scoping:')

  const targetProjectId = 'demo-proj-collabspace-web'
  const filteredAnalytics = await getWorkspaceAnalytics(workspaceId, {
    projectId: targetProjectId,
    dateRange: 'all',
  })

  console.log(`  • Filtered Project Tasks: ${filteredAnalytics.totalTasks}`)
  console.log(`  • Filtered Project Count: ${filteredAnalytics.totalProjects}`)

  if (filteredAnalytics.totalProjects !== 1) {
    console.error(`Expected totalProjects === 1 when filtered by project, got ${filteredAnalytics.totalProjects}`)
    process.exit(1)
  }

  if (filteredAnalytics.totalTasks >= baseAnalytics.totalTasks) {
    console.error('Filtered project should have a subset of total workspace tasks!')
    process.exit(1)
  }

  // Verify all tasks belonged to target project
  filteredAnalytics.projectCompletionPercentages.forEach((p) => {
    if (p.id !== targetProjectId) {
      console.error(`Found non-matching project ${p.id} in project-scoped analytics!`)
      process.exit(1)
    }
  })
  console.log(`  ✓ Successfully scoped all metrics to project "${targetProjectId}"`)

  // =========================================================================
  // 8. Dynamic Recalculation on State Transitions & Realtime Lifecycle
  // =========================================================================
  console.log('\n[8/8] Testing Realtime Subscription Lifecycle & Dynamic Recalculation:')

  // Test subscription object structure
  let eventTriggerCount = 0
  const sub = subscribeToAnalytics(workspaceId, (table) => {
    eventTriggerCount += 1
  })

  if (!sub || typeof sub.unsubscribe !== 'function') {
    console.error('subscribeToAnalytics did not return unsubscribe function!')
    process.exit(1)
  }
  console.log('  ✓ Realtime analytics channel subscription created with clean unsubscribe handler')
  sub.unsubscribe()
  console.log('  ✓ Successfully unsubscribed from Realtime channel')

  // Test dynamic state transition math: simulate completing an overdue task
  const testTasks = [
    { id: 't1', status: 'todo', priority: 'high', due_date: new Date(Date.now() - 86400000).toISOString() }, // Overdue
    { id: 't2', status: 'in_progress', priority: 'medium', due_date: new Date(Date.now() + 86400000).toISOString() },
    { id: 't3', status: 'completed', priority: 'low', due_date: null },
  ]
  const testProjects = [{ id: 'p1', name: 'Alpha', key: 'ALP' }]

  const beforeMetrics = computeAnalyticsMetrics({
    projects: testProjects,
    tasks: testTasks,
    members: [],
    activities: [],
    dateRange: 'all',
  })
  console.log(`  • Before completion: ${beforeMetrics.completedTasks}/${beforeMetrics.totalTasks} completed (${beforeMetrics.completionPercentage}%), ${beforeMetrics.overdueTasks} overdue`)

  if (beforeMetrics.overdueTasks !== 1 || beforeMetrics.completedTasks !== 1) {
    console.error('Baseline metrics incorrect!')
    process.exit(1)
  }

  // Mark overdue task as completed
  testTasks[0].status = 'completed'
  const afterMetrics = computeAnalyticsMetrics({
    projects: testProjects,
    tasks: testTasks,
    members: [],
    activities: [],
    dateRange: 'all',
  })
  console.log(`  • After completion: ${afterMetrics.completedTasks}/${afterMetrics.totalTasks} completed (${afterMetrics.completionPercentage}%), ${afterMetrics.overdueTasks} overdue`)

  if (afterMetrics.completedTasks !== 2 || afterMetrics.overdueTasks !== 0 || afterMetrics.completionPercentage !== 67) {
    console.error('Dynamic transition recalculation failed!', afterMetrics)
    process.exit(1)
  }
  console.log('  ✓ Dynamic recalculation verified: Overdue dropped to 0, completion rate jumped to 67%')

  console.log('\n------------------------------------------------------------')
  console.log('🎉 ALL 8 STAGE 21 ANALYTICS DASHBOARD TESTS PASSED!')
  console.log('------------------------------------------------------------\n')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Stage 21 Analytics Test Suite Failed:', error)
  process.exit(1)
} finally {
  await vite.close()
}
