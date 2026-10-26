export function resolveAuthOrigin(
  candidate: string | null | undefined,
  fallback: string,
): string {
  if (candidate) {
    try {
      const url = new URL(candidate);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // Fall through to the configured site URL.
    }
  }
  return fallback.replace(/\/+$/, "");
}
