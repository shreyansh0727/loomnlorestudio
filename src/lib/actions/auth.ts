"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { linkGuestOrdersToUser } from "@/lib/data/account";
import { isSupabaseConfigured, SITE_URL } from "@/lib/env";
import type { FormState } from "@/lib/form-state";
import {
  createSupabaseServerClient,
  getSupabaseServerClientSafe,
} from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";
import {
  emailOnlySchema,
  loginSchema,
  newPasswordSchema,
  signUpSchema,
} from "@/lib/validation";

const NOT_CONFIGURED =
  "Accounts are not connected yet. Add your Supabase keys to .env.local to enable sign-in.";

function authErrorMessage(message: string) {
  const value = message.toLowerCase();
  if (value.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (value.includes("email not confirmed")) {
    return "Confirm your email address before signing in. Check your inbox for the link.";
  }
  if (value.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (value.includes("rate limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (value.includes("signups not allowed")) {
    return "New accounts are paused right now. Please write to the studio.";
  }
  return "We could not complete that request. Please try again.";
}

function fieldError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the details and try again.";
}

export async function signInAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: NOT_CONFIGURED };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: fieldError(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { status: "error", message: authErrorMessage(error.message) };
  if (!data.user) {
    return { status: "error", message: "We could not sign you in. Please try again." };
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Confirm your email address before signing in. Check your inbox for the link.",
    };
  }

  await linkGuestOrdersToUser(
    data.user.id,
    data.user.email ?? parsed.data.email,
    true,
  );

  const next = safeNextPath(String(formData.get("next") ?? ""));
  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: NOT_CONFIGURED };

  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    terms: formData.get("terms"),
  });
  if (!parsed.success) {
    return { status: "error", message: fieldError(parsed.error) };
  }

  const next = safeNextPath(String(formData.get("next") ?? ""));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone ?? "",
      },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { status: "error", message: authErrorMessage(error.message) };

  if (data.user?.identities && data.user.identities.length === 0) {
    return {
      status: "error",
      message: "An account with this email already exists. Try signing in instead.",
    };
  }

  if (data.session && data.user) {
    await linkGuestOrdersToUser(
      data.user.id,
      data.user.email ?? parsed.data.email,
      Boolean(data.user.email_confirmed_at),
    );
    revalidatePath("/", "layout");
    redirect(next);
  }

  return {
    status: "success",
    message:
      "Your account is almost ready. Open the confirmation link we sent to your inbox, then sign in.",
  };
}

export async function requestPasswordResetAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: NOT_CONFIGURED };

  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: fieldError(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
  });

  return {
    status: "success",
    message:
      "If that email belongs to an account, a secure reset link is on its way. It expires in one hour.",
  };
}

export async function updatePasswordAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured) return { status: "error", message: NOT_CONFIGURED };

  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: fieldError(parsed.error) };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "This reset link has expired. Request a fresh link and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { status: "error", message: authErrorMessage(error.message) };

  revalidatePath("/", "layout");
  redirect("/account?password=updated");
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClientSafe();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
