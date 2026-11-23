// ==============================================================================
// CollabSpace Test Suite: Stage 19 - Collaborative Document Editor
// File: scripts/test_collaborative_documents.js
// Description:
//   Validates Tiptap/Yjs CRDT synchronization, Hocuspocus WebSocket server,
//   Supabase identity authentication, document authorization, simultaneous
//   multi-user concurrent editing, awareness, persistence, and reconnection.
// ==============================================================================

import WebSocket from 'ws'
// Polyfill WebSocket for Node.js test environment
globalThis.WebSocket = WebSocket

import * as Y from 'yjs'
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { createServer } from 'vite'
import { createHocuspocusServer } from '../server/hocuspocus.js'
import { verifySupabaseToken, checkDocumentAccess } from '../server/auth.js'
import { loadDocumentState, storeDocumentState, resetMemoryStore } from '../server/persistence.js'

console.log('--- CollabSpace Stage 19: Collaborative Document Editor Test Suite ---')

const vite = await createServer()
const TEST_PORT = 1238 // Ephemeral port for test server
let hocuspocusServer = null

try {
  const {
    createDocument,
    getDocumentById,
    updateDocument,
    deleteDocument,
    getWorkspaceDocuments,
    resetDemoDocuments,
  } = await vite.ssrLoadModule('/src/services/documents.js')

  resetDemoDocuments()
  resetMemoryStore()

  const workspaceId = 'demo-workspace-uuid'
  const userSarah = { id: 'demo-user-sarah', name: 'Sarah Connor', token: 'demo-token-sarah' }
  const userAlex = { id: 'demo-user-alex', name: 'Alex Rivera', token: 'demo-token-alex' }

  // =========================================================================
  // 1. Document Creation & Workspace Scoping
  // =========================================================================
  console.log('\n[1/8] Testing Document Creation & Metadata Scoping:')

  const docPayload = {
    workspaceId,
    projectId: 'demo-project-alpha',
    title: 'Collaborative Architecture RFC',
    contentText: 'Architecture RFC content...',
    userId: userSarah.id,
  }

  const createdDoc = await createDocument(docPayload)
  if (!createdDoc || !createdDoc.id || createdDoc.title !== docPayload.title) {
    console.error('Failed to create document:', createdDoc)
    process.exit(1)
  }
  console.log(`  ✓ Document created successfully: "${createdDoc.title}" (ID: ${createdDoc.id})`)

  // Verify retrieval and filtering
  const allDocs = await getWorkspaceDocuments(workspaceId)
  const found = allDocs.find((d) => d.id === createdDoc.id)
  if (!found) {
    console.error('Created document not found in workspace listing!')
    process.exit(1)
  }
  console.log(`  ✓ Document listed in workspace catalog (${allDocs.length} total documents)`)

  // Test title update
  const updatedDoc = await updateDocument(createdDoc.id, { title: 'Collaborative Architecture RFC v2' })
  if (updatedDoc.title !== 'Collaborative Architecture RFC v2') {
    console.error('Failed to update document title!')
    process.exit(1)
  }
  console.log(`  ✓ Document title updated: "${updatedDoc.title}"`)

  // =========================================================================
  // 2. Identity Verification & WebSocket Connection Authorization
  // =========================================================================
  console.log('\n[2/8] Testing Supabase Identity Authentication & Document Access:')

  // Authenticate Sarah
  const authSarah = await verifySupabaseToken(userSarah.token)
  if (!authSarah || authSarah.id !== userSarah.id) {
    console.error('Failed to authenticate valid user token:', authSarah)
    process.exit(1)
  }
  console.log(`  ✓ Authenticated user "${authSarah.name}" with cursor color: ${authSarah.color}`)

  // Authenticate Alex
  const authAlex = await verifySupabaseToken(userAlex.token)
  if (!authAlex || authAlex.id !== userAlex.id) {
    console.error('Failed to authenticate second user token:', authAlex)
    process.exit(1)
  }
  console.log(`  ✓ Authenticated second user "${authAlex.name}" with cursor color: ${authAlex.color}`)

  // Empty / invalid token rejection
  const invalidAuth = await verifySupabaseToken('')
  if (invalidAuth !== null) {
    console.error('Empty token was not rejected!')
    process.exit(1)
  }
  console.log(`  ✓ Empty authentication token correctly rejected.`)

  // Check document access authorization
  const canAccess = await checkDocumentAccess(createdDoc.id, userSarah.id)
  if (!canAccess) {
    console.error('Legitimate user denied access to document!')
    process.exit(1)
  }
  console.log(`  ✓ Workspace member authorized for document access.`)

  // =========================================================================
  // 3. Boot Hocuspocus WebSocket Collaboration Server
  // =========================================================================
  console.log('\n[3/8] Starting Hocuspocus WebSocket Collaboration Server:')

  hocuspocusServer = createHocuspocusServer({ port: TEST_PORT })
  await hocuspocusServer.listen()
  console.log(`  ✓ Hocuspocus server listening on ws://127.0.0.1:${TEST_PORT}`)

  // =========================================================================
  // 4. Multi-User WebSocket Connection & Awareness (Two Separate Authenticated Users)
  // =========================================================================
  console.log('\n[4/8] Connecting Two Separate Authenticated Collaborators via WebSockets:')

  const ydoc1 = new Y.Doc()
  const ydoc2 = new Y.Doc()

  let user1Connected = false
  let user2Connected = false

  const socket1 = new HocuspocusProviderWebsocket({
    url: `ws://127.0.0.1:${TEST_PORT}`,
    WebSocketPolyfill: WebSocket,
  })
  const provider1 = new HocuspocusProvider({
    websocketProvider: socket1,
    name: createdDoc.id,
    document: ydoc1,
    token: userSarah.token,
    user: {
      id: userSarah.id,
      name: userSarah.name,
      color: authSarah.color,
    },
    onSynced: () => {
      user1Connected = true
    },
  })

  const socket2 = new HocuspocusProviderWebsocket({
    url: `ws://127.0.0.1:${TEST_PORT}`,
    WebSocketPolyfill: WebSocket,
  })
  const provider2 = new HocuspocusProvider({
    websocketProvider: socket2,
    name: createdDoc.id,
    document: ydoc2,
    token: userAlex.token,
    user: {
      id: userAlex.id,
      name: userAlex.name,
      color: authAlex.color,
    },
    onSynced: () => {
      user2Connected = true
    },
  })

  // Wait for connections to establish
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timeout waiting for WebSocket peers')), 5000)
    const check = () => {
      if (user1Connected && user2Connected) {
        clearTimeout(timeout)
        resolve()
      } else {
        setTimeout(check, 50)
      }
    }
    check()
  })

  console.log(`  ✓ Collaborator 1 ("${userSarah.name}") connected to Hocuspocus`)
  console.log(`  ✓ Collaborator 2 ("${userAlex.name}") connected to Hocuspocus`)

  // =========================================================================
  // 5. Concurrent Edits & True CRDT Conflict-Free Convergence
  // =========================================================================
  console.log('\n[5/8] Testing Concurrent Edits & Automatic Yjs CRDT Synchronization:')

  // Both users edit shared text concurrently
  const text1 = ydoc1.getText('content')
  const text2 = ydoc2.getText('content')

  // User 1 types initial heading
  text1.insert(0, 'System Architecture Overview. ')

  // Wait for sync to propagate to User 2
  await new Promise((resolve) => setTimeout(resolve, 300))

  if (text2.toString() !== text1.toString()) {
    console.error(`Sync mismatch! User 1: "${text1.toString()}", User 2: "${text2.toString()}"`)
    process.exit(1)
  }
  console.log(`  ✓ Real-time keystroke synced from User 1 to User 2: "${text2.toString()}"`)

  // Concurrent edit: User 1 appends text while User 2 prepends text simultaneously
  text1.insert(text1.length, 'Database uses PostgreSQL. ')
  text2.insert(0, '[DRAFT RFC] ')

  // Wait for bidirectional CRDT sync and convergence
  await new Promise((resolve) => setTimeout(resolve, 500))

  const final1 = text1.toString()
  const final2 = text2.toString()

  if (final1 !== final2 || !final1.includes('[DRAFT RFC]') || !final1.includes('PostgreSQL')) {
    console.error(`CRDT convergence failure! Peer 1: "${final1}", Peer 2: "${final2}"`)
    process.exit(1)
  }

  console.log(`  ✓ Concurrent edits merged conflict-free on both peers!`)
  console.log(`  ✓ Converged document text: "${final1}"`)

  // =========================================================================
  // 6. Collaborator Awareness & Live Presence
  // =========================================================================
  console.log('\n[6/8] Testing Collaborator Presence & Cursor Awareness:')

  // Broadcast awareness user payloads
  provider1.setAwarenessField('user', {
    id: userSarah.id,
    name: userSarah.name,
    color: authSarah.color,
  })
  provider2.setAwarenessField('user', {
    id: userAlex.id,
    name: userAlex.name,
    color: authAlex.color,
  })

  // Allow awareness messages to exchange over WebSocket
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Verify awareness states received
  const states1 = provider1.awareness.getStates()
  const states2 = provider2.awareness.getStates()

  const peerNames1 = Array.from(states1.values()).map((s) => s.user?.name).filter(Boolean)
  const peerNames2 = Array.from(states2.values()).map((s) => s.user?.name).filter(Boolean)

  console.log(`  ✓ Provider 1 sees active peers: [${peerNames1.join(', ')}]`)
  console.log(`  ✓ Provider 2 sees active peers: [${peerNames2.join(', ')}]`)

  if (!peerNames1.includes(userAlex.name) || !peerNames2.includes(userSarah.name)) {
    console.error('Awareness synchronization did not exchange peer names!')
    process.exit(1)
  }
  console.log(`  ✓ Peer cursors and presence synchronized across both sessions.`)

  // =========================================================================
  // 7. Yjs State Persistence & Recovery in Supabase
  // =========================================================================
  console.log('\n[7/8] Testing Document CRDT State Persistence & Cold Reload:')

  // Encode state as update
  const binaryUpdate = Y.encodeStateAsUpdate(ydoc1)
  const base64Update = Buffer.from(binaryUpdate).toString('base64')

  const stored = await storeDocumentState(createdDoc.id, base64Update, userSarah.id)
  if (!stored) {
    console.error('Failed to store document CRDT update!')
    process.exit(1)
  }
  console.log(`  ✓ Stored base64 Yjs CRDT state in Supabase (${base64Update.length} chars)`)

  // Load state into a completely brand-new, empty Y.Doc to simulate cold start
  const loadedBase64 = await loadDocumentState(createdDoc.id)
  if (!loadedBase64) {
    console.error('Failed to retrieve persisted document state!')
    process.exit(1)
  }

  const freshYdoc = new Y.Doc()
  Y.applyUpdate(freshYdoc, Buffer.from(loadedBase64, 'base64'))

  const freshText = freshYdoc.getText('content').toString()
  if (freshText !== final1) {
    console.error(`State recovery mismatch! Expected "${final1}", got "${freshText}"`)
    process.exit(1)
  }
  console.log(`  ✓ Successfully reconstructed exact document state on cold start: "${freshText}"`)

  // =========================================================================
  // 8. Reconnection Resilience & Role-Based Deletion
  // =========================================================================
  console.log('\n[8/8] Testing Reconnection Resilience & Role-Based Deletion:')

  // Simulate network interruption on Provider 2
  socket2.webSocket.close()
  console.log(`  ✓ Provider 2 simulated network disconnect.`)

  // User 1 makes an edit while peer is temporarily disconnected
  text1.insert(text1.length, 'Reviewed by Sarah. ')

  // Allow Hocuspocus auto-reconnect and state reconciliation
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const reconnectedText2 = text2.toString()
  if (!reconnectedText2.includes('Reviewed by Sarah')) {
    console.error(`Reconnected peer did not receive offline updates! Got: "${reconnectedText2}"`)
    process.exit(1)
  }
  console.log(`  ✓ Reconnected peer automatically caught up with offline edits!`)

  // Role-based deletion test
  let unauthorizedDeleteBlocked = false
  try {
    // Alex (non-creator, Member) attempts to delete Sarah's doc
    await deleteDocument(createdDoc.id, userAlex.id, 'Member')
  } catch (err) {
    unauthorizedDeleteBlocked = true
    console.log(`  ✓ Non-creator member blocked from deleting document: "${err.message}"`)
  }

  if (!unauthorizedDeleteBlocked) {
    console.error('Security issue: Non-creator member was permitted to delete document!')
    process.exit(1)
  }

  // Sarah (creator) deletes document
  const deleted = await deleteDocument(createdDoc.id, userSarah.id, 'Member')
  if (!deleted) {
    console.error('Creator failed to delete own document!')
    process.exit(1)
  }
  console.log(`  ✓ Document creator successfully deleted document.`)

  // Clean up providers & server
  provider1.destroy()
  provider2.destroy()
  socket1.destroy()
  socket2.destroy()
  ydoc1.destroy()
  ydoc2.destroy()
  freshYdoc.destroy()
  await hocuspocusServer.destroy()
  await vite.close()

  console.log('\n=============================================================')
  console.log('✓✓✓ ALL 8/8 STAGE 19 COLLABORATIVE EDITOR TESTS PASSED! ✓✓✓')
  console.log('=============================================================')

  process.exit(0)
} catch (err) {
  console.error('\n❌ Stage 19 Test Suite Error:', err)
  if (hocuspocusServer) {
    await hocuspocusServer.destroy().catch(() => {})
  }
  if (vite) {
    await vite.close().catch(() => {})
  }
  process.exit(1)
}
