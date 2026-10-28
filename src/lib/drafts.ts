import type { AdminDraft, AdminDraftKind, DraftPayload } from "@/lib/types";

export const DRAFT_KINDS = [
  "product",
  "coupon",
  "combo",
  "section",
  "popup",
] as const satisfies readonly AdminDraftKind[];

export const DRAFT_KIND_LABELS: Record<AdminDraftKind, string> = {
  product: "Product",
  coupon: "Coupon",
  combo: "Bundle",
  section: "Homepage section",
  popup: "Popup",
};

export function resumeDraftHref(
  draft: Pick<AdminDraft, "id" | "kind" | "payload">,
): string {
  switch (draft.kind) {
    case "product":
      return `/admin/products/new?draft=${draft.id}`;
    case "coupon":
      return `/admin/coupons/new?draft=${draft.id}`;
    case "combo":
      return `/admin/combos/new?draft=${draft.id}`;
    case "popup":
      return `/admin/content/popups/new?draft=${draft.id}`;
    case "section": {
      const type = draftString(draft.payload, "sectionType");
      const query = type ? `?type=${encodeURIComponent(type)}&` : "?";
      return `/admin/content/new${query}draft=${draft.id}`;
    }
  }
}

export function draftString(
  payload: DraftPayload | null | undefined,
  key: string,
  fallback = "",
): string {
  const value = payload?.[key];
  return typeof value === "string" ? value : fallback;
}

export function draftFlag(
  payload: DraftPayload | null | undefined,
  key: string,
  fallback: boolean,
): boolean {
  const value = payload?.[key];
  return typeof value === "boolean" ? value : fallback;
}

export function draftJson<T>(
  payload: DraftPayload | null | undefined,
  key: string,
  fallback: T,
): T {
  const raw = draftString(payload, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const LABEL_KEYS = ["name", "title", "headline", "code", "label", "description"];

export function draftLabel(payload: DraftPayload, fallback = "Untitled draft"): string {
  for (const key of LABEL_KEYS) {
    const value = draftString(payload, key).trim();
    if (value) return value.slice(0, 120);
  }
  return fallback;
}

const IGNORED_KEYS = new Set(["id", "draftId", "sectionType"]);

export function draftHasContent(payload: DraftPayload): boolean {
  return Object.entries(payload).some(
    ([key, value]) =>
      !IGNORED_KEYS.has(key) && typeof value === "string" && value.trim() !== "",
  );
}
