import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getAdminMfaLevel, isAdminMfaSatisfied } from "@/lib/mfa";
import { getSupabaseServerClientSafe } from "@/lib/supabase/server";
import type { Business, Profile, Viewer } from "@/lib/types";

function bootstrapAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const ANONYMOUS_VIEWER: Viewer = {
  user: null,
  profile: null,
  business: null,
  isAdmin: false,
  isB2B: false,
};

export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return ANONYMOUS_VIEWER;

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return ANONYMOUS_VIEWER;

    const [{ data: profile }, { data: business }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .eq("status", "approved")
        .maybeSingle(),
    ]);

    const typedProfile = profile as Profile | null;
    const typedBusiness = business as Business | null;
    const email = user.email?.toLowerCase() ?? null;
    const envAdmin = email ? bootstrapAdminEmails().includes(email) : false;

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        emailConfirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
      },
      profile: typedProfile,
      business: typedBusiness,
      isAdmin: typedProfile?.role === "admin" || envAdmin,
      isB2B:
        typedBusiness?.status === "approved" &&
        typedProfile?.account_type === "b2b",
    };
  } catch {
    return ANONYMOUS_VIEWER;
  }
});

export async function requireViewer(nextPath = "/account"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer.user) {
    // Local preview without Supabase: the dashboard can render demo data but
    // every mutation remains blocked because no admin client exists.
    if (!isSupabaseConfigured && process.env.NODE_ENV !== "production") {
      return { ...ANONYMOUS_VIEWER, isAdmin: true };
    }
    redirect("/admin/login?next=/admin");
  }
  if (!viewer.isAdmin) {
    redirect("/account?error=admin-access");
  }

  const mfaLevel = await getAdminMfaLevel();
  if (!isAdminMfaSatisfied(mfaLevel)) {
    redirect("/admin/mfa?next=/admin");
  }

  return viewer;
}

export async function assertAdmin() {
  const viewer = await getViewer();
  if (!viewer.user || !viewer.isAdmin) {
    throw new Error("You do not have permission to perform this action.");
  }

  const mfaLevel = await getAdminMfaLevel();
  if (!isAdminMfaSatisfied(mfaLevel)) {
    throw new Error("Verify your authenticator code before making studio changes.");
  }

  return viewer;
}
