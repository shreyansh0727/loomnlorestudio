import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;
    const isAdminPage =
      (pathname === "/admin" || pathname.startsWith("/admin/")) &&
      !pathname.startsWith("/admin/login") &&
      !pathname.startsWith("/admin/mfa");

    if (user && isAdminPage) {
      const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (level?.currentLevel !== "aal2") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/admin/mfa";
        redirectUrl.search = "";
        redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

        const redirectResponse = NextResponse.redirect(redirectUrl);
        response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
        return redirectResponse;
      }
    }
  } catch {
    // Public pages remain available if auth refresh fails.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|mp4|webm)$).*)",
  ],
};
