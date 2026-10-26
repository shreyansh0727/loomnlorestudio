import { describe, expect, it } from "vitest";
import { resolveAuthOrigin } from "@/lib/auth-origin";

const fallback = "https://www.buniya.co.in";

describe("resolveAuthOrigin", () => {
  it("uses the origin of a valid request origin", () => {
    expect(resolveAuthOrigin("https://www.buniya.co.in/shop", fallback)).toBe(
      "https://www.buniya.co.in",
    );
  });

  it("keeps local development origins", () => {
    expect(resolveAuthOrigin("http://localhost:3000", fallback)).toBe(
      "http://localhost:3000",
    );
  });

  it("falls back when the header is missing", () => {
    expect(resolveAuthOrigin(null, fallback)).toBe(fallback);
    expect(resolveAuthOrigin("", fallback)).toBe(fallback);
  });

  it("falls back for unparsable or non-web origins", () => {
    expect(resolveAuthOrigin("not a url", fallback)).toBe(fallback);
    expect(resolveAuthOrigin("null", fallback)).toBe(fallback);
    expect(resolveAuthOrigin("ftp://example.com", fallback)).toBe(fallback);
  });

  it("normalizes trailing slashes on the fallback", () => {
    expect(resolveAuthOrigin(undefined, "https://www.buniya.co.in/")).toBe(fallback);
  });
});
