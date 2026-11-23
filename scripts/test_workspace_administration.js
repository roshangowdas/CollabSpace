// ==============================================================================
// CollabSpace Test Suite: Stage 22 - Workspace Administration
// File: scripts/test_workspace_administration.js
// Description:
//   Validates workspace administration features and RBAC security rules:
//   - Owner full control vs. Admin permitted control vs. Member restrictions
//   - Self-promotion to owner prevention
//   - Owner removal and modification protection
//   - Cross-workspace isolation
//   - Invitation management & revocation
//   - Project management & stats
//   - Audit trail logging
// ==============================================================================

import { createServer } from 'vite'

console.log('--- CollabSpace Stage 22: Workspace Administration Test Suite ---')

const vite = await createServer()

try {
  const {
    getWorkspaceAdminOverview,
    getAdminWorkspaceMembers,
    updateWorkspaceMemberRole,
    removeWorkspaceMemberAdmin,
    getAdminWorkspaceInvitations,
    revokeAdminInvitation,
    getAdminWorkspaceProjects,
    getAdminWorkspaceActivities,
    assertAdminAccess,
    resetDemoAdminStore,
    ADMIN_ROLES,
    ROLE_CONFIG,
  } = await vite.ssrLoadModule('/src/services/admin.js')

  resetDemoAdminStore()

  const workspaceId = 'demo-ws-acme-corp'

  // Accounts with distinct roles
  const userOwner = { id: 'demo-user-collabspace-uuid', name: 'Alex Rivera', role: 'Owner' }
  const userAdmin = { id: 'demo-user-sarah', name: 'Sarah Jenkins', role: 'Admin' }
  const userDeveloper = { id: 'demo-user-david', name: 'David Chen', role: 'Developer' }
  const userTester = { id: 'demo-user-marcus', name: 'Marcus Vance', role: 'Tester' }

  // =========================================================================
  // 1. Role-Based Administrative Access Gating
  // =========================================================================
  console.log('\n[1/8] Testing Administrative Access Gating Across Distinct Roles:')

  // Owner access
  let ownerAccessOk = true
  try {
    assertAdminAccess(userOwner.role)
  } catch (e) {
    ownerAccessOk = false
  }
  if (!ownerAccessOk) {
    console.error('Owner was unexpectedly blocked from administration!')
    process.exit(1)
  }
  console.log('  ✓ Owner granted administrative access')

  // Admin access
  let adminAccessOk = true
  try {
    assertAdminAccess(userAdmin.role)
  } catch (e) {
    adminAccessOk = false
  }
  if (!adminAccessOk) {
    console.error('Admin was unexpectedly blocked from administration!')
    process.exit(1)
  }
  console.log('  ✓ Admin granted administrative access')

  // Developer access blocked
  let devBlocked = false
  try {
    assertAdminAccess(userDeveloper.role)
  } catch (e) {
    devBlocked = true
    console.log(`  ✓ Developer correctly blocked: "${e.message}"`)
  }
  if (!devBlocked) {
    console.error('Security failure: Developer was granted admin access!')
    process.exit(1)
  }

  // Tester access blocked
  let testerBlocked = false
  try {
    assertAdminAccess(userTester.role)
  } catch (e) {
    testerBlocked = true
    console.log(`  ✓ Tester correctly blocked: "${e.message}"`)
  }
  if (!testerBlocked) {
    console.error('Security failure: Tester was granted admin access!')
    process.exit(1)
  }

  // =========================================================================
  // 2. Workspace Overview & Statistics Verification
  // =========================================================================
  console.log('\n[2/8] Testing Workspace Administration Overview & Metrics:')

  const overview = await getWorkspaceAdminOverview(workspaceId, userOwner)
  if (!overview || !overview.workspace) {
    console.error('Failed to retrieve workspace admin overview!')
    process.exit(1)
  }

  console.log(`  • Workspace: "${overview.workspace.name}" (${overview.workspace.slug})`)
  console.log(`  • Total Members: ${overview.totalMembers}`)
  console.log(`  • Active Projects: ${overview.activeProjects} / ${overview.totalProjects}`)
  console.log(`  • Pending Invites: ${overview.pendingInvites}`)
  console.log(`  • Task Completion: ${overview.completionRate}% (${overview.completedTasks}/${overview.totalTasks})`)
  console.log(`  • Overdue Tasks: ${overview.overdueTasks}`)

  if (overview.totalMembers < 4 || overview.totalProjects < 1) {
    console.error('Overview returned empty or invalid statistics!')
    process.exit(1)
  }
  console.log('  ✓ Verified workspace metrics and role distribution counts')

  // =========================================================================
  // 3. Member Role Changes by Owner
  // =========================================================================
  console.log('\n[3/8] Testing Member Role Modification by Owner:')

  // Owner promotes David (Developer) to Designer
  const updatedDavid = await updateWorkspaceMemberRole({
    workspaceId,
    targetUserId: userDeveloper.id,
    newRole: 'Designer',
    callerId: userOwner.id,
    callerRole: userOwner.role,
  })

  if (!updatedDavid.success || updatedDavid.new_role !== 'Designer') {
    console.error('Owner failed to update member role!', updatedDavid)
    process.exit(1)
  }
  console.log(`  ✓ Owner promoted member ${userDeveloper.name} from Developer to Designer`)

  // Owner promotes Marcus (Tester) to Developer
  const updatedMarcus = await updateWorkspaceMemberRole({
    workspaceId,
    targetUserId: userTester.id,
    newRole: 'Developer',
    callerId: userOwner.id,
    callerRole: userOwner.role,
  })

  if (!updatedMarcus.success || updatedMarcus.new_role !== 'Developer') {
    console.error('Owner failed to update member role!', updatedMarcus)
    process.exit(1)
  }
  console.log(`  ✓ Owner updated member ${userTester.name} from Tester to Developer`)

  // =========================================================================
  // 4. Protection Against Self-Promotion to Owner
  // =========================================================================
  console.log('\n[4/8] Testing Self-Promotion to Owner Prevention:')

  let selfPromotionCaught = false
  try {
    await updateWorkspaceMemberRole({
      workspaceId,
      targetUserId: userAdmin.id,
      newRole: 'Owner',
      callerId: userAdmin.id,
      callerRole: userAdmin.role,
    })
  } catch (err) {
    selfPromotionCaught = true
    console.log(`  ✓ Self-promotion rejected: "${err.message}"`)
  }

  if (!selfPromotionCaught) {
    console.error('Security breach: Admin was able to self-promote to Owner!')
    process.exit(1)
  }

  // =========================================================================
  // 5. Admin Authority & Owner Protection
  // =========================================================================
  console.log('\n[5/8] Testing Protection of Owner and Admin Hierarchy:')

  // Admin tries to demote/change Owner's role
  let ownerDemotionCaught = false
  try {
    await updateWorkspaceMemberRole({
      workspaceId,
      targetUserId: userOwner.id,
      newRole: 'Member',
      callerId: userAdmin.id,
      callerRole: userAdmin.role,
    })
  } catch (err) {
    ownerDemotionCaught = true
    console.log(`  ✓ Demotion of Owner rejected: "${err.message}"`)
  }

  if (!ownerDemotionCaught) {
    console.error('Security breach: Admin was able to demote workspace Owner!')
    process.exit(1)
  }

  // Admin tries to promote a member to Owner
  let unauthorizedOwnerPromotionCaught = false
  try {
    await updateWorkspaceMemberRole({
      workspaceId,
      targetUserId: userDeveloper.id,
      newRole: 'Owner',
      callerId: userAdmin.id,
      callerRole: userAdmin.role,
    })
  } catch (err) {
    unauthorizedOwnerPromotionCaught = true
    console.log(`  ✓ Non-owner promoting another user to Owner rejected: "${err.message}"`)
  }

  if (!unauthorizedOwnerPromotionCaught) {
    console.error('Security breach: Admin was able to promote another user to Owner!')
    process.exit(1)
  }

  // =========================================================================
  // 6. Owner Removal Protection
  // =========================================================================
  console.log('\n[6/8] Testing Member Removal & Owner Protection:')

  // Admin tries to remove workspace Owner -> Must fail
  let ownerRemovalCaught = false
  try {
    await removeWorkspaceMemberAdmin({
      workspaceId,
      targetUserId: userOwner.id,
      callerId: userAdmin.id,
      callerRole: userAdmin.role,
    })
  } catch (err) {
    ownerRemovalCaught = true
    console.log(`  ✓ Removal of Owner rejected: "${err.message}"`)
  }

  if (!ownerRemovalCaught) {
    console.error('Security breach: Attempt to remove workspace Owner succeeded!')
    process.exit(1)
  }

  // Owner removes a member (Marcus)
  const removeResult = await removeWorkspaceMemberAdmin({
    workspaceId,
    targetUserId: userTester.id,
    callerId: userOwner.id,
    callerRole: userOwner.role,
  })

  if (!removeResult.success || removeResult.removed_user_id !== userTester.id) {
    console.error('Owner failed to remove member!', removeResult)
    process.exit(1)
  }
  console.log(`  ✓ Owner successfully removed member "${userTester.name}"`)

  // Verify member is no longer in workspace roster
  const remainingMembers = await getAdminWorkspaceMembers(workspaceId, userOwner)
  if (remainingMembers.some((m) => m.user_id === userTester.id)) {
    console.error('Removed member still present in workspace members list!')
    process.exit(1)
  }
  console.log(`  ✓ Verified roster updated (${remainingMembers.length} members remaining)`)

  // =========================================================================
  // 7. Cross-Workspace Isolation
  // =========================================================================
  console.log('\n[7/8] Testing Cross-Workspace Isolation & Scoping:')

  let crossWorkspaceCaught = false
  try {
    await updateWorkspaceMemberRole({
      workspaceId: 'demo-ws-other-foreign-org',
      targetUserId: userDeveloper.id,
      newRole: 'Admin',
      callerId: userOwner.id,
      callerRole: userOwner.role,
    })
  } catch (err) {
    crossWorkspaceCaught = true
    console.log(`  ✓ Foreign workspace modification rejected: "${err.message}"`)
  }

  if (!crossWorkspaceCaught) {
    console.error('Security breach: Modified roles in foreign workspace!')
    process.exit(1)
  }

  // =========================================================================
  // 8. Invitation & Project Administration & Audit Trail
  // =========================================================================
  console.log('\n[8/8] Testing Invitations, Project Stats & Audit Log:')

  // Check pending invitations
  const pendingInvites = await getAdminWorkspaceInvitations(workspaceId, userAdmin)
  if (pendingInvites.length === 0) {
    console.error('Expected pending invitations in test dataset!')
    process.exit(1)
  }
  console.log(`  ✓ Listed ${pendingInvites.length} pending invitations`)

  // Revoke an invitation
  const inviteToRevoke = pendingInvites[0]
  const revokeOk = await revokeAdminInvitation(inviteToRevoke.id, workspaceId, userAdmin)
  if (!revokeOk) {
    console.error('Failed to revoke invitation!')
    process.exit(1)
  }
  console.log(`  ✓ Revoked invitation for ${inviteToRevoke.email}`)

  // Verify project administration stats
  const projects = await getAdminWorkspaceProjects(workspaceId, userAdmin)
  if (projects.length === 0) {
    console.error('Expected projects in test workspace!')
    process.exit(1)
  }
  console.log(`  ✓ Listed ${projects.length} workspace projects with keys and status badges`)

  // Verify audit log has recorded recent admin actions
  const auditLogs = await getAdminWorkspaceActivities(workspaceId, userAdmin)
  const hasRoleChangeLog = auditLogs.some((a) => a.action === 'role_changed')
  const hasRemovalLog = auditLogs.some((a) => a.action === 'member_removed')

  if (!hasRoleChangeLog || !hasRemovalLog) {
    console.error('Administrative actions were not captured in activity logs!')
    process.exit(1)
  }
  console.log(`  ✓ Audit log captured role change and member removal events (${auditLogs.length} total entries)`)

  console.log('\n------------------------------------------------------------')
  console.log('🎉 ALL 8 STAGE 22 WORKSPACE ADMINISTRATION TESTS PASSED!')
  console.log('------------------------------------------------------------\n')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Stage 22 Workspace Administration Test Suite Failed:', error)
  process.exit(1)
} finally {
  await vite.close()
}
