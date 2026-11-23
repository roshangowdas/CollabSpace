import { useState, useEffect } from 'react'
import { isSupabaseConfigured, checkSupabaseConnection } from '@/services/supabase'

export function useSupabaseStatus() {
  const [status, setStatus] = useState({
    isConfigured: isSupabaseConfigured,
    isConnected: false,
    checking: isSupabaseConfigured,
    message: isSupabaseConfigured ? 'Checking connection...' : 'Awaiting Supabase credentials in .env',
  })

  useEffect(() => {
    let isMounted = true

    if (!isSupabaseConfigured) {
      return
    }

    checkSupabaseConnection().then((res) => {
      if (isMounted) {
        setStatus({
          isConfigured: true,
          isConnected: res.ok,
          checking: false,
          message: res.message,
        })
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return status
}

