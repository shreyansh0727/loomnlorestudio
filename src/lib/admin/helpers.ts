import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { assertAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import type { Viewer } from "@/lib/types";
import { parseRupeesToPaise } from "@/lib/utils";

export type AdminContext =
  | { ok: true; admin: SupabaseClient; viewer: Viewer }
  | { ok: false; message: string };

export async function adminActionContext(): Promise<AdminContext> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message:
        "Preview mode — connect Supabase in .env.local to sign in and save changes.",
    };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      message:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local to manage the studio.",
    };
  }
  try {
    const viewer = await assertAdmin();
    const admin = getSupabaseAdminClientSafe();
    if (!admin) {
      return { ok: false, message: "The Supabase service role client is unavailable." };
    }
    return { ok: true, admin, viewer };
  } catch {
    return {
      ok: false,
      message: "You do not have permission to perform this action.",
    };
  }
}

export function text(formData: FormData, key: string, fallback = ""): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

export function flagged(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function integer(formData: FormData, key: string, fallback = 0): number {
  const value = text(formData, key).trim();
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function rupeesToPaise(
  formData: FormData,
  key: string,
): number | null | undefined {
  const value = text(formData, key).trim();
  if (!value) return null;
  const parsed = parseRupeesToPaise(value);
  return parsed === null ? undefined : parsed;
}

export function optionalInteger(formData: FormData, key: string): number | null {
  const value = text(formData, key).trim();
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isoDate(formData: FormData, key: string): string | null {
  const value = text(formData, key).trim();
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function jsonValue(formData: FormData, key: string): unknown {
  const value = text(formData, key, "[]");
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the details and try again.";
}

export function databaseMessage(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    if (error.message.includes("sku")) return "That SKU is already in use.";
    if (error.message.includes("slug")) return "That slug is already in use.";
    if (error.message.includes("code")) return "That coupon code already exists.";
    return "That record already exists.";
  }
  if (error.code === "23503") {
    return "That record is linked to other data and cannot be removed.";
  }
  return "The studio could not save that change. Please try again.";
}
