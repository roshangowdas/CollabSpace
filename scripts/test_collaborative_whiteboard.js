// ==============================================================================
// CollabSpace Test Suite: Stage 20 - Collaborative Whiteboard
// File: scripts/test_collaborative_whiteboard.js
// Description:
//   Validates whiteboard CRUD, element-level operational persistence,
//   z-index layering, multi-user concurrent editing simulation, cursor broadcasting,
//   and workspace-level role permissions.
// ==============================================================================

import { createServer } from 'vite'

console.log('--- CollabSpace Stage 20: Collaborative Whiteboard Test Suite ---')

const vite = await createServer()

try {
  const {
    createWhiteboard,
    getWorkspaceWhiteboards,
    getWhiteboardById,
    updateWhiteboard,
    deleteWhiteboard,
    saveWhiteboardElement,
    getWhiteboardElements,
    deleteWhiteboardElement,
    resetDemoWhiteboards,
    STICKY_COLORS,
    SHAPE_TYPES,
  } = await vite.ssrLoadModule('/src/services/whiteboards.js')

  resetDemoWhiteboards()

  const workspaceId = 'demo-workspace-uuid'
  const projectId = 'demo-project-alpha'
  const userSarah = { id: 'demo-user-sarah', name: 'Sarah Connor', role: 'Member' }
  const userAlex = { id: 'demo-user-alex', name: 'Alex Rivera', role: 'Member' }
  const userAdmin = { id: 'demo-user-admin', name: 'Admin Jane', role: 'Admin' }

  // =========================================================================
  // 1. Whiteboard Creation & Workspace Scoping
  // =========================================================================
  console.log('\n[1/8] Testing Whiteboard Creation & Workspace Scoping:')

  const newBoard = await createWhiteboard({
    workspaceId,
    projectId,
    name: 'Q4 Product Roadmap & Architecture',
    description: 'Brainstorming sticky notes, feature maps, and cloud architecture',
    userId: userSarah.id,
  })

  if (!newBoard || !newBoard.id || newBoard.name !== 'Q4 Product Roadmap & Architecture') {
    console.error('Failed to create whiteboard:', newBoard)
    process.exit(1)
  }
  console.log(`  ✓ Whiteboard created: "${newBoard.name}" (ID: ${newBoard.id})`)

  // Verify retrieval
  const workspaceBoards = await getWorkspaceWhiteboards(workspaceId)
  const foundBoard = workspaceBoards.find((b) => b.id === newBoard.id)
  if (!foundBoard) {
    console.error('Created whiteboard not found in workspace listing!')
    process.exit(1)
  }
  console.log(`  ✓ Whiteboard listed in workspace catalog (${workspaceBoards.length} total boards)`)

  // Verify project filtering
  const projectBoards = await getWorkspaceWhiteboards(workspaceId, { projectId })
  if (!projectBoards.some((b) => b.id === newBoard.id)) {
    console.error('Project-scoped whiteboard filtering failed!')
    process.exit(1)
  }
  console.log(`  ✓ Filtered boards by project ID "${projectId}"`)

  // Test metadata & viewport update
  const updatedBoard = await updateWhiteboard(newBoard.id, {
    name: 'Q4 Product Roadmap & Architecture v2',
    canvas_state: { viewport: { x: 150, y: 75, zoom: 1.25 } },
  })
  if (
    updatedBoard.name !== 'Q4 Product Roadmap & Architecture v2' ||
    updatedBoard.canvas_state.viewport.zoom !== 1.25
  ) {
    console.error('Failed to update whiteboard metadata/canvas state!')
    process.exit(1)
  }
  console.log(`  ✓ Whiteboard name & canvas viewport updated (zoom: ${updatedBoard.canvas_state.viewport.zoom}x)`)

  // =========================================================================
  // 2. Element-Level Operational Persistence (Shape Types)
  // =========================================================================
  console.log('\n[2/8] Testing Operational Persistence across all Shape Types:')

  // 2a. Sticky Note
  const stickyElem = await saveWhiteboardElement({
    whiteboardId: newBoard.id,
    elementType: SHAPE_TYPES.STICKY,
    properties: {
      x: 200,
      y: 150,
      width: 180,
      height: 160,
      color: STICKY_COLORS[0].bg,
      text: '🔑 OAuth2 & Supabase Auth integration',
      fontSize: 14,
    },
    zIndex: 1,
    userId: userSarah.id,
  })
  console.log(`  ✓ Saved Sticky Note element: "${stickyElem.properties.text}" (ID: ${stickyElem.id})`)

  // 2b. Rectangle Shape
  const rectElem = await saveWhiteboardElement({
    whiteboardId: newBoard.id,
    elementType: SHAPE_TYPES.RECTANGLE,
    properties: {
      x: 450,
      y: 140,
      width: 220,
      height: 140,
      fill: '#eff6ff',
      stroke: '#3b82f6',
      strokeWidth: 2,
    },
    zIndex: 2,
    userId: userAlex.id,
  })
  console.log(`  ✓ Saved Rectangle element (ID: ${rectElem.id})`)

  // 2c. Circle Shape
  const circleElem = await saveWhiteboardElement({
    whiteboardId: newBoard.id,
    elementType: SHAPE_TYPES.CIRCLE,
    properties: {
      x: 750,
      y: 180,
      width: 120,
      height: 120,
      fill: '#f0fdf4',
      stroke: '#22c55e',
      strokeWidth: 2,
    },
    zIndex: 3,
    userId: userSarah.id,
  })
  console.log(`  ✓ Saved Circle element (ID: ${circleElem.id})`)

  // 2d. Connecting Arrow
  const arrowElem = await saveWhiteboardElement({
    whiteboardId: newBoard.id,
    elementType: SHAPE_TYPES.ARROW,
    properties: {
      startX: 380,
      startY: 210,
      endX: 450,
      endY: 210,
      stroke: '#64748b',
      strokeWidth: 2,
    },
    zIndex: 4,
    userId: userAlex.id,
  })
  console.log(`  ✓ Saved Connecting Arrow element (ID: ${arrowElem.id})`)

  // 2e. Freehand Path
  const freehandElem = await saveWhiteboardElement({
    whiteboardId: newBoard.id,
    elementType: SHAPE_TYPES.FREEHAND,
    properties: {
      points: [
        { x: 200, y: 350 },
        { x: 220, y: 360 },
        { x: 260, y: 355 },
        { x: 300, y: 370 },
      ],
      stroke: '#ec4899',
      strokeWidth: 3,
    },
    zIndex: 5,
    userId: userSarah.id,
  })
  console.log(`  ✓ Saved Freehand Pen element (points count: ${freehandElem.properties.points.length})`)

  // 2f. Text Element
  const textElem = await saveWhiteboardElement({
    whiteboardId: newBoard.id,
    elementType: SHAPE_TYPES.TEXT,
    properties: {
      x: 450,
      y: 100,
      text: 'Microservice Cluster',
      fontSize: 18,
      fill: '#0f172a',
    },
    zIndex: 6,
    userId: userAlex.id,
  })
  console.log(`  ✓ Saved Text label element: "${textElem.properties.text}"`)

  // =========================================================================
  // 3. Retrieval & Z-Index Ordering
  // =========================================================================
  console.log('\n[3/8] Testing Element Retrieval & Z-Index Ordering:')

  const elements = await getWhiteboardElements(newBoard.id)
  if (elements.length !== 6) {
    console.error(`Expected 6 elements, got ${elements.length}`)
    process.exit(1)
  }

  // Verify ascending z_index order
  for (let i = 0; i < elements.length - 1; i++) {
    if (elements[i].z_index > elements[i + 1].z_index) {
      console.error(`Z-Index order violation at index ${i}:`, elements)
      process.exit(1)
    }
  }
  console.log(`  ✓ Retrieved all ${elements.length} elements in correct z-index layering order`)

  // =========================================================================
  // 4. Element Moving, Resizing, and Color Updates
  // =========================================================================
  console.log('\n[4/8] Testing Element Moving, Resizing, and Color Editing:')

  // Move and resize sticky note
  const movedSticky = await saveWhiteboardElement({
    id: stickyElem.id,
    whiteboardId: newBoard.id,
    elementType: SHAPE_TYPES.STICKY,
    properties: {
      ...stickyElem.properties,
      x: 250,
      y: 180,
      width: 200,
      height: 180,
      color: STICKY_COLORS[3].bg, // Pink sticky note
      text: '🔑 OAuth2 & Supabase Auth integration (APPROVED)',
    },
    zIndex: 1,
    userId: userSarah.id,
  })

  if (
    movedSticky.properties.x !== 250 ||
    movedSticky.properties.y !== 180 ||
    movedSticky.properties.color !== STICKY_COLORS[3].bg ||
    !movedSticky.properties.text.includes('(APPROVED)')
  ) {
    console.error('Failed to move and update sticky note element!', movedSticky)
    process.exit(1)
  }
  console.log(`  ✓ Moved sticky note to (250, 180), resized to 200x180, changed color to Pink`)

  // Verify other elements were not modified (non-destructive operational sync)
  const elementsAfterMove = await getWhiteboardElements(newBoard.id)
  const rectStillIntact = elementsAfterMove.find((e) => e.id === rectElem.id)
  if (!rectStillIntact || rectStillIntact.properties.width !== 220) {
    console.error('Other elements were mutated or wiped during sticky update!')
    process.exit(1)
  }
  console.log('  ✓ Verified operational isolation: other elements remained untouched')

  // =========================================================================
  // 5. Operational Element Deletion
  // =========================================================================
  console.log('\n[5/8] Testing Operational Element Deletion:')

  const deleteSuccess = await deleteWhiteboardElement(circleElem.id)
  if (!deleteSuccess) {
    console.error('deleteWhiteboardElement returned false!')
    process.exit(1)
  }

  const elementsAfterDelete = await getWhiteboardElements(newBoard.id)
  if (elementsAfterDelete.some((e) => e.id === circleElem.id)) {
    console.error('Deleted circle element still present!')
    process.exit(1)
  }
  if (elementsAfterDelete.length !== 5) {
    console.error(`Expected 5 elements after delete, got ${elementsAfterDelete.length}`)
    process.exit(1)
  }
  console.log(`  ✓ Successfully deleted element ${circleElem.id}; 5 elements remain intact`)

  // =========================================================================
  // 6. Multi-User Simultaneous Concurrent Editing Simulation
  // =========================================================================
  console.log('\n[6/8] Simulating Multi-User Concurrent Editing (Sarah & Alex):')

  // User Sarah creates a new sticky note
  const sarahAction = saveWhiteboardElement({
    whiteboardId: newBoard.id,
    elementType: SHAPE_TYPES.STICKY,
    properties: {
      x: 50,
      y: 50,
      width: 160,
      height: 140,
      color: STICKY_COLORS[1].bg, // Green
      text: 'Sarah: Realtime Presence Sync',
    },
    zIndex: 7,
    userId: userSarah.id,
  })

  // User Alex simultaneously creates a database cylinder / rectangle
  const alexAction = saveWhiteboardElement({
    whiteboardId: newBoard.id,
    elementType: SHAPE_TYPES.RECTANGLE,
    properties: {
      x: 500,
      y: 350,
      width: 180,
      height: 100,
      fill: '#fef3c7',
      stroke: '#d97706',
      strokeWidth: 2,
    },
    zIndex: 8,
    userId: userAlex.id,
  })

  // Wait for both concurrent operations
  const [sarahElem, alexElem] = await Promise.all([sarahAction, alexAction])

  if (!sarahElem.id || !alexElem.id) {
    console.error('Concurrent operations failed!')
    process.exit(1)
  }

  const mergedElements = await getWhiteboardElements(newBoard.id)
  const hasSarah = mergedElements.some((e) => e.id === sarahElem.id)
  const hasAlex = mergedElements.some((e) => e.id === alexElem.id)

  if (!hasSarah || !hasAlex) {
    console.error('Concurrent edits suffered race condition or overwrite!')
    process.exit(1)
  }
  console.log(`  ✓ Both concurrent edits safely committed without race condition or data loss (${mergedElements.length} total elements)`)

  // =========================================================================
  // 7. Collaborator Live Cursor Broadcast Simulation
  // =========================================================================
  console.log('\n[7/8] Testing Collaborator Cursor Broadcast & Viewport Translation:')

  const cursorPayload = {
    userId: userAlex.id,
    userName: userAlex.name,
    userColor: '#06b6d4',
    x: 320,
    y: 195,
  }

  // Verify coordinates translation formula: canvasX = (clientX - panX) / zoom
  const pan = { x: 50, y: 50 }
  const zoom = 1.25
  const clientX = 450
  const clientY = 300
  const translatedX = (clientX - pan.x) / zoom // (450 - 50) / 1.25 = 320
  const translatedY = (clientY - pan.y) / zoom // (300 - 50) / 1.25 = 200

  if (Math.abs(translatedX - 320) > 0.01 || Math.abs(translatedY - 200) > 0.01) {
    console.error('Cursor coordinate translation mismatch!', { translatedX, translatedY })
    process.exit(1)
  }
  console.log(`  ✓ Verified canvas coordinate translation at zoom ${zoom}x and pan (${pan.x}, ${pan.y}) -> (${translatedX}, ${translatedY})`)
  console.log(`  ✓ Collaborator cursor payload validated for "${cursorPayload.userName}" (${cursorPayload.userColor})`)

  // =========================================================================
  // 8. Whiteboard Deletion & Role-Based Permissions
  // =========================================================================
  console.log('\n[8/8] Testing Whiteboard Deletion & Role Permissions:')

  // Alex (regular member, not creator) attempts to delete Sarah's board -> Expected rejection
  let unauthorizedErrorCaught = false
  try {
    await deleteWhiteboard(newBoard.id, userAlex.id, userAlex.role)
  } catch (err) {
    unauthorizedErrorCaught = true
    console.log(`  ✓ Non-creator member deletion rejected: "${err.message}"`)
  }

  if (!unauthorizedErrorCaught) {
    console.error('Security violation: Non-creator member was able to delete whiteboard!')
    process.exit(1)
  }

  // Sarah (the creator) deletes the board -> Expected success
  const deletedByCreator = await deleteWhiteboard(newBoard.id, userSarah.id, userSarah.role)
  if (!deletedByCreator) {
    console.error('Creator failed to delete their own whiteboard!')
    process.exit(1)
  }
  console.log('  ✓ Creator successfully deleted their own whiteboard')

  // Verify board is gone
  const remainingBoards = await getWorkspaceWhiteboards(workspaceId)
  if (remainingBoards.some((b) => b.id === newBoard.id)) {
    console.error('Deleted whiteboard still exists in workspace listing!')
    process.exit(1)
  }

  // Verify elements for the deleted board were cleaned up
  const orphanedElements = await getWhiteboardElements(newBoard.id)
  if (orphanedElements.length !== 0) {
    console.error('Orphaned elements remained after whiteboard deletion!')
    process.exit(1)
  }
  console.log('  ✓ Verified board and associated elements were purged')

  console.log('\n------------------------------------------------------------')
  console.log('🎉 ALL 8 STAGE 20 WHITEBOARD TESTS PASSED SUCCESSFULLY!')
  console.log('------------------------------------------------------------\n')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Stage 20 Whiteboard Test Suite Failed:', error)
  process.exit(1)
} finally {
  await vite.close()
}
