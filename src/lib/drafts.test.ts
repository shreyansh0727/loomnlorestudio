import { describe, expect, it } from "vitest";
import {
  draftFlag,
  draftHasContent,
  draftJson,
  draftLabel,
  draftString,
  resumeDraftHref,
} from "@/lib/drafts";

describe("draftLabel", () => {
  it("prefers the most specific field", () => {
    expect(draftLabel({ title: "Section", name: "Bow clip" })).toBe("Bow clip");
    expect(draftLabel({ headline: "Hello", code: "WELCOME10" })).toBe("Hello");
    expect(draftLabel({ code: "WELCOME10", label: "Welcome" })).toBe("WELCOME10");
  });

  it("falls back when nothing usable was typed", () => {
    expect(draftLabel({ name: "   ", moq: "6" })).toBe("Untitled draft");
  });

  it("trims long values", () => {
    expect(draftLabel({ name: "x".repeat(200) })).toHaveLength(120);
  });
});

describe("draftHasContent", () => {
  it("ignores bookkeeping fields", () => {
    expect(draftHasContent({ id: "", draftId: "abc", sectionType: "hero" })).toBe(
      false,
    );
  });

  it("detects typed values", () => {
    expect(draftHasContent({ moq: "1" })).toBe(true);
  });
});

describe("draft readers", () => {
  const payload = {
    name: "Rose garden",
    isActive: false,
    variants: JSON.stringify([{ label: "One size", stockQty: 4 }]),
    broken: "{not json",
    imageUrl: true,
  };

  it("reads strings with fallbacks", () => {
    expect(draftString(payload, "name")).toBe("Rose garden");
    expect(draftString(payload, "imageUrl", "fallback")).toBe("fallback");
    expect(draftString(payload, "missing", "fallback")).toBe("fallback");
  });

  it("reads booleans", () => {
    expect(draftFlag(payload, "isActive", true)).toBe(false);
    expect(draftFlag(payload, "missing", true)).toBe(true);
  });

  it("parses JSON safely", () => {
    expect(draftJson(payload, "variants", [])).toEqual([
      { label: "One size", stockQty: 4 },
    ]);
    expect(draftJson(payload, "broken", ["fallback"])).toEqual(["fallback"]);
    expect(draftJson(payload, "missing", null)).toBeNull();
  });
});

describe("resumeDraftHref", () => {
  const base = { id: "abc-123", payload: {} };

  it("points each kind at its create page", () => {
    expect(resumeDraftHref({ ...base, kind: "product" })).toBe(
      "/admin/products/new?draft=abc-123",
    );
    expect(resumeDraftHref({ ...base, kind: "coupon" })).toBe(
      "/admin/coupons/new?draft=abc-123",
    );
    expect(resumeDraftHref({ ...base, kind: "combo" })).toBe(
      "/admin/combos/new?draft=abc-123",
    );
    expect(resumeDraftHref({ ...base, kind: "popup" })).toBe(
      "/admin/content/popups/new?draft=abc-123",
    );
  });

  it("keeps the section type in the link", () => {
    expect(
      resumeDraftHref({
        id: "abc-123",
        kind: "section",
        payload: { sectionType: "hero" },
      }),
    ).toBe("/admin/content/new?type=hero&draft=abc-123");
  });
});
