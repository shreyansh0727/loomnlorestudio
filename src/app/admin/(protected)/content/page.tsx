import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  PanelsTopLeft,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { getAdminHomepageSections, getAdminPopupOffers } from "@/lib/data/admin";
import {
  deleteHomepageSectionAction,
  deletePopupAction,
  moveHomepageSectionAction,
  toggleHomepageSectionAction,
  togglePopupAction,
} from "@/lib/actions/admin/content";
import {
  AdminPageHeader,
  DataTable,
  Panel,
  Pill,
  Td,
  Th,
} from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { FormMessage } from "@/components/ui/form";
import { HOMEPAGE_SECTION_LABELS } from "@/lib/constants";
import { formatDate, isScheduleActive } from "@/lib/utils";

export const metadata: Metadata = { title: "Homepage & popups" };

function scheduleLabel(startsAt: string | null, endsAt: string | null) {
  if (!startsAt && !endsAt) return "Always on";
  if (startsAt && endsAt) return `${formatDate(startsAt)} – ${formatDate(endsAt)}`;
  if (startsAt) return `From ${formatDate(startsAt)}`;
  return `Until ${formatDate(endsAt)}`;
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; popupSaved?: string }>;
}) {
  const [params, sections, popups] = await Promise.all([
    searchParams,
    getAdminHomepageSections(),
    getAdminPopupOffers(),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Storefront"
        title="Homepage & popups"
        description="Compose the homepage from ordered sections — hero, offers, rails and stories. Popups are managed alongside them."
        actions={
          <>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 border border-line bg-cream px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              View homepage
            </Link>
            <Link
              href="/admin/content/new"
              className="inline-flex items-center gap-1.5 bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
            >
              <Plus className="size-3.5" aria-hidden />
              Add section
            </Link>
          </>
        }
      />

      {params.saved ? (
        <div className="mt-6">
          <FormMessage
            tone="success"
            message="Homepage section saved. The storefront has been refreshed."
          />
        </div>
      ) : null}
      {params.popupSaved ? (
        <div className="mt-6">
          <FormMessage
            tone="success"
            message="Popup saved. It will appear according to its schedule and frequency."
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        <Panel
          title="Homepage sections"
          description="Sections render in this order. Hide one instead of deleting it when you want to bring it back later."
          bodyClassName="pt-4"
        >
          {sections.length ? (
            <DataTable minWidth="min-w-[820px]">
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Section</Th>
                  <Th>Schedule</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Arrange</Th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section, index) => {
                  const live =
                    section.is_active &&
                    isScheduleActive(section.starts_at, section.ends_at);
                  const scheduled =
                    section.is_active &&
                    !live &&
                    Boolean(section.starts_at) &&
                    new Date(section.starts_at as string) > new Date();
                  return (
                    <tr key={section.id} className="group">
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center border border-line text-[0.62rem] font-semibold text-muted">
                            {index + 1}
                          </span>
                          <div className="flex flex-col gap-1">
                            <ActionButton
                              action={moveHomepageSectionAction}
                              fields={{ id: section.id, direction: "up" }}
                              variant="ghost"
                              size="sm"
                              className="size-6 border border-line p-0"
                              pendingLabel=""
                            >
                              <ArrowUp className="size-3" aria-hidden />
                            </ActionButton>
                            <ActionButton
                              action={moveHomepageSectionAction}
                              fields={{ id: section.id, direction: "down" }}
                              variant="ghost"
                              size="sm"
                              className="size-6 border border-line p-0"
                              pendingLabel=""
                            >
                              <ArrowDown className="size-3" aria-hidden />
                            </ActionButton>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/content/${section.id}`}
                          className="font-medium transition-colors group-hover:text-clay-deep"
                        >
                          {section.title || HOMEPAGE_SECTION_LABELS[section.section_type]}
                        </Link>
                        <p className="text-[0.64rem] uppercase tracking-[0.1em] text-muted">
                          {HOMEPAGE_SECTION_LABELS[section.section_type]}
                        </p>
                      </Td>
                      <Td className="whitespace-nowrap text-[0.68rem] text-muted">
                        {scheduleLabel(section.starts_at, section.ends_at)}
                      </Td>
                      <Td>
                        {live ? (
                          <Pill tone="positive">Live</Pill>
                        ) : scheduled ? (
                          <Pill tone="warning">Scheduled</Pill>
                        ) : section.is_active ? (
                          <Pill tone="danger">Expired</Pill>
                        ) : (
                          <Pill>Hidden</Pill>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/content/${section.id}`}
                            className="inline-flex items-center gap-1 border border-line px-2.5 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                          >
                            <Pencil className="size-3" aria-hidden />
                            Edit
                          </Link>
                          <ActionButton
                            action={toggleHomepageSectionAction}
                            fields={{ id: section.id, nextActive: !section.is_active }}
                            variant="ghost"
                            size="sm"
                            className="border border-line px-2.5 py-1.5 text-[0.56rem]"
                            pendingLabel="Saving"
                          >
                            {section.is_active ? "Hide" : "Show"}
                          </ActionButton>
                          <ActionButton
                            action={deleteHomepageSectionAction}
                            fields={{ id: section.id }}
                            variant="ghost"
                            size="sm"
                            className="border border-line px-2 py-1.5 text-[0.56rem] hover:border-red-900 hover:text-red-900"
                            confirmMessage={`Remove the "${HOMEPAGE_SECTION_LABELS[section.section_type]}" section? This cannot be undone.`}
                            pendingLabel=""
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </ActionButton>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <PanelsTopLeft className="size-7 text-clay" aria-hidden />
              <p className="mt-4 font-serif text-xl font-light tracking-[-0.02em]">
                The homepage is ready for its first section
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Start with a hero, then add offers, category tiles and product rails.
                The storefront composes them in order.
              </p>
              <Link
                href="/admin/content/new"
                className="mt-6 bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
              >
                Add section
              </Link>
            </div>
          )}
        </Panel>

        <Panel
          title="Popup offers"
          description="A single popup is shown at a time, using priority and schedule."
          actions={
            <Link
              href="/admin/content/popups/new"
              className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
            >
              <Plus className="size-3" aria-hidden />
              New popup
            </Link>
          }
          bodyClassName="divide-y divide-line/70 pt-1"
        >
          {popups.length ? (
            popups.map((popup) => (
              <div key={popup.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/content/popups/${popup.id}`}
                      className="font-medium transition-colors hover:text-clay-deep"
                    >
                      {popup.headline}
                    </Link>
                    {popup.is_active ? (
                      <Pill tone="positive">Active</Pill>
                    ) : (
                      <Pill>Paused</Pill>
                    )}
                    {popup.coupon_code ? <Pill tone="info">{popup.coupon_code}</Pill> : null}
                  </div>
                  <p className="mt-1 max-w-xl truncate text-[0.7rem] text-muted">
                    {popup.body}
                  </p>
                  <p className="mt-1 text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                    {popup.frequency.replaceAll("_", " ")} · {popup.delay_seconds}s delay ·
                    priority {popup.priority} · {scheduleLabel(popup.starts_at, popup.ends_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/content/popups/${popup.id}`}
                    className="border border-line px-2.5 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                  >
                    Edit
                  </Link>
                  <ActionButton
                    action={togglePopupAction}
                    fields={{ id: popup.id, nextActive: !popup.is_active }}
                    variant="ghost"
                    size="sm"
                    className="border border-line px-2.5 py-1.5 text-[0.56rem]"
                    pendingLabel="Saving"
                  >
                    {popup.is_active ? "Pause" : "Activate"}
                  </ActionButton>
                  <ActionButton
                    action={deletePopupAction}
                    fields={{ id: popup.id }}
                    variant="ghost"
                    size="sm"
                    className="border border-line px-2 py-1.5 text-[0.56rem] hover:border-red-900 hover:text-red-900"
                    confirmMessage="Remove this popup? This cannot be undone."
                    pendingLabel=""
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </ActionButton>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-sm text-muted">
              No popups yet. A welcome offer or a quiet launch note works well here.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
