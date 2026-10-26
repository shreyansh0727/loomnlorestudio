"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import type { FormState, MfaEnrollState } from "@/lib/form-state";
import { adminMfaNext } from "@/lib/mfa";
import { getSupabaseServerClientSafe } from "@/lib/supabase/server";
import { totpCodeSchema } from "@/lib/validation";

const NOT_CONFIGURED =
  "Two-step verification needs Supabase. Add your project keys to .env.local and restart the app.";

const NOT_ADMIN =
  "Sign in with an admin account before setting up two-step verification.";

function mfaErrorMessage(message: string) {
  const value = message.toLowerCase();
  if (value.includes("rate limit")) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (value.includes("expired") || value.includes("challenge")) {
    return "That code expired. Use the next code shown in your authenticator app.";
  }
  if (value.includes("factor")) {
    return "That authenticator is no longer available. Reload the page to start again.";
  }
  if (value.includes("code") || value.includes("verification") || value.includes("invalid")) {
    return "That code did not match. Check your authenticator app and try again.";
  }
  return "We could not verify that code. Please try again.";
}

export async function startMfaEnrollmentAction(): Promise<MfaEnrollState> {
  const viewer = await getViewer();
  if (!viewer.user || !viewer.isAdmin) {
    return { status: "error", message: NOT_ADMIN };
  }

  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  const { data: existing } = await supabase.auth.mfa.listFactors();
  const factors = existing?.all.filter((factor) => factor.factor_type === "totp") ?? [];

  if (factors.some((factor) => factor.status === "verified")) {
    return {
      status: "error",
      message: "Two-step verification is already set up. Reload the page and enter a code.",
    };
  }

  // Abandoned setups would otherwise pile up against the project factor limit.
  await Promise.all(
    factors
      .filter((factor) => factor.status !== "verified")
      .map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })),
  );

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Studio authenticator",
  });

  if (error || !data || data.type !== "totp") {
    return {
      status: "error",
      message: "We could not start the authenticator setup. Please try again.",
    };
  }

  return {
    status: "ready",
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function verifyMfaCodeAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer.user || !viewer.isAdmin) {
    return { status: "error", message: NOT_ADMIN };
  }

  const factorId = String(formData.get("factorId") ?? "").trim();
  if (!factorId) {
    return { status: "error", message: "Reload the page and try again." };
  }

  const parsed = totpCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter the 6-digit code.",
    };
  }

  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return { status: "error", message: NOT_CONFIGURED };

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: parsed.data.code,
  });

  if (error) return { status: "error", message: mfaErrorMessage(error.message) };

  revalidatePath("/", "layout");
  redirect(adminMfaNext(String(formData.get("next") ?? "")));
}
