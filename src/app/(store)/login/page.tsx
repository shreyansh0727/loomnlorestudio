import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to follow your orders at Loom & Lore.",
  robots: { index: false, follow: false },
};

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
      image="/images/editorial/atelier.jpg"
      imageAlt="A quiet textile studio with cloth resting on a long wooden table"
      quote="The pieces you keep should remember the hands that made them."
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
            New to the studio?{" "}
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
