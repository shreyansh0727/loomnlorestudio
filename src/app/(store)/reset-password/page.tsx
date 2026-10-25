import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/content";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormMessage } from "@/components/ui/form";
import { buttonStyles } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Choose a new password",
    description: `Set a new password for your ${settings.brandName} account.`,
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage() {
  const viewer = await getViewer();

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={viewer.user ? "Choose a new key." : "This link has expired."}
      description={
        viewer.user
          ? "Set a new password for your account. You will stay signed in on this device."
          : "Recovery links only work once and expire quickly. Request a fresh link to continue."
      }
      image="/images/buniya/hero/pastel-bows.jpg"
      imageAlt="Pastel satin bows and scrunchies on a soft table"
      quote="Every good thing returns to order, in its own time."
      notice={
        !isSupabaseConfigured ? (
          <FormMessage
            tone="info"
            message="Password recovery needs your Supabase keys. Add them to .env.local to enable this flow."
          />
        ) : undefined
      }
      footer={
        <p>
          Need a fresh link?{" "}
          <Link
            href="/forgot-password"
            className="link-underline font-semibold text-ink"
          >
            Request another
          </Link>
        </p>
      }
    >
      {viewer.user ? (
        <ResetPasswordForm />
      ) : (
        <Link href="/forgot-password" className={buttonStyles({ size: "lg" })}>
          Request a reset link
        </Link>
      )}
    </AuthShell>
  );
}
