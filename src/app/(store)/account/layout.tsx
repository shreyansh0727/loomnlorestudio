import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { getMyBusiness } from "@/lib/data/account";
import { signOutAction } from "@/lib/actions/auth";
import { AccountNav } from "@/components/account/account-nav";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireViewer("/account");
  const user = viewer.user;
  if (!user) return null;

  const business = await getMyBusiness(user.id);
  const name = viewer.profile?.full_name?.trim();
  const greeting = name ? name.split(" ")[0] : user.email?.split("@")[0] ?? "there";

  return (
    <div className="editorial-container py-10 lg:py-14">
      <header className="flex flex-col gap-6 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-clay">Your account</p>
          <h1 className="mt-3 font-serif text-[clamp(2.5rem,4.5vw,3.8rem)] font-light leading-[1] tracking-[-0.045em]">
            Hello, {greeting}.
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            {user.email}
            {business?.status === "approved" ? (
              <Badge tone="sage">Trade account</Badge>
            ) : business?.status === "pending" ? (
              <Badge tone="clay">Trade review</Badge>
            ) : null}
          </p>
          {viewer.profile?.created_at ? (
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.12em] text-muted">
              With the studio since {formatDate(viewer.profile.created_at, { month: "long", year: "numeric" })}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="text-[0.63rem] font-semibold uppercase tracking-[0.15em] text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Continue shopping
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-2 border border-line px-3 text-[0.6rem] font-semibold uppercase tracking-[0.13em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              <LogOut className="size-3.5" strokeWidth={1.5} />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:pt-1">
          <AccountNav isAdmin={viewer.isAdmin} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
