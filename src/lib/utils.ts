import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product, ProductVariant } from "@/lib/types";
import { SITE_URL } from "@/lib/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(paise: number, options?: { compact?: boolean }) {
  if (!Number.isFinite(paise)) return "₹0";
  if (options?.compact && paise >= 100_000_00) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(paise / 100);
  }

  const hasPaise = paise % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function parseRupeesToPaise(input: string | number): number | null {
  const normalized = String(input).replace(/[₹,\s]/g, "");
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function paiseToRupeeInput(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "";
  return (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2);
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDate(
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function toDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(offset).toISOString().slice(0, 16);
}

export function getEffectivePrice(
  product: Pick<Product, "retail_price" | "wholesale_price">,
  variant: Pick<ProductVariant, "retail_price_override" | "wholesale_price_override">,
  isB2B: boolean,
) {
  const retail = variant.retail_price_override ?? product.retail_price;
  if (!isB2B) return retail;
  return variant.wholesale_price_override ?? product.wholesale_price ?? retail;
}

// Variant images live in the attributes bag so existing databases need no migration.
export function variantImageUrl(
  variant: Pick<ProductVariant, "attributes"> | null | undefined,
): string {
  const value = variant?.attributes?.image_url;
  return typeof value === "string" ? value.trim() : "";
}

export function getStartingPrice(product: Product, isB2B: boolean) {  const activeVariants = product.variants.filter((variant) => variant.is_active);
  if (!activeVariants.length) {
    return isB2B
      ? (product.wholesale_price ?? product.retail_price)
      : product.retail_price;
  }
  return Math.min(
    ...activeVariants.map((variant) => getEffectivePrice(product, variant, isB2B)),
  );
}

export function getTotalStock(product: Product) {
  return product.variants.reduce(
    (total, variant) => total + (variant.is_active ? variant.stock_qty : 0),
    0,
  );
}

export function unitLabel(unit: string, quantity = 2) {
  const labels: Record<string, [string, string]> = {
    piece: ["piece", "pieces"],
    metre: ["metre", "metres"],
    set: ["set", "sets"],
    pack: ["pack", "packs"],
    bundle: ["bundle", "bundles"],
  };
  const pair = labels[unit] ?? [unit, `${unit}s`];
  return quantity === 1 ? pair[0] : pair[1];
}

export function safeNextPath(value: string | null | undefined, fallback = "/account") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function isValidIndianPhone(value: string) {
  const digits = normalizePhone(value);
  return /^(?:91)?[6-9]\d{9}$/.test(digits);
}

export function isValidGstin(value: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
    value.trim().toUpperCase(),
  );
}

export function isB2BAudience(
  audience: "b2c" | "b2b" | "all",
  buyerType: "b2c" | "b2b",
) {
  return audience === "all" || audience === buyerType;
}

export function truncate(value: string, max = 120) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

export function isScheduleActive(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  now = new Date(),
) {
  if (startsAt && new Date(startsAt) > now) return false;
  if (endsAt && new Date(endsAt) < now) return false;
  return true;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatGstin(value: string | null) {
  return value?.trim().toUpperCase() || "Not provided";
}
