"use server";

import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import { adminActionContext, databaseMessage, text } from "@/lib/admin/helpers";
import { DRAFT_KINDS, draftLabel } from "@/lib/drafts";
import type { AdminDraftKind, DraftPayload } from "@/lib/types";

const draftPayloadSchema = z.record(
  z.string().max(80),
  z.union([z.string().max(40_000), z.boolean()]),
);

const saveDraftSchema = z.object({
  kind: z.enum(DRAFT_KINDS),
  id: z.uuid().nullable(),
  payload: draftPayloadSchema,
});

export type DraftSaveResult =
  | { ok: true; id: string; savedAt: string }
  | { ok: false; message: string; unavailable?: boolean; gone?: boolean };

export async function saveAdminDraftAction(input: {
  kind: AdminDraftKind;
  id: string | null;
  payload: DraftPayload;
}): Promise<DraftSaveResult> {
  const context = await adminActionContext();
  if (!context.ok) {
    return { ok: false, message: context.message, unavailable: true };
  }

  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "That draft could not be saved." };
  }
  if (JSON.stringify(parsed.data.payload).length > 200_000) {
    return { ok: false, message: "This draft is too large to keep." };
  }

  const label = draftLabel(parsed.data.payload);

  if (parsed.data.id) {
    const { data, error } = await context.admin
      .from("admin_drafts")
      .update({ label, payload: parsed.data.payload })
      .eq("id", parsed.data.id)
      .eq("kind", parsed.data.kind)
      .select("id, updated_at")
      .maybeSingle();
    if (error) {
      console.error("[saveAdminDraftAction] update failed", error);
      return { ok: false, message: "The draft could not be saved." };
    }
    if (data) {
      return { ok: true, id: String(data.id), savedAt: String(data.updated_at) };
    }
    // The draft was discarded or promoted elsewhere; never resurrect it.
    return { ok: false, message: "This draft is no longer available.", gone: true };
  }

  const { data, error } = await context.admin
    .from("admin_drafts")
    .insert({
      kind: parsed.data.kind,
      label,
      payload: parsed.data.payload,
      created_by: context.viewer.user?.id ?? null,
    })
    .select("id, updated_at")
    .single();
  if (error || !data) {
    console.error("[saveAdminDraftAction] insert failed", error);
    return { ok: false, message: "The draft could not be saved." };
  }
  return { ok: true, id: String(data.id), savedAt: String(data.updated_at) };
}

export async function deleteAdminDraftAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  if (!id) return { status: "error", message: "That draft could not be found." };

  const { error } = await context.admin.from("admin_drafts").delete().eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  return { status: "success", message: "Draft discarded." };
}
