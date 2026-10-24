import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a secure password reset link for your Loom & Lore account.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="A fresh key."
      description="Enter the email on your account and we will send a secure link to set a new password."
      image="/images/texture-detail.jpg"
      imageAlt="Closely woven natural cloth in warm light"
      quote="Good cloth, like a good account, is worth keeping in order."
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
