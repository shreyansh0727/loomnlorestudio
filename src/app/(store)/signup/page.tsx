import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a Loom & Lore account to follow orders, or check out as a guest.",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const viewer = await getViewer();
  if (viewer.user) redirect(next);

  return (
    <AuthShell
      eyebrow="Create an account"
      title="Keep a thread to your orders."
      description="An account keeps your purchases, delivery details and trade status in one place. It is optional — you can always check out as a guest."
      image="/images/editorial/weaving-detail.jpg"
      imageAlt="Close view of a handloom warp and weft threads"
      quote="A slower kind of shopping, with a record of everything you chose."
      notice={
        !isSupabaseConfigured ? (
          <FormMessage
            tone="info"
            message="Accounts need your Supabase keys. Add them to .env.local to enable sign-up. Guest checkout will stay available."
          />
        ) : undefined
      }
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="link-underline font-semibold text-ink"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
