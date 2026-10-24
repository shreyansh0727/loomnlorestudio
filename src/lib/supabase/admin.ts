import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey } from "@/lib/server-env";
import { SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

let adminClient: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Follow the setup guide before using admin features.",
    );
  }

  if (!adminClient) {
    adminClient = createClient(SUPABASE_URL, getServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export function getSupabaseAdminClientSafe(): SupabaseClient | null {
  if (!isSupabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}
