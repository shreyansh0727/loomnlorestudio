import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { getAdminBusinesses } from "@/lib/data/admin";
import { AdminPageHeader, Panel, Pill } from "@/components/admin/ui";
import { BusinessReviewForm } from "@/components/admin/business-form";
import { formatDate } from "@/lib/utils";
import type { Business, BusinessStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Trade accounts" };

const FILTERS: { value: BusinessStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Declined" },
  { value: "all", label: "All" },
];

function statusTone(status: BusinessStatus) {
  if (status === "approved") return "positive" as const;
  if (status === "pending") return "warning" as const;
  return "danger" as const;
}

function businessAddress(business: Business) {
  return [
    business.address_line1,
    business.address_line2,
    business.city,
    business.state,
    business.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status: BusinessStatus | "all" =
    params.status === "pending" ||
    params.status === "approved" ||
    params.status === "rejected" ||
    params.status === "all"
      ? params.status
      : "pending";

  const businesses = await getAdminBusinesses("all");
  const counts = businesses.reduce<Record<string, number>>((acc, business) => {
    acc[business.status] = (acc[business.status] ?? 0) + 1;
    return acc;
  }, {});
  const filtered =
    status === "all"
      ? businesses
      : businesses.filter((business) => business.status === status);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Trade"
        title="Trade accounts"
        description="Verify GST details and grant wholesale pricing. Approved buyers see trade prices and MOQs on the storefront."
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const count =
            filter.value === "all" ? businesses.length : (counts[filter.value] ?? 0);
          const active = status === filter.value;
          return (
            <Link
              key={filter.value}
              href={
                filter.value === "all"
                  ? "/admin/businesses?status=all"
                  : `/admin/businesses?status=${filter.value}`
              }
              className={
                active
                  ? "border border-ink bg-ink px-3.5 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-cream"
                  : "border border-line bg-cream px-3.5 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink"
              }
            >
              {filter.label}
              <span className={active ? "ml-2 text-cream/60" : "ml-2 text-muted"}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length ? (
          filtered.map((business) => (
            <Panel key={business.id} bodyClassName="space-y-5">
              <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-2xl font-light tracking-[-0.02em]">
                      {business.legal_name}
                    </h2>
                    <Pill tone={statusTone(business.status)}>{business.status}</Pill>
                  </div>
                  <p className="mt-1 text-[0.7rem] text-muted">
                    {business.trade_name ? `${business.trade_name} · ` : ""}
                    Submitted {formatDate(business.submitted_at)}
                    {business.reviewed_at
                      ? ` · reviewed ${formatDate(business.reviewed_at)}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm text-ink-soft">
                  <p className="flex items-start gap-2">
                    <Building2 className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden />
                    <span>
                      <span className="block text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                        GSTIN
                      </span>
                      {business.gstin}
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Mail className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden />
                    <span>
                      <span className="block text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                        Email
                      </span>
                      <a
                        href={`mailto:${business.email}`}
                        className="underline decoration-line underline-offset-2"
                      >
                        {business.email}
                      </a>
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Phone className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden />
                    <span>
                      <span className="block text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                        Phone
                      </span>
                      {business.phone}
                    </span>
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm text-ink-soft">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden />
                  <span>
                    <span className="block text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                      Registered address
                    </span>
                    {businessAddress(business)}
                  </span>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <BusinessReviewForm business={business} />
              </div>
            </Panel>
          ))
        ) : (
          <Panel>
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <Building2 className="size-7 text-clay" aria-hidden />
              <p className="mt-4 font-serif text-xl font-light tracking-[-0.02em]">
                {status === "pending"
                  ? "No applications waiting"
                  : `No ${status === "all" ? "" : status} applications`}
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Trade applications from the storefront land here with GST details and
                contact information. Approving one switches that buyer to wholesale
                pricing.
              </p>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
