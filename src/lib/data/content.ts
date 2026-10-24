import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { HomepageSection, PopupOffer, SiteSettings } from "@/lib/types";
import {
  demoHomepageSections,
  demoPopupOffer,
  demoSiteSettings,
} from "@/lib/demo-data";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicSupabaseClient } from "@/lib/supabase/public";

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

const loadSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    if (!isSupabaseConfigured) return demoSiteSettings;

    const supabase = getPublicSupabaseClient();
    if (!supabase) return DEFAULT_SETTINGS;

    const { data, error } = await supabase
      .from("site_settings")
      .select("data")
      .eq("id", true)
      .maybeSingle();

    if (error) return DEFAULT_SETTINGS;
    return mergeSettings(data?.data);
  },
  ["site-settings"],
  { tags: ["site-settings"], revalidate: 300 },
);

export const getSiteSettings = cache(loadSiteSettings);

const loadHomepageSections = unstable_cache(
  async (): Promise<HomepageSection[]> => {
    if (!isSupabaseConfigured) return demoHomepageSections;

    const supabase = getPublicSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("homepage_sections")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Unable to load homepage content: ${error.message}`);
    return (data ?? []) as HomepageSection[];
  },
  ["homepage-sections"],
  { tags: ["homepage-sections"], revalidate: 300 },
);

export const getHomepageSections = cache(loadHomepageSections);

const loadActivePopupOffer = unstable_cache(
  async (): Promise<PopupOffer | null> => {
    if (!isSupabaseConfigured) return demoPopupOffer;

    const supabase = getPublicSupabaseClient();
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
  },
  ["popup-offers"],
  { tags: ["popup-offers"], revalidate: 300 },
);

export const getActivePopupOffer = cache(loadActivePopupOffer);
