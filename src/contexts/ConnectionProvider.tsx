import { type ReactNode, useEffect, useRef, useState } from 'react'
import { ConnectionContext } from './connection'
import type { ConnectionState } from './connection'
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from '../lib/supabase'

type Status = ConnectionState['supabase']

async function checkSupabaseHealth(): Promise<Status> {
  if (!isSupabaseConfigured) {
    return 'unconfigured'
  }

  // Check the public auth health endpoint with the anon key.
  const anonOk = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
  })
    .then((r) => r.ok)
    .catch(() => false)

  if (anonOk) return 'online'

  // If auth health didn't respond OK, consider Supabase offline.
  try {
    await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
    })
  } catch {
    return 'offline'
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
