import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://ydsmhoqalhwexojsbikg.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkc21ob3FhbGh3ZXhvanNiaWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNDMzOTIsImV4cCI6MjA5NjgxOTM5Mn0.Cc_n4g8OwfWDErNtYaxDQmeMYka2rECUDtYiAv-x0zM'

const envSupabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ||
  DEFAULT_SUPABASE_URL
const envSupabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  DEFAULT_SUPABASE_ANON_KEY

export const isRealSupabaseConfigured = Boolean(
  envSupabaseUrl &&
  envSupabaseAnonKey &&
  envSupabaseUrl.startsWith('http')
)

export const supabaseUrl = envSupabaseUrl.replace(/\/$/, '')
export const supabaseAnonKey = envSupabaseAnonKey
export const serviceRoleKey =
  (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined)?.trim() ||
  supabaseAnonKey

export const isSupabaseConfigured = isRealSupabaseConfigured

export async function supabaseFetch(
  input: string,
  init?: RequestInit
): Promise<Response> {
  if (input.startsWith(supabaseUrl)) {
    const relativePath = input.slice(supabaseUrl.length)
    const rawHeaders = new Headers(init?.headers)
    const actualMethod = (init?.method || 'GET').toUpperCase()
    const preferVal = rawHeaders.get('Prefer') || rawHeaders.get('prefer')

    const sep = relativePath.includes('?') ? '&' : '?'
    const extraParams: string[] = []
    if (actualMethod !== 'GET' && actualMethod !== 'HEAD') {
      extraParams.push(`__method=${encodeURIComponent(actualMethod)}`)
    }
    if (preferVal) {
      extraParams.push(`__prefer=${encodeURIComponent(preferVal)}`)
    }

    const proxiedUrl = `/supabase-api${relativePath}${
      extraParams.length > 0 ? `${sep}${extraParams.join('&')}` : ''
    }`

    // Use only simple GET or POST requests with clean headers so Cloud Run's
    // ingress proxy and _aistudio-iframe.js never block PATCH/DELETE or JWT headers.
    const transportMethod =
      actualMethod === 'GET' || actualMethod === 'HEAD' ? actualMethod : 'POST'

    const cleanHeaders: Record<string, string> = {
      Accept: 'application/json',
    }
    if (transportMethod === 'POST') {
      cleanHeaders['Content-Type'] = 'application/json'
    }

    return window.fetch(proxiedUrl, {
      method: transportMethod,
      headers: cleanHeaders,
      body:
        transportMethod === 'POST' && init?.body
          ? init.body
          : transportMethod === 'POST'
            ? '{}'
            : undefined,
    })
  }

  return window.fetch(input, init)
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
