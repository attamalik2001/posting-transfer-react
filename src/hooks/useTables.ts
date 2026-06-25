import { useEffect, useState } from 'react'
import { supabaseUrl, serviceRoleKey, isSupabaseConfigured } from '../lib/supabase'

interface TableInfo {
  table_name: string
}

async function fetchTables(): Promise<TableInfo[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured')
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json',
        Prefer: 'return=representation;nn=on',
      },
    }
  )

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const schema = (await res.json()) as { paths?: Record<string, { get?: unknown }> }
  const paths = schema.paths || {}

  return Object.entries(paths)
    .filter(([path]) => {
      const clean = path.replace(/^\//, '')
      return clean && !['uc', ''].includes(clean)
    })
    .map(([path]) => ({ table_name: path.replace(/^\//, '') }))
    .filter((t, i, arr) => arr.findIndex((x) => x.table_name === t.table_name) === i)
    .sort((a, b) => a.table_name.localeCompare(b.table_name))
}

export function useTables() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tables, setTables] = useState<TableInfo[]>(() => [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const result = await fetchTables()
        if (!cancelled) {
          setTables(result)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load tables')
          setLoading(false)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  return { tables, loading, error }
}
