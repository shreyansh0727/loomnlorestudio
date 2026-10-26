import "server-only";

import { cache } from "react";
import { getSupabaseServerClientSafe } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

export interface AdminMfaState {
  currentLevel: string | null;
  verifiedFactorId: string | null;
}

export const getAdminMfaLevel = cache(async (): Promise<string | null> => {
  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return null;

  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel ?? null;
});

export function isAdminMfaSatisfied(level: string | null) {
  return level === "aal2";
}

export async function getAdminMfaState(): Promise<AdminMfaState> {
  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) {
    return { currentLevel: null, verifiedFactorId: null };
  }

  const [currentLevel, { data: factors }] = await Promise.all([
    getAdminMfaLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  const totp = factors?.all.filter((factor) => factor.factor_type === "totp") ?? [];

  return {
    currentLevel,
    verifiedFactorId: totp.find((factor) => factor.status === "verified")?.id ?? null,
  };
}

export function adminMfaNext(value: string | null | undefined) {
  const next = safeNextPath(value, "/admin");
  return next.startsWith("/admin") ? next : "/admin";
}
