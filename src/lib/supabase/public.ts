import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

let cached: SupabaseClient | null = null;

// Cookie-free client so public data can be cached outside a request scope.
export function getPublicSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  cached ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
