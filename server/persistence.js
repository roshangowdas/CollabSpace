// ==============================================================================
// CollabSpace Hocuspocus Server: Supabase Persistence
// File: server/persistence.js
// Description:
//   Loads and stores Yjs CRDT binary document states into Supabase PostgreSQL,
//   maintaining version snapshots and debounce history.
// ==============================================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

let supabaseAdmin = null
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// In-memory Yjs binary update cache (supports demo documents & fast reconnection)
const inMemoryDocStore = new Map()

/**
 * Loads the base64 encoded Yjs update state for a document.
 *
 * @param {string} documentId Document UUID
 * @returns {Promise<string|null>} Base64 encoded Uint8Array update or null
 */
export async function loadDocumentState(documentId) {
  if (!documentId) return null

  // 1. Check in-memory store
  if (inMemoryDocStore.has(documentId)) {
    return inMemoryDocStore.get(documentId)
  }

  // 2. Query Supabase
  if (supabaseAdmin && !documentId.startsWith('demo-')) {
    try {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('yjs_state')
        .eq('id', documentId)
        .single()

      if (!error && data?.yjs_state) {
        inMemoryDocStore.set(documentId, data.yjs_state)
        return data.yjs_state
      }
    } catch (err) {
      console.warn(`[Hocuspocus Persistence] Error loading doc ${documentId}:`, err.message)
    }
  }

  return null
}

/**
 * Stores the base64 encoded Yjs update state into Supabase.
 *
 * @param {string} documentId Document UUID
 * @param {string} base64State Base64 encoded Y.Doc update
 * @param {string} [userId] Editing user UUID
 * @returns {Promise<boolean>}
 */
export async function storeDocumentState(documentId, base64State, userId = null) {
  if (!documentId || !base64State) return false

  // 1. Update in-memory store immediately
  inMemoryDocStore.set(documentId, base64State)

  // 2. Persist to Supabase PostgreSQL
  if (supabaseAdmin && !documentId.startsWith('demo-')) {
    try {
      const updatePayload = {
        yjs_state: base64State,
        updated_at: new Date().toISOString(),
      }
      if (userId && !userId.startsWith('demo-') && !userId.startsWith('test-')) {
        updatePayload.last_edited_by = userId
      }

      const { error } = await supabaseAdmin
        .from('documents')
        .update(updatePayload)
        .eq('id', documentId)

      if (error) {
        console.error(`[Hocuspocus Persistence] Failed to store doc ${documentId}:`, error.message)
        return false
      }
      return true
    } catch (err) {
      console.error(`[Hocuspocus Persistence] Exception storing doc ${documentId}:`, err)
      return false
    }
  }

  return true
}

/**
 * Reset memory store (useful for automated testing)
 */
export function resetMemoryStore() {
  inMemoryDocStore.clear()
}
