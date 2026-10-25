import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/content";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { FormMessage } from "@/components/ui/form";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Sign in",
    description: `Sign in to follow your orders at ${settings.brandName}.`,
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const viewer = await getViewer();
  if (viewer.user) redirect(next);

  const notice =
    params.error === "auth-link"
      ? "That link is invalid or has expired. Sign in below, or request a fresh link."
      : undefined;

  return (
    <AuthShell
      eyebrow="Your account"
      title="Welcome back."
      description="Sign in to follow your orders, keep your delivery details close and manage a trade account."
      image="/images/buniya/hero/pastel-bows.jpg"
      imageAlt="Pastel satin bows and scrunchies on a soft table"
      quote="Little things, chosen with care and kept for years."
      notice={
        !isSupabaseConfigured ? (
          <FormMessage
            tone="info"
            message="Accounts need your Supabase keys. Add them to .env.local to enable sign-in. Guest checkout will stay available."
          />
        ) : undefined
      }
      footer={
        <div className="flex flex-col gap-3">
          <p>
            New to Buniya?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className="link-underline font-semibold text-ink"
            >
              Create an account
            </Link>
          </p>
          <p>
            Just browsing?{" "}
            <Link href="/shop" className="link-underline text-ink-soft">
              Continue as a guest
            </Link>
          </p>
        </div>
      }
    >
      <LoginForm next={next} notice={notice} />
    </AuthShell>
  );
}
