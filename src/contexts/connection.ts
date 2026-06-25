import { createContext } from 'react'

export type Status = 'online' | 'offline' | 'unconfigured'

export interface ConnectionState {
  supabase: Status
  network: Status
}

export const ConnectionContext = createContext<ConnectionState>({
  supabase: 'unconfigured',
  network: 'offline',
})
