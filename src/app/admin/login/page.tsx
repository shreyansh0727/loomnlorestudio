import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/content";
import { isSupabaseConfigured } from "@/lib/env";
import { getAdminMfaLevel, isAdminMfaSatisfied } from "@/lib/mfa";
import { signOutAction } from "@/lib/actions/auth";
import { safeNextPath } from "@/lib/utils";
import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/ui/brand-mark";
import { FormMessage } from "@/components/ui/form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const requested = safeNextPath(params.next, "/admin");
  const next = requested.startsWith("/admin") ? requested : "/admin";
  const [viewer, settings, mfaLevel] = await Promise.all([
    getViewer(),
    getSiteSettings(),
    getAdminMfaLevel(),
  ]);
  const demoMode = !isSupabaseConfigured && process.env.NODE_ENV !== "production";

  if (viewer.user && viewer.isAdmin) {
    redirect(
      isAdminMfaSatisfied(mfaLevel)
        ? next
        : `/admin/mfa?next=${encodeURIComponent(next)}`,
    );
  }

  return (
    <div className="deep-surface min-h-dvh bg-ink text-cream lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative flex flex-col justify-between overflow-hidden border-b border-cream/10 px-6 py-10 sm:px-10 lg:border-b-0 lg:border-r lg:px-16 lg:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(244,239,229,0.35) 0px, rgba(244,239,229,0.35) 1px, transparent 1px, transparent 9px), repeating-linear-gradient(25deg, rgba(164,84,58,0.5) 0px, rgba(164,84,58,0.5) 1px, transparent 1px, transparent 15px)",
          }}
        />
        <div className="relative">
          <Link href="/" className="inline-flex" aria-label={`${settings.brandName} storefront`}>
            <BrandMark
              name={settings.brandName}
              logoUrl={settings.logoUrl}
              textClassName="text-[1.9rem] font-light text-cream"
              logoClassName="h-12 max-w-[13rem]"
              frameClassName="bg-cream px-3 py-2"
            />
          </Link>
          <p className="mt-3 flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-cream/40">
            <Sparkles className="size-3 text-clay" aria-hidden />
            Studio desk
          </p>
        </div>

        <div className="relative mt-14 max-w-lg">
          <p className="eyebrow text-clay">Internal access</p>
          <p className="mt-5 font-serif text-[clamp(2.1rem,3.6vw,3.3rem)] font-light leading-[1.06] tracking-[-0.035em]">
            The quiet machinery behind every parcel.
          </p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-cream/55">
            Orders, inventory, trade applications and the storefront itself — all
            managed from one considered desk.
          </p>
        </div>

        <div className="relative mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-[0.62rem] uppercase tracking-[0.18em] text-cream/35">
          <span>Fulfilment</span>
          <span className="size-1 rounded-full bg-clay/70" aria-hidden />
          <span>Catalog</span>
          <span className="size-1 rounded-full bg-clay/70" aria-hidden />
          <span>Storefront</span>
          <span className="size-1 rounded-full bg-clay/70" aria-hidden />
          <span>Trade</span>
        </div>
      </div>

      <div className="flex items-center px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <p className="eyebrow text-clay">Authorised team members only</p>
          <h1 className="mt-4 font-serif text-[clamp(2.3rem,3.6vw,3rem)] font-light leading-[1.02] tracking-[-0.04em] text-cream">
            Sign in to the studio.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/50">
            Use the email address linked to your admin account. Admin sessions also
            ask for a 6-digit code from your authenticator app.
          </p>

          {demoMode ? (
            <div className="mt-7 border border-clay/30 bg-clay/10 px-4 py-4">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-clay">
                Preview available
              </p>
              <p className="mt-2 text-sm leading-relaxed text-cream/65">
                Supabase isn&apos;t connected, so this build opens a read-only demo of
                the studio desk. Every save action stays disabled.
              </p>
              <Link
                href="/admin"
                className="mt-4 inline-flex items-center gap-2 border border-cream/25 px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-cream hover:text-ink"
              >
                Enter preview
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          ) : null}

          {!isSupabaseConfigured && !demoMode ? (
            <div className="mt-7">
              <FormMessage
                tone="info"
                message="Supabase is not configured. Add your project keys to .env.local before signing in."
              />
            </div>
          ) : null}

          {viewer.user && !viewer.isAdmin ? (
            <div className="mt-7 space-y-5">
              <FormMessage
                tone="info"
                message={`${viewer.user.email ?? "This account"} is signed in, but it doesn't have studio access. Ask an existing admin to grant the admin role, or sign out and use another account.`}
              />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="border border-cream/25 px-4 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-cream hover:text-ink"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-8">
              <LoginForm
                next={next}
                notice={
                  params.error === "auth-link"
                    ? "That link is invalid or has expired. Sign in again below."
                    : undefined
                }
              />
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-cream/10 pt-6 text-[0.62rem] uppercase tracking-[0.14em] text-cream/35">
            <Link href="/" className="transition-colors hover:text-cream">
              Return to storefront
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-cream"
            >
              Customer sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
