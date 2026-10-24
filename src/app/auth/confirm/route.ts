import { NextResponse, type NextRequest } from "next/server";
import { linkGuestOrdersToUser } from "@/lib/data/account";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

const OTP_TYPES = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

type OtpType = (typeof OTP_TYPES)[number];

function isOtpType(value: string): value is OtpType {
  return (OTP_TYPES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const typeParam = url.searchParams.get("type") ?? "email";
  const fallback = typeParam === "recovery" ? "/reset-password" : "/account";
  const next = safeNextPath(url.searchParams.get("next"), fallback);

  if (!isSupabaseConfigured || !tokenHash || !isOtpType(typeParam)) {
    return NextResponse.redirect(new URL("/login?error=auth-link", url.origin));
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam,
    });

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
