import { useContext } from 'react'
import { ConnectionContext } from '../contexts/connection'
import type { ConnectionState } from '../contexts/connection'

export function useConnection(): ConnectionState {
  return useContext(ConnectionContext)
}
