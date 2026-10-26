import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/content";
import { isSupabaseConfigured } from "@/lib/env";
import { adminMfaNext, getAdminMfaState, isAdminMfaSatisfied } from "@/lib/mfa";
import { signOutAction } from "@/lib/actions/auth";
import { MfaChallengeForm } from "@/components/auth/mfa-challenge-form";
import { MfaEnrollForm } from "@/components/auth/mfa-enroll-form";
import { BrandMark } from "@/components/ui/brand-mark";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Two-step verification",
  robots: { index: false, follow: false },
};

export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/admin");

  const params = await searchParams;
  const next = adminMfaNext(params.next);
  const [viewer, settings, mfa] = await Promise.all([
    getViewer(),
    getSiteSettings(),
    getAdminMfaState(),
  ]);

  if (!viewer.user) {
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }
  if (!viewer.isAdmin) {
    redirect("/account?error=admin-access");
  }
  if (isAdminMfaSatisfied(mfa.currentLevel)) {
    redirect(next);
  }

  const enrolling = !mfa.verifiedFactorId;

  return (
    <div className="deep-surface min-h-dvh bg-ink text-cream">
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-12 sm:px-10">
        <Link href="/" className="inline-flex self-start" aria-label={`${settings.brandName} storefront`}>
          <BrandMark
            name={settings.brandName}
            logoUrl={settings.logoUrl}
            textClassName="text-[1.9rem] font-light text-cream"
            logoClassName="h-12 max-w-[13rem]"
            frameClassName="bg-cream px-3 py-2"
          />
        </Link>

        <p className="eyebrow mt-10 text-clay">Studio security</p>
        <h1 className="mt-4 font-serif text-[clamp(2.2rem,4.4vw,3.1rem)] font-light leading-[1.03] tracking-[-0.04em] text-cream">
          Two steps, then the studio.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/55">
          {enrolling
            ? "Admin access now needs an authenticator app. Connect one once, then use its 6-digit code each time you sign in."
            : "Your password is only the first step. Enter the current code from your authenticator app to open the studio."}
        </p>

        <div className="mt-8 border border-cream/15 bg-cream p-6 text-ink-soft shadow-lift [--color-red-800:#8a1f1f] [--color-red-900:#7f1d1d] sm:p-8">
          {mfa.verifiedFactorId ? (
            <MfaChallengeForm factorId={mfa.verifiedFactorId} next={next} />
          ) : (
            <MfaEnrollForm next={next} />
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-cream/10 pt-6 text-[0.62rem] uppercase tracking-[0.14em] text-cream/40">
          <p className="normal-case tracking-normal text-cream/50">
            Signed in as {viewer.user.email ?? "your admin account"}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 transition-colors hover:text-cream"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Sign out
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs leading-relaxed text-cream/35">
          Lost your authenticator? Whoever manages the Supabase project can remove
          the factor under Authentication → Users, then you can set up a new one.
        </p>
      </div>
    </div>
  );
}
