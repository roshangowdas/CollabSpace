import { createServer } from 'vite'

console.log('--- CollabSpace Project Management & RBAC Test Suite ---')

const server = await createServer()

try {
  const {
    projectSchema,
    editProjectSchema,
    projectMemberSchema,
  } = await server.ssrLoadModule('/src/utils/validators.js')

  const {
    generateProjectKey,
    calculateProjectProgress,
    getWorkspaceProjects,
    getProjectById,
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
    getProjectMembers,
    assignProjectMember,
    removeProjectMember,
    canUserModifyProject,
    isProjectKeyAvailable,
  } = await server.ssrLoadModule('/src/services/projects.js')

  // =========================================================================
  // 1. Project Validation Schemas Test
  // =========================================================================
  console.log('\n[1/6] Testing Project Validation Schemas:')

  // Valid project creation payload
  const validPayload = {
    name: 'Real-time Canvas Engine',
    key: 'CANV',
    description: 'High-performance interactive SVG canvas for team whiteboards.',
    startDate: '2026-11-01',
    dueDate: '2026-12-15',
    visibility: 'workspace',
    status: 'active',
  }
  const validRes = projectSchema.safeParse(validPayload)
  if (!validRes.success) {
    console.error('Valid project payload failed validation!', validRes.error)
    process.exit(1)
  }
  console.log('  ✓ Valid project payload parsed successfully')

  // Invalid key: lowercase or contains symbols
  const invalidKeyRes = projectSchema.safeParse({ ...validPayload, key: 'canv-12' })
  if (invalidKeyRes.success) {
    console.error('Project key with lowercase/hyphen should have failed validation!')
    process.exit(1)
  }
  console.log('  ✓ Invalid project key (lowercase/hyphen) rejected as expected')

  // Invalid key: too short (< 2 chars)
  const tooShortKeyRes = projectSchema.safeParse({ ...validPayload, key: 'C' })
  if (tooShortKeyRes.success) {
    console.error('Project key with 1 character should have failed validation!')
    process.exit(1)
  }
  console.log('  ✓ Single-character project key rejected (< 2 chars)')

  // Invalid Date Range: dueDate before startDate
  const invalidDateRangeRes = projectSchema.safeParse({
    ...validPayload,
    startDate: '2026-12-01',
    dueDate: '2026-11-01',
  })
  if (invalidDateRangeRes.success) {
    console.error('Invalid date range (dueDate < startDate) should have failed validation!')
    process.exit(1)
  }
  console.log('  ✓ Due date before start date rejected by refinement rule')

  // Project member schema
  const memberRes = projectMemberSchema.safeParse({ userId: 'user-uuid-123', role: 'Contributor' })
  if (!memberRes.success) {
    console.error('Valid project member payload failed!', memberRes.error)
    process.exit(1)
  }
  const invalidMemberRoleRes = projectMemberSchema.safeParse({ userId: 'user-uuid-123', role: 'SuperUser' })
  if (invalidMemberRoleRes.success) {
    console.error('Invalid member role should have been rejected!')
    process.exit(1)
  }
  console.log('  ✓ Project member role constraints (Lead, Contributor, Viewer) verified')

  // =========================================================================
  // 2. Helper Functions Test
  // =========================================================================
  console.log('\n[2/6] Testing Project Helper Functions:')

  // Key generation
  const key1 = generateProjectKey('CollabSpace Web Platform')
  if (key1 !== 'CWP') {
    console.error(`Expected 'CWP', got '${key1}'`)
    process.exit(1)
  }
  const key2 = generateProjectKey('Analytics')
  if (key2 !== 'ANAL') {
    console.error(`Expected 'ANAL', got '${key2}'`)
    process.exit(1)
  }
  console.log(`  ✓ Key generator: "CollabSpace Web Platform" -> "${key1}", "Analytics" -> "${key2}"`)

  // Progress computation
  const prog0 = calculateProjectProgress(0, 0)
  const progHalf = calculateProjectProgress(10, 5)
  const progFull = calculateProjectProgress(25, 25)
  if (prog0 !== 0 || progHalf !== 50 || progFull !== 100) {
    console.error(`Progress calculation failed: 0->${prog0}, 5/10->${progHalf}, 25/25->${progFull}`)
    process.exit(1)
  }
  console.log(`  ✓ Progress calculation: 0 total = ${prog0}%, 5/10 = ${progHalf}%, 25/25 = ${progFull}%`)

  // =========================================================================
  // 3. Project Creation & Retrieval Test
  // =========================================================================
  console.log('\n[3/6] Testing Project Creation & Retrieval:')

  const testProject = await createProject({
    workspaceId: 'demo-ws-acme-corp',
    name: 'Security Hardening Sprints',
    key: 'SEC',
    description: 'Quarterly compliance and penetration testing milestones.',
    startDate: '2026-11-01',
    dueDate: '2026-12-01',
    visibility: 'workspace',
    status: 'active',
    userId: 'demo-user-collabspace-uuid',
  })

  if (!testProject || testProject.name !== 'Security Hardening Sprints') {
    console.error('createProject failed to return valid project record!')
    process.exit(1)
  }
  console.log('  ✓ Project created successfully with ID:', testProject.id)

  // Verify retrieval
  const retrieved = await getProjectById(testProject.id)
  if (!retrieved || retrieved.key !== 'SEC') {
    console.error('getProjectById failed to retrieve created project!')
    process.exit(1)
  }
  console.log('  ✓ Retrieved project by ID with key:', retrieved.key)

  // =========================================================================
  // 4. Project Update, Archive & Restore Lifecycle Test
  // =========================================================================
  console.log('\n[4/6] Testing Update, Archive, and Restore Lifecycle:')

  // Update
  const updated = await updateProject(testProject.id, {
    description: 'Updated security milestones and audit schedule.',
    status: 'paused',
  })
  if (updated.status !== 'paused' || !updated.description.includes('Updated')) {
    console.error('updateProject failed to modify project attributes!')
    process.exit(1)
  }
  console.log('  ✓ Project updated to status "paused" and description updated')

  // Archive
  const archived = await archiveProject(testProject.id)
  if (archived.status !== 'archived') {
    console.error('archiveProject failed to set status to archived!')
    process.exit(1)
  }
  console.log('  ✓ Project archived successfully')

  // Restore
  const restored = await restoreProject(testProject.id)
  if (restored.status !== 'active') {
    console.error('restoreProject failed to return project to active!')
    process.exit(1)
  }
  console.log('  ✓ Project restored back to "active"')

  // =========================================================================
  // 5. Project Member Assignment & Role Management Test
  // =========================================================================
  console.log('\n[5/6] Testing Member Assignment & Role Management:')

  const newMember = await assignProjectMember(
    testProject.id,
    'demo-user-sarah',
    'Contributor'
  )
  if (!newMember || newMember.role !== 'Contributor') {
    console.error('assignProjectMember failed to assign user!')
    process.exit(1)
  }
  console.log('  ✓ Member assigned as "Contributor"')

  // Role update to Lead
  const updatedMemberRole = await assignProjectMember(
    testProject.id,
    'demo-user-sarah',
    'Lead'
  )
  if (updatedMemberRole.role !== 'Lead') {
    console.error('Failed to elevate member to Lead!')
    process.exit(1)
  }
  console.log('  ✓ Member role successfully elevated to "Lead"')

  // Remove member
  const removeSuccess = await removeProjectMember(testProject.id, 'demo-user-sarah')
  if (!removeSuccess) {
    console.error('removeProjectMember failed!')
    process.exit(1)
  }
  console.log('  ✓ Member successfully removed from project')

  // Delete project
  const deleteSuccess = await deleteProject(testProject.id)
  if (!deleteSuccess) {
    console.error('deleteProject failed!')
    process.exit(1)
  }
  console.log('  ✓ Project successfully deleted')

  // =========================================================================
  // 6. RBAC & Access Control Boundary Tests
  // =========================================================================
  console.log('\n[6/6] Testing RBAC Permissions & Role Boundaries:')

  // Owner can always modify
  const ownerCanModify = canUserModifyProject('Owner', [], 'user-1')
  if (!ownerCanModify) {
    console.error('Workspace Owner should always have modify access!')
    process.exit(1)
  }
  console.log('  ✓ Workspace Owner granted modify access')

  // Admin can always modify
  const adminCanModify = canUserModifyProject('Admin', [], 'user-1')
  if (!adminCanModify) {
    console.error('Workspace Admin should always have modify access!')
    process.exit(1)
  }
  console.log('  ✓ Workspace Admin granted modify access')

  // Project Lead can modify
  const leadCanModify = canUserModifyProject('Member', [{ user_id: 'user-lead', role: 'Lead' }], 'user-lead')
  if (!leadCanModify) {
    console.error('Project Lead should have modify access!')
    process.exit(1)
  }
  console.log('  ✓ Project Lead granted modify access')

  // Regular Contributor cannot modify
  const contribCanModify = canUserModifyProject('Member', [{ user_id: 'user-contrib', role: 'Contributor' }], 'user-contrib')
  if (contribCanModify) {
    console.error('Contributor should NOT have modify access!')
    process.exit(1)
  }
  console.log('  ✓ Contributor correctly denied project modification access')

  // Regular Viewer cannot modify
  const viewerCanModify = canUserModifyProject('Member', [{ user_id: 'user-viewer', role: 'Viewer' }], 'user-viewer')
  if (viewerCanModify) {
    console.error('Viewer should NOT have modify access!')
    process.exit(1)
  }
  console.log('  ✓ Viewer correctly denied project modification access')

  console.log('\n=============================================================')
  console.log('ALL PROJECT MANAGEMENT & RBAC TESTS PASSED SUCCESSFULLY! (6/6)')
  console.log('=============================================================\n')
  process.exit(0)
} catch (error) {
  console.error('Project Management Test Suite Error:', error)
  process.exit(1)
} finally {
  await server.close()
}

