// ==============================================================================
// CollabSpace Hocuspocus Server Entry Point
// File: server/index.js
// Description:
//   Starts the standalone Hocuspocus WebSocket synchronization server.
// ==============================================================================

import { createHocuspocusServer } from './hocuspocus.js'

const PORT = Number(process.env.HOCUSPOCUS_PORT) || 1234

const server = createHocuspocusServer({ port: PORT })

server.listen().then(() => {
  console.log('=============================================================')
  console.log(`🚀 CollabSpace Hocuspocus Server running on ws://127.0.0.1:${PORT}`)
  console.log('   - Yjs CRDT Synchronization: Active')
  console.log('   - Supabase Identity Authentication: Active')
  console.log('   - Workspace & Project Authorization: Active')
  console.log('   - Auto-reconnect & Awareness: Active')
  console.log('=============================================================')
}).catch((err) => {
  console.error('[Hocuspocus Server] Failed to start server:', err)
  process.exit(1)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Hocuspocus Server] Shutting down...')
  await server.destroy()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n[Hocuspocus Server] Terminating...')
  await server.destroy()
  process.exit(0)
})
