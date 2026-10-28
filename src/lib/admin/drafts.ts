import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function discardDraftAfterSave(
  admin: SupabaseClient,
  formData: FormData,
) {
  const id = formData.get("draftId");
  if (typeof id !== "string" || !id.trim()) return;
  const { error } = await admin
    .from("admin_drafts")
    .delete()
    .eq("id", id.trim());
  if (error) console.error("[discardDraftAfterSave] delete failed", error);
}
