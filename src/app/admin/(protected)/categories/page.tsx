import type { Metadata } from "next";
import Link from "next/link";
import { FolderTree, Plus, Trash2 } from "lucide-react";
import { getAdminCategories } from "@/lib/data/admin";
import { deleteCategoryAction } from "@/lib/actions/admin/catalog";
import {
  AdminPageHeader,
  DataTable,
  Panel,
  Pill,
  Td,
  Th,
} from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { CategoryForm } from "@/components/admin/catalog-forms";
import { SafeImage } from "@/components/ui/safe-image";
import { FormMessage } from "@/components/ui/form";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const categories = await getAdminCategories();
  const editing = params.edit
    ? categories.find((category) => category.id === params.edit) ?? null
    : null;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Categories"
        description="The shelves of the shop. Order them here to control navigation and the homepage grid."
        actions={
          <Link
            href="/admin/categories#category-form"
            className="inline-flex items-center gap-1.5 bg-ink px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep"
          >
            <Plus className="size-3.5" aria-hidden />
            New category
          </Link>
        }
      />

      {params.saved ? (
        <div className="mt-6">
          <FormMessage
            tone="success"
            message={`"${params.saved}" was saved. The storefront navigation is up to date.`}
          />
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Panel
          title={`${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
          bodyClassName="pt-4"
        >
          {categories.length ? (
            <DataTable minWidth="min-w-[620px]">
              <thead>
                <tr>
                  <Th>Category</Th>
                  <Th>Products</Th>
                  <Th>Order</Th>
                  <Th>Visibility</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="group">
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden border border-line bg-sand">
                          <SafeImage
                            src={category.image_url}
                            alt={category.name}
                            sizes="40px"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/categories?edit=${category.id}#category-form`}
                            className="block max-w-[16rem] truncate font-medium transition-colors group-hover:text-clay-deep"
                          >
                            {category.name}
                          </Link>
                          <p className="max-w-[16rem] truncate text-[0.66rem] text-muted">
                            /{category.slug}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-[0.72rem]">{category.product_count}</Td>
                    <Td className="text-[0.72rem] text-muted">{category.sort_order}</Td>
                    <Td>
                      {category.is_active ? (
                        <Pill tone="positive">Visible</Pill>
                      ) : (
                        <Pill>Hidden</Pill>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/categories?edit=${category.id}#category-form`}
                          className="border border-line px-2.5 py-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                        >
                          Edit
                        </Link>
                        {category.product_count > 0 ? (
                          <span className="px-1.5 text-[0.56rem] uppercase tracking-[0.1em] text-muted">
                            In use
                          </span>
                        ) : (
                          <ActionButton
                            action={deleteCategoryAction}
                            fields={{ id: category.id }}
                            variant="ghost"
                            size="sm"
                            className="border border-line px-2.5 py-1.5 text-[0.56rem] hover:border-red-900 hover:text-red-900"
                            confirmMessage={`Remove the "${category.name}" category? This cannot be undone.`}
                            pendingLabel="Removing"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Delete
                          </ActionButton>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <FolderTree className="size-7 text-clay" aria-hidden />
              <p className="mt-4 font-serif text-xl font-light tracking-[-0.02em]">
                No categories yet
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Create shelves like Fabrics, Table linen or Ready-made so customers can
                browse with ease.
              </p>
            </div>
          )}
        </Panel>

        <div id="category-form" className="scroll-mt-24 self-start xl:sticky xl:top-6">
          <Panel
            title={editing ? `Edit ${editing.name}` : "Add a category"}
            description={
              editing
                ? "Update the details, or cancel to add a new category instead."
                : "New categories appear in navigation once visible."
            }
          >
            <CategoryForm key={editing?.id ?? "new"} category={editing} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
