import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function useSupabase(): SupabaseClient {
  if (import.meta.server) {
    return null as unknown as SupabaseClient
  }

  if (!_client) {
    const { public: { supabaseUrl, supabaseAnonKey } } = useRuntimeConfig()
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase config. Set SUPABASE_URL and SUPABASE_ANON_KEY for apps/landing.')
    }

    _client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}
