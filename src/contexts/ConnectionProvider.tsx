import { type ReactNode, useEffect, useRef, useState } from 'react'
import { ConnectionContext } from './connection'
import type { ConnectionState } from './connection'
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from '../lib/supabase'

type Status = ConnectionState['supabase']

async function checkSupabaseHealth(): Promise<Status> {
  if (!isSupabaseConfigured) {
    return 'unconfigured'
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
    })
    if (res.ok) return 'online'
  } catch {
    // Network error or blocked request
  }

  return 'offline'
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [supabaseStatus, setSupabaseStatus] = useState<Status>(() =>
    !isSupabaseConfigured ? 'unconfigured' : 'offline'
  )
  const [networkStatus, setNetworkStatus] = useState<Status>(
    typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline'
  )
  const checkRef = useRef<(() => Promise<void>) | null>(null)

  const runCheck = async () => {
    const status = await checkSupabaseHealth()
    setSupabaseStatus(status)
  }

  useEffect(() => {
    checkRef.current = runCheck
    setTimeout(() => runCheck(), 0)
    const interval = setInterval(runCheck, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online')
      setTimeout(() => checkRef.current?.(), 0)
    }
    const handleOffline = () => {
      setNetworkStatus('offline')
      setSupabaseStatus('offline')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const value: ConnectionState = { supabase: supabaseStatus, network: networkStatus }

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
}
