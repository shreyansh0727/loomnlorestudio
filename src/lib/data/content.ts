import "server-only";

import type { HomepageSection, PopupOffer, SiteSettings } from "@/lib/types";
import {
  demoHomepageSections,
  demoPopupOffer,
  demoSiteSettings,
} from "@/lib/demo-data";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClientSafe } from "@/lib/supabase/server";

function mergeSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") return demoSiteSettings;
  const record = value as Partial<SiteSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...record,
    sellerAddress: {
      ...DEFAULT_SETTINGS.sellerAddress,
      ...(record.sellerAddress ?? {}),
    },
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSupabaseConfigured) return demoSiteSettings;

  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return DEFAULT_SETTINGS;

  const { data, error } = await supabase
    .from("site_settings")
    .select("data")
    .eq("id", true)
    .maybeSingle();

  if (error) return DEFAULT_SETTINGS;
  return mergeSettings(data?.data);
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  if (!isSupabaseConfigured) return demoHomepageSections;

  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("homepage_sections")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Unable to load homepage content: ${error.message}`);
  return (data ?? []) as HomepageSection[];
}

export async function getActivePopupOffer(): Promise<PopupOffer | null> {
  if (!isSupabaseConfigured) return demoPopupOffer;

  const supabase = await getSupabaseServerClientSafe();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("popup_offers")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as PopupOffer | null) ?? null;
}
