/**
 * Supabase Realtime Service for CollabSpace.
 * Provides WebSocket abstractions for real-time table sync, channel broadcasts, and presence tracking.
 */
import { supabase } from './client'

/**
 * Subscribes to PostgreSQL database changes on a table with Row Level Security.
 * @param {Object} options
 * @param {string} options.table Table name (e.g. 'profiles', 'tasks', 'messages')
 * @param {'INSERT'|'UPDATE'|'DELETE'|'*'} [options.event='*'] Database event
 * @param {string} [options.schema='public'] Database schema
 * @param {string} [options.filter] Filter string, e.g. 'workspace_id=eq.123'
 * @param {(payload: any) => void} options.onData Callback fired with new/updated payload
 * @returns {import('@supabase/supabase-js').RealtimeChannel} Channel object (call .unsubscribe() on cleanup)
 */
export function subscribeToTableChanges({
  table,
  event = '*',
  schema = 'public',
  filter,
  onData,
}) {
  const channelName = `db-changes-${table}-${event}-${filter || 'all'}-${Date.now()}`

  const channelConfig = {
    event,
    schema,
    table,
    ...(filter ? { filter } : {}),
  }

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', channelConfig, (payload) => {
      if (onData) onData(payload)
    })
    .subscribe((status, error) => {
      if (error) {
        console.warn(`[CollabSpace Realtime] Subscription error on ${table}:`, error)
      }
    })

  return channel
}

/**
 * Creates a lightweight broadcast channel for fast ephemeral messages (<50ms latency).
 * @param {string} channelName Name of the channel (e.g. 'workspace:general')
 * @param {(event: string, payload: any) => void} onMessage Callback receiving broadcast messages
 * @returns {{ channel: import('@supabase/supabase-js').RealtimeChannel, send: (event: string, payload: any) => Promise<any> }}
 */
export function createBroadcastChannel(channelName, onMessage) {
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
    },
  })

  channel
    .on('broadcast', { event: '*' }, ({ event, payload }) => {
      if (onMessage) onMessage(event, payload)
    })
    .subscribe()

  const send = async (event, payload) => {
    return await channel.send({
      type: 'broadcast',
      event,
      payload,
    })
  }

  return { channel, send }
}

/**
 * Creates a presence channel to track online collaborators and typing indicators.
 * @param {string} channelName
 * @param {Object} initialPresence User presence data (e.g. { userId, name, status })
 * @param {(presenceState: Record<string, any[]>) => void} onSync Callback fired when presence state updates
 * @returns {{ channel: import('@supabase/supabase-js').RealtimeChannel, track: (state: Object) => Promise<any> }}
 */
export function createPresenceChannel(channelName, initialPresence = {}, onSync) {
  const channel = supabase.channel(channelName)

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      if (onSync) onSync(state)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && Object.keys(initialPresence).length > 0) {
        await channel.track(initialPresence)
      }
    })

  const track = async (newPresenceState) => {
    return await channel.track(newPresenceState)
  }

  return { channel, track }
}

/**
 * Safely removes and unsubscribes a realtime channel.
 * @param {import('@supabase/supabase-js').RealtimeChannel} channel
 */
export async function removeRealtimeChannel(channel) {
  if (!channel) return
  return await supabase.removeChannel(channel)
}

/**
 * Retrieves the current Realtime WebSocket connection status.
 * @returns {'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'}
 */
export function getRealtimeStatus() {
  const client = supabase.realtime
  if (!client || !client.conn) return 'CLOSED'
  const state = client.conn.readyState
  switch (state) {
    case 0:
      return 'CONNECTING'
    case 1:
      return 'OPEN'
    case 2:
      return 'CLOSING'
    case 3:
    default:
      return 'CLOSED'
  }
}

