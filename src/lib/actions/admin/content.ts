"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import {
  adminActionContext,
  databaseMessage,
  firstIssue,
  flagged,
  integer,
  isoDate,
  jsonValue,
  text,
} from "@/lib/admin/helpers";
import {
  homepageSectionInputSchema,
  parseSectionConfig,
  popupInputSchema,
  siteSettingsInputSchema,
} from "@/lib/validation-admin";
import { getSiteSettings } from "@/lib/data/content";
import type { HomepageSectionType } from "@/lib/types";
import { HOMEPAGE_SECTION_TYPES } from "@/lib/types";

function refreshHomepage() {
  revalidateTag("homepage-sections", { expire: 0 });
  revalidateTag("popup-offers", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/content");
  revalidatePath("/admin");
}

function refreshSettings() {
  revalidateTag("site-settings", { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
}

export async function saveHomepageSectionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim() || null;
  const typeParsed = z.enum(HOMEPAGE_SECTION_TYPES).safeParse(text(formData, "sectionType"));
  if (!typeParsed.success) {
    return { status: "error", message: "Choose a valid section type." };
  }
  const sectionType = typeParsed.data as HomepageSectionType;

  const base = homepageSectionInputSchema.safeParse({
    title: text(formData, "title"),
    subtitle: text(formData, "subtitle"),
    sortOrder: integer(formData, "sortOrder"),
    isActive: flagged(formData, "isActive"),
    startsAt: isoDate(formData, "startsAt"),
    endsAt: isoDate(formData, "endsAt"),
  });
  if (!base.success) return { status: "error", message: firstIssue(base.error) };

  if (
    base.data.startsAt &&
    base.data.endsAt &&
    new Date(base.data.startsAt).getTime() >= new Date(base.data.endsAt).getTime()
  ) {
    return { status: "error", message: "The end date must be after the start date." };
  }

  const config = parseSectionConfig(sectionType, jsonValue(formData, "config"));
  if (!config.success) {
    return { status: "error", message: firstIssue(config.error) };
  }

  const payload = {
    section_type: sectionType,
    title: base.data.title,
    subtitle: base.data.subtitle,
    config: config.data,
    sort_order: base.data.sortOrder,
    is_active: base.data.isActive,
    starts_at: base.data.startsAt,
    ends_at: base.data.endsAt,
  };

  if (id) {
    const { error } = await context.admin
      .from("homepage_sections")
      .update(payload)
      .eq("id", id);
    if (error) return { status: "error", message: databaseMessage(error) };
  } else {
    const { error } = await context.admin.from("homepage_sections").insert(payload);
    if (error) return { status: "error", message: databaseMessage(error) };
  }

  refreshHomepage();
  redirect("/admin/content?saved=1");
}

export async function toggleHomepageSectionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  const next = flagged(formData, "nextActive");
  if (!id) return { status: "error", message: "That section could not be found." };

  const { error } = await context.admin
    .from("homepage_sections")
    .update({ is_active: next })
    .eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshHomepage();
  return {
    status: "success",
    message: next ? "Section is live on the homepage." : "Section hidden from the homepage.",
  };
}

export async function moveHomepageSectionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  const direction = text(formData, "direction");
  if (!id || !["up", "down"].includes(direction)) {
    return { status: "error", message: "That move could not be completed." };
  }

  const { data, error } = await context.admin
    .from("homepage_sections")
    .select("id,sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { status: "error", message: databaseMessage(error) };

  const rows = (data ?? []) as { id: string; sort_order: number }[];
  const index = rows.findIndex((row) => row.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) {
    return { status: "success", message: "Already at the edge of the homepage." };
  }

  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  const updates = reordered.map((row, position) =>
    context.admin
      .from("homepage_sections")
      .update({ sort_order: position })
      .eq("id", row.id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { status: "error", message: databaseMessage(failed.error) };
  }

  refreshHomepage();
  return { status: "success", message: "Homepage order updated." };
}

export async function deleteHomepageSectionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  if (!id) return { status: "error", message: "That section could not be found." };

  const { error } = await context.admin
    .from("homepage_sections")
    .delete()
    .eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshHomepage();
  return { status: "success", message: "Section removed." };
}

export async function savePopupAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim() || null;
  const parsed = popupInputSchema.safeParse({
    headline: text(formData, "headline"),
    body: text(formData, "body"),
    imageUrl: text(formData, "imageUrl"),
    couponCode: text(formData, "couponCode").toUpperCase(),
    ctaLabel: text(formData, "ctaLabel"),
    ctaHref: text(formData, "ctaHref"),
    isActive: flagged(formData, "isActive"),
    startsAt: isoDate(formData, "startsAt"),
    endsAt: isoDate(formData, "endsAt"),
    delaySeconds: integer(formData, "delaySeconds", 5),
    frequency: text(formData, "frequency", "once_per_day"),
    priority: integer(formData, "priority"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  if (
    parsed.data.startsAt &&
    parsed.data.endsAt &&
    new Date(parsed.data.startsAt).getTime() >= new Date(parsed.data.endsAt).getTime()
  ) {
    return { status: "error", message: "The end date must be after the start date." };
  }

  const payload = {
    headline: parsed.data.headline,
    body: parsed.data.body,
    image_url: parsed.data.imageUrl,
    coupon_code: parsed.data.couponCode,
    cta_label: parsed.data.ctaLabel,
    cta_href: parsed.data.ctaHref,
    is_active: parsed.data.isActive,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
    delay_seconds: parsed.data.delaySeconds,
    frequency: parsed.data.frequency,
    priority: parsed.data.priority,
  };

  if (id) {
    const { error } = await context.admin.from("popup_offers").update(payload).eq("id", id);
    if (error) return { status: "error", message: databaseMessage(error) };
  } else {
    const { error } = await context.admin.from("popup_offers").insert(payload);
    if (error) return { status: "error", message: databaseMessage(error) };
  }

  refreshHomepage();
  redirect("/admin/content?popupSaved=1");
}

export async function togglePopupAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  const next = flagged(formData, "nextActive");
  if (!id) return { status: "error", message: "That popup could not be found." };

  const { error } = await context.admin
    .from("popup_offers")
    .update({ is_active: next })
    .eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshHomepage();
  return {
    status: "success",
    message: next ? "Popup activated." : "Popup paused.",
  };
}

export async function deletePopupAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  if (!id) return { status: "error", message: "That popup could not be found." };

  const { error } = await context.admin.from("popup_offers").delete().eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshHomepage();
  return { status: "success", message: "Popup removed." };
}

export async function saveSettingsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const gstRateRaw = text(formData, "gstRate", "5").trim();
  const parsed = siteSettingsInputSchema.safeParse({
    brandName: text(formData, "brandName"),
    brandTagline: text(formData, "brandTagline"),
    logoUrl: text(formData, "logoUrl"),
    announcementText: text(formData, "announcementText"),
    announcementHref: text(formData, "announcementHref", "/shop"),
    announcementActive: flagged(formData, "announcementActive"),
    supportEmail: text(formData, "supportEmail"),
    supportPhone: text(formData, "supportPhone"),
    whatsapp: text(formData, "whatsapp"),
    sellerLegalName: text(formData, "sellerLegalName"),
    sellerGstin: text(formData, "sellerGstin"),
    sellerAddress: {
      line1: text(formData, "sellerLine1"),
      line2: text(formData, "sellerLine2"),
      city: text(formData, "sellerCity"),
      state: text(formData, "sellerState"),
      pincode: text(formData, "sellerPincode"),
      country: text(formData, "sellerCountry", "India"),
    },
    gstRate: Number(gstRateRaw),
    invoicePrefix: text(formData, "invoicePrefix", "BN"),
    b2bEmail: text(formData, "b2bEmail"),
    instagramUrl: text(formData, "instagramUrl"),
    facebookUrl: text(formData, "facebookUrl"),
    pinterestUrl: text(formData, "pinterestUrl"),
    aboutText: text(formData, "aboutText"),
    shippingPolicy: text(formData, "shippingPolicy"),
    returnsPolicy: text(formData, "returnsPolicy"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const current = await getSiteSettings();
  const data = {
    ...current,
    ...parsed.data,
    logoUrl: parsed.data.logoUrl,
    b2bEmail: parsed.data.b2bEmail ?? "",
    instagramUrl: parsed.data.instagramUrl ?? "",
    facebookUrl: parsed.data.facebookUrl ?? "",
    pinterestUrl: parsed.data.pinterestUrl ?? "",
  };

  const { error } = await context.admin
    .from("site_settings")
    .upsert({ id: true, data }, { onConflict: "id" });
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshSettings();
  return { status: "success", message: "Studio settings saved." };
}
