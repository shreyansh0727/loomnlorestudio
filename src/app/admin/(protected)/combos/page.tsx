import type { Metadata } from "next";
import Link from "next/link";
import { Boxes } from "lucide-react";
import { getAdminCombos } from "@/lib/data/admin";
import { toggleComboActiveAction } from "@/lib/actions/admin/promotions";
import {
  AdminPageHeader,
  DataTable,
  Panel,
  Pill,
  Td,
  Th,
} from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { SafeImage } from "@/components/ui/safe-image";
import { FormMessage } from "@/components/ui/form";
import type { Combo } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Combos" };

function audienceLabel(combo: Combo) {
  if (combo.audience === "all") return "All buyers";
  return combo.audience === "b2b" ? "Trade only" : "Retail only";
}

export default async function AdminCombosPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ saved }, combos] = await Promise.all([searchParams, getAdminCombos()]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title="Combos"
        description="Fixed bundles at a set price. Stock is checked across each piece when a bundle is bought."
        actions={
          <Link
            href="/admin/combos/new"
            className="bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
          >
            New bundle
          </Link>
        }
      />

      {saved ? (
        <div className="mt-6">
          <FormMessage
            tone="success"
            message={`Bundle "${saved}" saved. The storefront and offers page are refreshed.`}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <Panel bodyClassName="pt-4">
          {combos.length ? (
            <DataTable minWidth="min-w-[940px]">
              <thead>
                <tr>
                  <Th>Bundle</Th>
                  <Th>Contents</Th>
                  <Th>Retail value</Th>
                  <Th>Bundle price</Th>
                  <Th>Audience</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {combos.map((combo) => {
                  const retailValue = combo.retail_value ?? 0;
                  const saving = retailValue - combo.bundle_price;
                  return (
                    <tr key={combo.id} className="group">
                      <Td>
                        <div className="flex items-center gap-3">
                          <div className="relative size-11 shrink-0 overflow-hidden border border-line bg-sand">
                            <SafeImage src={combo.image_url} alt={combo.title} sizes="44px" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/combos/${combo.id}`}
                              className="block max-w-[16rem] truncate font-medium transition-colors group-hover:text-clay-deep"
                            >
                              {combo.title}
                            </Link>
                            <p className="max-w-[16rem] truncate text-[0.66rem] text-muted">
                              {combo.slug}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-[0.72rem]">
                        {combo.items.length} {combo.items.length === 1 ? "piece" : "pieces"}
                        <span className="block text-[0.62rem] text-muted">
                          {combo.items.reduce((total, item) => total + item.quantity, 0)}{" "}
                          units total
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-[0.72rem] text-muted">
                        {formatMoney(retailValue)}
                      </Td>
                      <Td className="whitespace-nowrap text-[0.72rem]">
                        {formatMoney(combo.bundle_price)}
                        {saving > 0 ? (
                          <span className="block text-[0.62rem] text-sage">
                            Saves {formatMoney(saving)}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="text-[0.72rem] text-ink-soft">
                        {audienceLabel(combo)}
                      </Td>
                      <Td>
                        {combo.is_active ? (
                          <Pill tone="positive">Active</Pill>
                        ) : (
                          <Pill>Paused</Pill>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/combos/${combo.id}`}
                            className="border border-line px-2.5 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                          >
                            Edit
                          </Link>
                          <ActionButton
                            action={toggleComboActiveAction}
                            fields={{ id: combo.id, nextActive: !combo.is_active }}
                            variant="ghost"
                            size="sm"
                            className="border border-line px-2.5 py-1.5 text-[0.56rem]"
                            pendingLabel="Saving"
                          >
                            {combo.is_active ? "Pause" : "Activate"}
                          </ActionButton>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Boxes className="size-7 text-clay" aria-hidden />
              <p className="mt-4 font-serif text-2xl font-light tracking-[-0.02em]">
                No bundles yet
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                Group pieces into a considered set — two runners and napkins, or a
                fabric-and-thread pairing — at a single bundle price.
              </p>
              <Link
                href="/admin/combos/new"
                className="mt-6 bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
              >
                New bundle
              </Link>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
