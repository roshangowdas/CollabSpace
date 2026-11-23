import { supabase, isSupabaseConfigured } from '@/integrations/supabase'

/**
 * Pre-defined availability statuses per CollabSpace design system.
 */
export const AVAILABILITY_STATUSES = {
  ONLINE: {
    id: 'online',
    label: 'Available',
    description: 'Active and available to collaborate',
    color: 'emerald',
    badgeClass: 'bg-emerald-500',
    ringClass: 'ring-emerald-500/30',
    textClass: 'text-emerald-500 dark:text-emerald-400',
  },
  BUSY: {
    id: 'busy',
    label: 'Do Not Disturb',
    description: 'Focusing, notifications silenced',
    color: 'rose',
    badgeClass: 'bg-rose-500',
    ringClass: 'ring-rose-500/30',
    textClass: 'text-rose-500 dark:text-rose-400',
  },
  AWAY: {
    id: 'away',
    label: 'Away',
    description: 'Stepped away or inactive',
    color: 'amber',
    badgeClass: 'bg-amber-500',
    ringClass: 'ring-amber-500/30',
    textClass: 'text-amber-500 dark:text-amber-400',
  },
  OFFLINE: {
    id: 'offline',
    label: 'Offline',
    description: 'Not currently connected',
    color: 'slate',
    badgeClass: 'bg-muted-foreground/40',
    ringClass: 'ring-muted-foreground/20',
    textClass: 'text-muted-foreground',
  },
}

/**
 * Simulated initial presence for preview/offline mode.
 * Clearly segregated from real Supabase presence per AGENTS.md rules.
 */
export const DEMO_ONLINE_PRESENCE = {
  'demo-user-sarah': {
    user_id: 'demo-user-sarah',
    username: 'sarah_j',
    full_name: 'Sarah Jenkins',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    availability: 'busy',
    status_text: 'Reviewing PR #42',
    current_room: 'demo-proj-apollo',
    online_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  'demo-user-david': {
    user_id: 'demo-user-david',
    username: 'david_c',
    full_name: 'David Chen',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
    availability: 'away',
    status_text: 'Coffee break ☕',
    current_room: null,
    online_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
}

/**
 * Extracts and normalizes presence items from Supabase Realtime channel presence state.
 *
 * @param {Record<string, Array<object>>} presenceState
 * @returns {Record<string, object>} Normalized map keyed by user_id
 */
export function normalizePresenceState(presenceState = {}) {
  const normalized = {}

  Object.entries(presenceState).forEach(([key, presences]) => {
    if (Array.isArray(presences) && presences.length > 0) {
      // Latest presence entry for this user
      const latest = presences[presences.length - 1]
      const userId = latest.user_id || key
      normalized[userId] = {
        user_id: userId,
        username: latest.username || 'user',
        full_name: latest.full_name || 'Team Member',
        avatar_url: latest.avatar_url || '',
        availability: latest.availability || 'online',
        status_text: latest.status_text || '',
        current_room: latest.current_room || null,
        online_at: latest.online_at || new Date().toISOString(),
      }
    }
  })

  return normalized
}

/**
 * Creates and tracks presence on a Supabase Realtime channel.
 * Uses authenticated user ID as the unique presence key.
 *
 * @param {object} options
 * @param {string} options.channelName
 * @param {string} options.userId
 * @param {object} options.presenceData
 * @param {(state: Record<string, object>) => void} options.onSync
 * @param {(joined: object) => void} [options.onJoin]
 * @param {(left: object) => void} [options.onLeave]
 * @returns {{ channel: any, track: (data: object) => Promise<any>, untrack: () => Promise<any>, unsubscribe: () => void }}
 */
export function initPresenceChannel({
  channelName,
  userId,
  presenceData,
  onSync,
  onJoin,
  onLeave,
}) {
  if (!isSupabaseConfigured || channelName.includes('demo') || userId?.startsWith('test-') || userId?.startsWith('demo-')) {
    // Offline / Mock mode fallback
    const simulatedState = {
      ...DEMO_ONLINE_PRESENCE,
      [userId]: {
        user_id: userId,
        username: presenceData.username || 'alex_rivera',
        full_name: presenceData.full_name || 'Alex Rivera (You)',
        avatar_url: presenceData.avatar_url || '',
        availability: presenceData.availability || 'online',
        status_text: presenceData.status_text || 'Active in CollabSpace',
        current_room: presenceData.current_room || null,
        online_at: new Date().toISOString(),
      },
    }

    if (onSync) onSync(simulatedState)

    return {
      channel: null,
      track: async (newData) => {
        simulatedState[userId] = { ...simulatedState[userId], ...newData }
        if (onSync) onSync({ ...simulatedState })
      },
      untrack: async () => {
        delete simulatedState[userId]
        if (onSync) onSync({ ...simulatedState })
      },
      unsubscribe: () => {},
    }
  }

  // Real Supabase Realtime Presence Channel
  const channel = supabase.channel(channelName, {
    config: {
      presence: {
        key: userId, // Authenticated user ID as presence identifier
      },
    },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const rawState = channel.presenceState()
      const normalized = normalizePresenceState(rawState)
      if (onSync) onSync(normalized)
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (onJoin && newPresences && newPresences[0]) {
        onJoin({ key, presence: newPresences[0] })
      }
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (onLeave && leftPresences && leftPresences[0]) {
        onLeave({ key, presence: leftPresences[0] })
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...presenceData,
          })
        } catch (trackErr) {
          console.warn('Realtime presence initial track warning:', trackErr)
        }
      }
    })

  const track = async (newPresenceData) => {
    try {
      await channel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
        ...presenceData,
        ...newPresenceData,
      })
    } catch (err) {
      console.warn('Realtime presence track update warning:', err)
    }
  }

  const untrack = async () => {
    try {
      await channel.untrack()
    } catch (err) {
      console.warn('Realtime presence untrack warning:', err)
    }
  }

  const unsubscribe = () => {
    try {
      channel.untrack()
      supabase.removeChannel(channel)
    } catch (err) {
      console.warn('Realtime presence unsubscribe warning:', err)
    }
  }

  return { channel, track, untrack, unsubscribe }
}

/**
 * Formats a readable string describing which users are typing.
 *
 * @param {Array<{ user_id: string, full_name: string, username: string }>} typingUsers
 * @returns {string} E.g. "Sarah is typing...", "Sarah and David are typing..."
 */
export function formatTypingLabel(typingUsers = []) {
  if (!typingUsers || typingUsers.length === 0) return ''

  const names = typingUsers.map((u) => u.full_name?.split(' ')[0] || u.username || 'Someone')

  if (names.length === 1) {
    return `${names[0]} is typing...`
  }
  if (names.length === 2) {
    return `${names[0]} and ${names[1]} are typing...`
  }
  if (names.length === 3) {
    return `${names[0]}, ${names[1]} and ${names[2]} are typing...`
  }
  return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`
}
