import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) {
    console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY; realtime disabled');
    return null;
  }
  supabase = createClient(url, key, {
    realtime: {
      params: { eventsPerSecond: 5 },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return supabase;
}

