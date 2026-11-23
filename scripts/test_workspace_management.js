import { createServer } from 'vite'

console.log('--- CollabSpace Workspace Management Test Suite ---')

const server = await createServer()

try {
  const { workspaceSchema, inviteMemberSchema } = await server.ssrLoadModule('/src/utils/validators.js')
  const {
    getUserWorkspaces,
    createWorkspace,
    updateWorkspace,
    getWorkspaceMembers,
    updateMemberRole,
    removeWorkspaceMember,
    deleteWorkspace,
    checkWorkspaceSlugAvailability,
  } = await server.ssrLoadModule('/src/services/workspaces.js')

  // 1. Test workspaceSchema
  console.log('\n[1/4] Testing workspaceSchema Validation:')
  const validWs = {
    name: 'Acme Robotics',
    slug: 'acme-robotics',
    description: 'Building autonomous robotics systems.',
  }
  const wsRes1 = workspaceSchema.safeParse(validWs)
  if (!wsRes1.success) {
    console.error('Validation failed on valid workspace:', wsRes1.error)
    process.exit(1)
  }
  console.log('  ✓ Valid workspace input parsed successfully')

  const invalidWs = {
    name: 'A', // too short (<2)
    slug: '-bad-slug-', // starts and ends with hyphens
    description: 'x'.repeat(301), // too long
  }
  const wsRes2 = workspaceSchema.safeParse(invalidWs)
  if (wsRes2.success || wsRes2.error.errors.length < 3) {
    console.error('Expected validation failure on invalid workspace:', wsRes2)
    process.exit(1)
  }
  console.log('  ✓ Invalid workspace inputs caught correctly (name length, slug format, desc length)')

  // 2. Test inviteMemberSchema
  console.log('\n[2/4] Testing inviteMemberSchema Validation:')
  const validInvite = { email: 'teammate@acme.com', role: 'Member' }
  const invRes1 = inviteMemberSchema.safeParse(validInvite)
  if (!invRes1.success) {
    console.error('Validation failed on valid invite:', invRes1.error)
    process.exit(1)
  }
  console.log('  ✓ Valid invite parsed successfully')

  const invalidInvite = { email: 'not-an-email', role: 'SuperUser' }
  const invRes2 = inviteMemberSchema.safeParse(invalidInvite)
  if (invRes2.success || invRes2.error.errors.length < 2) {
    console.error('Expected validation failure on invalid invite:', invRes2)
    process.exit(1)
  }
  console.log('  ✓ Invalid email and invalid role caught correctly')

  // 3. Test checkWorkspaceSlugAvailability
  console.log('\n[3/4] Testing checkWorkspaceSlugAvailability:')
  const slugCheck1 = await checkWorkspaceSlugAvailability('new-startup-team')
  console.log('  ✓ Available slug result:', slugCheck1.available)
  if (!slugCheck1.available) process.exit(1)

  const slugCheck2 = await checkWorkspaceSlugAvailability('a') // too short
  console.log('  ✓ Invalid slug rejected:', !slugCheck2.available)
  if (slugCheck2.available) process.exit(1)

  // 4. Test Workspace CRUD Lifecycle in Service
  console.log('\n[4/4] Testing Workspace CRUD & Membership Operations:')
  const created = await createWorkspace({
    name: 'Quantum Cloud Engine',
    slug: 'quantum-cloud',
    description: 'Distributed compute grid',
    userId: 'demo-user-1',
  })
  console.log('  ✓ Created workspace:', created.name, 'with role:', created.role)
  if (created.role !== 'Owner') {
    console.error('Creator must be assigned Owner role!')
    process.exit(1)
  }

  const workspacesList = await getUserWorkspaces('demo-user-1')
  console.log('  ✓ Fetched workspaces count:', workspacesList.length)
  if (workspacesList.length === 0) {
    console.error('Expected workspaces list to contain items')
    process.exit(1)
  }

  const membersList = await getWorkspaceMembers(created.id)
  console.log('  ✓ Fetched workspace members count:', membersList.length)
  if (membersList.length === 0) {
    console.error('Expected members list to contain records')
    process.exit(1)
  }

  const updatedWs = await updateWorkspace(created.id, {
    name: 'Quantum Cloud Engine v2',
    description: 'Updated mission description',
  })
  console.log('  ✓ Updated workspace name:', updatedWs.name)
  if (updatedWs.name !== 'Quantum Cloud Engine v2') process.exit(1)

  const memberToPromote = membersList[1]
  if (memberToPromote) {
    const promoted = await updateMemberRole(created.id, memberToPromote.user_id, 'Admin')
    console.log('  ✓ Promoted member role to:', promoted.role)
    if (promoted.role !== 'Admin') process.exit(1)
  }

  const deleted = await deleteWorkspace(created.id)
  console.log('  ✓ Deleted workspace successfully:', deleted)
  if (!deleted) process.exit(1)

  console.log('\nAll Workspace Management unit and service tests passed successfully!')
} finally {
  await server.close()
}
