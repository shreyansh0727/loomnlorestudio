import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, KeyRound, ShieldCheck } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const viewer = await requireViewer("/account/profile");
  const user = viewer.user;
  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="border-b border-line pb-5">
        <p className="eyebrow text-clay">Your details</p>
        <h2 className="mt-2 font-serif text-[clamp(2rem,3.5vw,3rem)] font-light leading-[1.05] tracking-[-0.035em]">
          Keep the thread current.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          These details prefill your delivery addresses. Account changes are kept simple —
          write to the studio if you need to change your sign-in email.
        </p>
      </div>

      {params.saved === "1" ? (
        <FormMessage tone="success" message="Your profile details have been saved." />
      ) : null}

      <section className="border border-line bg-cream p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <h3 className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Personal details
          </h3>
          {user.emailConfirmed ? (
            <Badge tone="sage">
              <BadgeCheck className="size-3" strokeWidth={2} />
              Email verified
            </Badge>
          ) : (
            <Badge tone="clay">Email not verified</Badge>
          )}
        </div>
        <ProfileForm
          fullName={viewer.profile?.full_name ?? ""}
          phone={viewer.profile?.phone ?? ""}
          email={user.email ?? ""}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="border border-line bg-cream p-5">
          <KeyRound className="size-4 text-clay" strokeWidth={1.5} />
          <h3 className="mt-3 font-serif text-xl">Password</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Send yourself a secure link to choose a new password. Existing sessions on other
            devices are not affected.
          </p>
          <Link
            href="/forgot-password"
            className="link-underline mt-3 inline-block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-clay"
          >
            Send a reset link
          </Link>
        </div>
        <div className="border border-line bg-cream p-5">
          <ShieldCheck className="size-4 text-sage" strokeWidth={1.5} />
          <h3 className="mt-3 font-serif text-xl">Privacy &amp; invoices</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Retail invoices are issued for personal orders. Approved trade accounts receive a
            GST invoice with their registered business details.
          </p>
          <Link
            href="/policies#privacy"
            className="link-underline mt-3 inline-block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-clay"
          >
            Read the privacy note
          </Link>
        </div>
      </section>
    </div>
  );
}
