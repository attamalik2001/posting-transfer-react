import { createClient } from '@supabase/supabase-js'
import { setupMockSupabaseInterceptor } from './mockData'

const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isRealSupabaseConfigured = Boolean(envSupabaseUrl && envSupabaseAnonKey)

export const supabaseUrl = isRealSupabaseConfigured ? (envSupabaseUrl as string) : 'https://mock.supabase.local'
export const supabaseAnonKey = isRealSupabaseConfigured ? (envSupabaseAnonKey as string) : 'mock-anon-key'
export const serviceRoleKey = (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined) || supabaseAnonKey

// The app is always configured to run: either with live Supabase or in-memory mock store
export const isSupabaseConfigured = true
export const isMockMode = !isRealSupabaseConfigured

if (isMockMode) {
  setupMockSupabaseInterceptor(supabaseUrl)
}

export const supabase = isRealSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
