"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import {
  findOrderByNumberAndEmail,
  getMyBusiness,
} from "@/lib/data/account";
import type { FormState } from "@/lib/form-state";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import { businessSchema, profileSchema, trackOrderSchema } from "@/lib/validation";

function fieldError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the details and try again.";
}

const SERVICE_ROLE_MISSING =
  "This form needs the Supabase service role key. Add it to .env.local and restart the app.";

export async function updateProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer.user) {
    redirect(`/login?next=${encodeURIComponent("/account/profile")}`);
  }

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { status: "error", message: fieldError(parsed.error) };
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) return { status: "error", message: SERVICE_ROLE_MISSING };

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
    })
    .eq("id", viewer.user.id);

  if (error) {
    return { status: "error", message: "We could not save your details. Please try again." };
  }

  revalidatePath("/account", "layout");
  redirect("/account/profile?saved=1");
}

export async function submitBusinessAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer.user) {
    redirect(`/login?next=${encodeURIComponent("/account/business")}`);
  }

  if (!viewer.user.emailConfirmed) {
    return {
      status: "error",
      message: "Confirm your email address before applying for a trade account.",
    };
  }

  const parsed = businessSchema.safeParse({
    legalName: formData.get("legalName"),
    tradeName: formData.get("tradeName"),
    gstin: formData.get("gstin"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
  });
  if (!parsed.success) {
    return { status: "error", message: fieldError(parsed.error) };
  }

  const admin = getSupabaseAdminClientSafe();
  if (!admin) return { status: "error", message: SERVICE_ROLE_MISSING };

  const existing = await getMyBusiness(viewer.user.id);
  if (existing?.status === "approved") {
    return {
      status: "error",
      message: "Your trade account is already approved. Write to us for changes.",
    };
  }

  const { error } = await admin.from("businesses").upsert(
    {
      owner_id: viewer.user.id,
      ...parsed.data,
      status: "pending",
      admin_note: null,
      reviewed_at: null,
      reviewed_by: null,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "owner_id" },
  );

  if (error) {
    return {
      status: "error",
      message: "We could not submit your application. Please try again.",
    };
  }

  revalidatePath("/account", "layout");
  redirect("/account/business?submitted=1");
}

export async function trackOrderAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = trackOrderSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { status: "error", message: fieldError(parsed.error) };
  }

  const order = await findOrderByNumberAndEmail(
    parsed.data.orderNumber,
    parsed.data.email,
  );

  if (!order) {
    return {
      status: "error",
      message:
        "We could not find an order with that number and email. Check both details or write to the studio.",
    };
  }

  redirect(`/order/${order.access_token}`);
}
