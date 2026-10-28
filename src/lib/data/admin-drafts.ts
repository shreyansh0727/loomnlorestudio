import "server-only";

import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import type { AdminDraft, AdminDraftKind, DraftPayload } from "@/lib/types";

function normalise(row: Record<string, unknown>): AdminDraft {
  return {
    id: String(row.id),
    kind: row.kind as AdminDraftKind,
    label: typeof row.label === "string" ? row.label : "",
    payload: (row.payload ?? {}) as DraftPayload,
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listAdminDrafts(kind?: AdminDraftKind): Promise<AdminDraft[]> {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return [];

  let query = admin.from("admin_drafts").select("*");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[listAdminDrafts] query failed", error);
    return [];
  }
  return (data ?? []).map((row) => normalise(row as Record<string, unknown>));
}

export async function getAdminDraft(
  id: string,
  kind: AdminDraftKind,
): Promise<AdminDraft | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;

  const { data, error } = await admin
    .from("admin_drafts")
    .select("*")
    .eq("id", id)
    .eq("kind", kind)
    .maybeSingle();
  if (error) {
    console.error("[getAdminDraft] query failed", error);
    return null;
  }
  return data ? normalise(data as Record<string, unknown>) : null;
}
