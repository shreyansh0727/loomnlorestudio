import "server-only";

import { headers } from "next/headers";
import { resolveAuthOrigin } from "@/lib/auth-origin";
import { SITE_URL } from "@/lib/env";

// Auth emails should return to the domain the customer is using. Supabase still
// requires each origin to be allowlisted under Authentication → URL Configuration.
export async function authCallbackUrl(next: string): Promise<string> {
  const requestHeaders = await headers();
  const candidate =
    requestHeaders.get("origin") ?? requestHeaders.get("referer");
  const url = new URL("/auth/callback", resolveAuthOrigin(candidate, SITE_URL));
  if (next) url.searchParams.set("next", next);
  return url.toString();
}
