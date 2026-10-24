import { NextResponse, type NextRequest } from "next/server";
import { linkGuestOrdersToUser } from "@/lib/data/account";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!isSupabaseConfigured || !code) {
    return NextResponse.redirect(
      new URL("/login?error=auth-link", url.origin),
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=auth-link", url.origin),
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      await linkGuestOrdersToUser(
        user.id,
        user.email,
        Boolean(user.email_confirmed_at),
      );
    }

    return NextResponse.redirect(new URL(next, url.origin));
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth-link", url.origin));
  }
}
