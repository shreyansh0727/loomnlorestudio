"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/lib/form-state";
import {
  adminActionContext,
  databaseMessage,
  firstIssue,
  text,
} from "@/lib/admin/helpers";
import { businessDecisionSchema } from "@/lib/validation-admin";
import type { Business } from "@/lib/types";

export async function reviewBusinessAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  const parsed = businessDecisionSchema.safeParse({
    status: text(formData, "status"),
    note: text(formData, "note"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const { data: businessRow, error: readError } = await context.admin
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readError || !businessRow) {
    return { status: "error", message: "That trade application could not be found." };
  }
  const business = businessRow as unknown as Business;
  const approved = parsed.data.status === "approved";

  const { error } = await context.admin
    .from("businesses")
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.note,
      reviewed_at: new Date().toISOString(),
      reviewed_by: context.viewer.user?.id ?? null,
    })
    .eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  const { error: profileError } = await context.admin
    .from("profiles")
    .update({ account_type: approved ? "b2b" : "b2c" })
    .eq("id", business.owner_id);
  if (profileError) return { status: "error", message: databaseMessage(profileError) };

  revalidatePath("/admin/businesses");
  revalidatePath("/admin");
  revalidatePath("/account/business");
  revalidatePath("/account");
  revalidatePath("/shop");
  revalidatePath("/checkout");

  return {
    status: "success",
    message: approved
      ? `${business.legal_name} now has wholesale access.`
      : `${business.legal_name}'s application was declined.`,
  };
}
