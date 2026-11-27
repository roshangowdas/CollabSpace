// ==============================================================================
// CollabSpace Hocuspocus Server: Instance Configuration
// File: server/hocuspocus.js
// Description:
//   Initializes the Hocuspocus Server with WebSocket synchronization,
//   user authentication, CRDT document persistence, and awareness.
// ==============================================================================

import { Server } from '@hocuspocus/server'
import * as Y from 'yjs'
import { verifySupabaseToken, checkDocumentAccess } from './auth.js'
import { loadDocumentState, storeDocumentState } from './persistence.js'

/**
 * Creates and configures the Hocuspocus collaboration server.
 *
 * @param {object} [options]
 * @param {number} [options.port=1234]
 * @returns {Server}
 */
export function createHocuspocusServer(options = {}) {
  const port = options.port || Number(process.env.PORT) || Number(process.env.HOCUSPOCUS_PORT) || 1234

  const server = Server.configure({
    port,
    timeout: 30000,
    debounce: 2000, // Debounce database saves during rapid typing (2 seconds)
    maxDebounce: 10000, // Force save at least once every 10 seconds of active editing

    /**
     * 1. Authenticate WebSocket Connection
     * Verifies the user's Supabase JWT identity token.
     */
    async onAuthenticate(data) {
      const { token } = data

      if (!token) {
        throw new Error('Unauthorized: Authentication token is required.')
      }

      const user = await verifySupabaseToken(token)
      if (!user) {
        throw new Error('Unauthorized: Token could not be verified.')
      }

      return { user }
    },

    /**
     * 2. Authorize & Load Document
     * Checks workspace/project access, then applies saved CRDT updates.
     */
    async onLoadDocument(data) {
      const { documentName, context } = data

      // Verify document access permissions
      if (context?.user) {
        const isAuthorized = await checkDocumentAccess(documentName, context.user.id)
        if (!isAuthorized) {
          throw new Error(`Forbidden: User does not have access to document "${documentName}".`)
        }
      }

      // Load saved Yjs state from Supabase
      const savedState = await loadDocumentState(documentName)
      if (savedState) {
        try {
          const update = Buffer.from(savedState, 'base64')
          Y.applyUpdate(data.document, update)
        } catch (err) {
          console.error(`[Hocuspocus] Failed to apply Yjs update to doc ${documentName}:`, err)
        }
      }

      return data.document
    },

    /**
     * 3. Persist Document Updates
     * Encodes CRDT state update and persists to Supabase.
     */
    async onStoreDocument(data) {
      const { documentName, document, context } = data
      const update = Y.encodeStateAsUpdate(document)
      const base64State = Buffer.from(update).toString('base64')

      await storeDocumentState(documentName, base64State, context?.user?.id)
    },

    /**
     * 4. Connection Lifecycle
     */
    async onConnect(data) {
      console.log(`[Hocuspocus] Client connected to document: ${data.documentName}`)
    },

    async onDisconnect(data) {
      const userName = data.context?.user?.name || 'Anonymous'
      console.log(`[Hocuspocus] Client "${userName}" disconnected from doc: ${data.documentName}`)
    },
  })

  return server
}
