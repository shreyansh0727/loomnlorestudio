import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/data/content";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FormMessage } from "@/components/ui/form";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Reset your password",
    description: `Request a secure password reset link for your ${settings.brandName} account.`,
    robots: { index: false, follow: false },
  };
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="A fresh key."
      description="Enter the email on your account and we will send a secure link to set a new password."
      image="/images/buniya/editorial/ribbon-detail.jpg"
      imageAlt="Ribbon and pearl detail on a handmade bow"
      quote="A little patience, and everything finds its place."
      notice={
        !isSupabaseConfigured ? (
          <FormMessage
            tone="info"
            message="Account recovery needs your Supabase keys. Add them to .env.local to enable this flow."
          />
        ) : undefined
      }
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="link-underline font-semibold text-ink">
            Return to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
