import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { listAdminDrafts } from "@/lib/data/admin-drafts";
import { deleteAdminDraftAction } from "@/lib/actions/admin/drafts";
import { DRAFT_KIND_LABELS, resumeDraftHref } from "@/lib/drafts";
import { AdminPageHeader, DataTable, Panel, Pill, Td, Th } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Drafts" };

export default async function AdminDraftsPage() {
  const drafts = await listAdminDrafts();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Studio"
        title="Drafts"
        description="Unfinished work saved automatically from the studio. Open a draft to carry on, or discard it when it is no longer needed."
      />

      <div className="mt-6">
        <Panel bodyClassName="pt-4">
          {drafts.length ? (
            <DataTable minWidth="min-w-[720px]">
              <thead>
                <tr>
                  <Th>Draft</Th>
                  <Th>Kind</Th>
                  <Th>Last edited</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.id} className="group">
                    <Td>
                      <p className="max-w-[24rem] truncate font-medium">
                        {draft.label || "Untitled draft"}
                      </p>
                      <p className="text-[0.66rem] text-muted">Not published</p>
                    </Td>
                    <Td>
                      <Pill tone="warning">{DRAFT_KIND_LABELS[draft.kind]}</Pill>
                    </Td>
                    <Td className="whitespace-nowrap text-[0.72rem] text-muted">
                      {formatDateTime(draft.updated_at)}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={resumeDraftHref(draft)}
                          className="inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                        >
                          Continue
                          <ArrowRight className="size-3" aria-hidden />
                        </Link>
                        <ActionButton
                          action={deleteAdminDraftAction}
                          fields={{ id: draft.id }}
                          variant="ghost"
                          size="sm"
                          className="border border-line px-2.5 py-1.5 text-[0.56rem]"
                          pendingLabel="Discarding"
                          confirmMessage="Discard this draft? The work inside it will be lost."
                        >
                          Discard
                        </ActionButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <FileText className="size-7 text-clay" aria-hidden />
              <p className="mt-4 font-serif text-2xl font-light tracking-[-0.02em]">
                Nothing in progress
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Drafts appear here automatically when you start adding a product,
                coupon, bundle, homepage section or popup and leave before finishing.
              </p>
              <Link
                href="/admin/products/new"
                className="mt-6 inline-flex items-center gap-1.5 bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
              >
                Add a product
              </Link>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
