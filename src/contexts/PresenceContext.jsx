import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  AVAILABILITY_STATUSES,
  initPresenceChannel,
  DEMO_ONLINE_PRESENCE,
} from '@/services/presence'
import { supabase, isSupabaseConfigured } from '@/integrations/supabase'

const PresenceContext = createContext(null)

const AVAILABILITY_STORAGE_KEY = 'collabspace_user_availability'

export function PresenceProvider({ children }) {
  const { user, profile } = useAuth()
  const { currentWorkspace, members } = useWorkspace()

  const [myAvailability, setMyAvailabilityState] = useState(() => {
    try {
      return localStorage.getItem(AVAILABILITY_STORAGE_KEY) || 'online'
    } catch {
      return 'online'
    }
  })
  const [statusText, setStatusTextState] = useState('')
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [workspacePresence, setWorkspacePresence] = useState({})
  const [typingUsersMap, setTypingUsersMap] = useState({})

  const presenceChannelRef = useRef(null)
  const roomChannelRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const peerTypingTimeoutsRef = useRef({})

  const currentUserId = user?.id

  // Update Availability and persist locally
  const setMyAvailability = useCallback((newStatus) => {
    setMyAvailabilityState(newStatus)
    try {
      localStorage.setItem(AVAILABILITY_STORAGE_KEY, newStatus)
    } catch (err) {
      console.warn('Failed to persist availability:', err)
    }

    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        availability: newStatus,
        status_text: statusText,
        current_room: activeRoomId,
      })
    }
  }, [statusText, activeRoomId])

  // Update custom status text
  const setStatusText = useCallback((text) => {
    setStatusTextState(text)
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        availability: myAvailability,
        status_text: text,
        current_room: activeRoomId,
      })
    }
  }, [myAvailability, activeRoomId])

  // Set active room (e.g. project chat room)
  const setActiveRoom = useCallback((roomId) => {
    setActiveRoomId(roomId)
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        availability: myAvailability,
        status_text: statusText,
        current_room: roomId,
      })
    }
  }, [myAvailability, statusText])

  // 1. Workspace Presence Channel lifecycle
  useEffect(() => {
    if (!currentWorkspace?.id || !currentUserId) {
      setWorkspacePresence({})
      return
    }

    const channelName = `workspace-presence:${currentWorkspace.id}`
    const presenceData = {
      username: profile?.username || user?.user_metadata?.username || 'user',
      full_name: profile?.full_name || user?.user_metadata?.full_name || 'Team Member',
      avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
      availability: myAvailability,
      status_text: statusText,
      current_room: activeRoomId,
    }

    const presenceHandler = initPresenceChannel({
      channelName,
      userId: currentUserId,
      presenceData,
      onSync: (state) => {
        setWorkspacePresence(state || {})
      },
      onJoin: ({ key, presence }) => {
        setWorkspacePresence((prev) => ({
          ...prev,
          [key]: presence,
        }))
      },
      onLeave: ({ key }) => {
        setWorkspacePresence((prev) => {
          const updated = { ...prev }
          delete updated[key]
          return updated
        })
      },
    })

    presenceChannelRef.current = presenceHandler

    return () => {
      presenceHandler.unsubscribe()
      presenceChannelRef.current = null
    }
  }, [currentWorkspace?.id, currentUserId, profile?.username, profile?.full_name, profile?.avatar_url])

  // 2. Active Room Channel for Live Typing Indicators
  useEffect(() => {
    if (!activeRoomId || !isSupabaseConfigured) {
      setTypingUsersMap({})
      return
    }

    const roomChannelName = `project-typing:${activeRoomId}`
    const channel = supabase.channel(roomChannelName)

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const typingUser = payload?.payload
        if (typingUser && typingUser.user_id !== currentUserId) {
          const senderId = typingUser.user_id

          // Clear previous timeout if any
          if (peerTypingTimeoutsRef.current[senderId]) {
            clearTimeout(peerTypingTimeoutsRef.current[senderId])
          }

          if (typingUser.is_typing) {
            setTypingUsersMap((prev) => ({
              ...prev,
              [senderId]: {
                user_id: senderId,
                full_name: typingUser.full_name,
                username: typingUser.username,
                avatar_url: typingUser.avatar_url,
                timestamp: Date.now(),
              },
            }))

            // Auto-clear typing indicator after 2.5s of no updates
            peerTypingTimeoutsRef.current[senderId] = setTimeout(() => {
              setTypingUsersMap((prev) => {
                const next = { ...prev }
                delete next[senderId]
                return next
              })
              delete peerTypingTimeoutsRef.current[senderId]
            }, 2500)
          } else {
            // Explicitly stopped typing
            setTypingUsersMap((prev) => {
              const next = { ...prev }
              delete next[senderId]
              return next
            })
          }
        }
      })
      .subscribe()

    roomChannelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      roomChannelRef.current = null
      Object.values(peerTypingTimeoutsRef.current).forEach(clearTimeout)
      peerTypingTimeoutsRef.current = {}
    }
  }, [activeRoomId, currentUserId])

  // Broadcast typing event
  const sendTyping = useCallback(
    async (isTyping = true) => {
      if (!activeRoomId || !currentUserId) return

      if (roomChannelRef.current && isSupabaseConfigured) {
        try {
          await roomChannelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
              user_id: currentUserId,
              full_name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
              username: profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'user',
              avatar_url: profile?.avatar_url || '',
              is_typing: isTyping,
            },
          })
        } catch (err) {
          console.warn('Typing signal broadcast error:', err)
        }
      }

      // Auto-clear self typing state
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(false)
        }, 2500)
      }
    },
    [activeRoomId, currentUserId, profile?.full_name, profile?.username, profile?.avatar_url]
  )

  // Derived lists
  const onlineUsers = useMemo(() => {
    return Object.values(workspacePresence)
  }, [workspacePresence])

  const activeRoomMembers = useMemo(() => {
    if (!activeRoomId) return []
    return onlineUsers.filter((u) => u.current_room === activeRoomId)
  }, [onlineUsers, activeRoomId])

  const offlineMembers = useMemo(() => {
    if (!members || members.length === 0) return []
    const onlineIds = new Set(Object.keys(workspacePresence))
    return members.filter((m) => !onlineIds.has(m.user_id || m.id))
  }, [members, workspacePresence])

  const typingUsers = useMemo(() => {
    return Object.values(typingUsersMap)
  }, [typingUsersMap])

  // Helper to check any user's presence state
  const getUserPresence = useCallback(
    (userId) => {
      if (!userId) {
        return { isOnline: false, availability: 'offline', status: AVAILABILITY_STATUSES.OFFLINE }
      }
      const found = workspacePresence[userId]
      if (found) {
        const availKey = (found.availability || 'online').toUpperCase()
        const statusConfig = AVAILABILITY_STATUSES[availKey] || AVAILABILITY_STATUSES.ONLINE
        return {
          isOnline: true,
          availability: found.availability || 'online',
          status_text: found.status_text || '',
          current_room: found.current_room || null,
          status: statusConfig,
        }
      }
      return {
        isOnline: false,
        availability: 'offline',
        status_text: '',
        current_room: null,
        status: AVAILABILITY_STATUSES.OFFLINE,
      }
    },
    [workspacePresence]
  )

  const value = {
    myAvailability,
    setMyAvailability,
    statusText,
    setStatusText,
    activeRoomId,
    setActiveRoom,
    sendTyping,
    onlineUsers,
    offlineMembers,
    activeRoomMembers,
    typingUsers,
    getUserPresence,
    workspacePresence,
  }

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

export function usePresence() {
  const context = useContext(PresenceContext)
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider')
  }
  return context
}

