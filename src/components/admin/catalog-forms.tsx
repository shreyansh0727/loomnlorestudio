"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import {
  saveCategoryAction,
  saveProductAction,
} from "@/lib/actions/admin/catalog";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import type { Category, Product } from "@/lib/types";
import { PRODUCT_UNITS } from "@/lib/constants";
import { parseRupeesToPaise, paiseToRupeeInput } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Checkbox,
  Field,
  FormMessage,
  Input,
  Select,
  Textarea,
} from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImageListEditor, MediaUrlField } from "@/components/admin/media";
import { Panel } from "@/components/admin/ui";

interface EditorVariant {
  key: string;
  id: string | null;
  label: string;
  sku: string;
  stockQty: string;
  retailOverride: string;
  wholesaleOverride: string;
  isActive: boolean;
}

function toEditorVariants(product?: Product | null): EditorVariant[] {
  if (!product?.variants.length) {
    return [
      {
        key: "new-1",
        id: null,
        label: "",
        sku: "",
        stockQty: "0",
        retailOverride: "",
        wholesaleOverride: "",
        isActive: true,
      },
    ];
  }
  return [...product.variants]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((variant) => ({
      key: variant.id,
      id: variant.id,
      label: variant.label,
      sku: variant.sku ?? "",
      stockQty: String(variant.stock_qty),
      retailOverride: paiseToRupeeInput(variant.retail_price_override),
      wholesaleOverride: paiseToRupeeInput(variant.wholesale_price_override),
      isActive: variant.is_active,
    }));
}

export function ProductEditor({
  product,
  categories,
}: {
  product?: Product | null;
  categories: Category[];
}) {
  const [state, formAction] = useActionState(saveProductAction, INITIAL_FORM_STATE);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [tagsText, setTagsText] = useState((product?.tags ?? []).join(", "));
  const [variants, setVariants] = useState<EditorVariant[]>(() =>
    toEditorVariants(product),
  );

  const tags = Array.from(
    new Set(
      tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  );

  const variantsPayload = variants.map((variant) => ({
    id: variant.id,
    label: variant.label.trim(),
    sku: variant.sku.trim() || null,
    stockQty: Math.max(0, Number.parseInt(variant.stockQty || "0", 10) || 0),
    retailOverride: variant.retailOverride.trim()
      ? parseRupeesToPaise(variant.retailOverride)
      : null,
    wholesaleOverride: variant.wholesaleOverride.trim()
      ? parseRupeesToPaise(variant.wholesaleOverride)
      : null,
    isActive: variant.isActive,
  }));

  function updateVariant(index: number, patch: Partial<EditorVariant>) {
    setVariants((current) =>
      current.map((variant, position) =>
        position === index ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        id: null,
        label: "",
        sku: "",
        stockQty: "0",
        retailOverride: "",
        wholesaleOverride: "",
        isActive: true,
      },
    ]);
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, position) => position !== index));
  }

  return (
    <form action={formAction} className="mt-7">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      <input type="hidden" name="variants" value={JSON.stringify(variantsPayload)} />

      {state.status === "error" ? (
        <div className="mb-5">
          <FormMessage message={state.message} tone="error" />
        </div>
      ) : null}

      {!categories.length ? (
        <div className="mb-5">
          <FormMessage
            tone="info"
            message="Create a category before adding products. Categories keep the catalog and storefront navigation tidy."
          />
          <Link
            href="/admin/categories"
            className="mt-3 inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-clay-deep hover:text-ink"
          >
            Manage categories
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="The piece" description="How it appears across the storefront." bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" htmlFor="name" required className="sm:col-span-2">
                <Input
                  id="name"
                  name="name"
                  defaultValue={product?.name ?? ""}
                  maxLength={140}
                  placeholder="Handwoven linen throw"
                  required
                />
              </Field>
              <Field
                label="Slug"
                htmlFor="slug"
                hint="Leave blank to generate it from the name."
              >
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={product?.slug ?? ""}
                  placeholder="handwoven-linen-throw"
                />
              </Field>
              <Field label="Category" htmlFor="categoryId" required>
                <Select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={product?.category_id ?? ""}
                  required
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      {category.is_active ? "" : " (hidden)"}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Short description"
                htmlFor="shortDescription"
                hint="Shown on cards and collection tiles."
                className="sm:col-span-2"
              >
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  defaultValue={product?.short_description ?? ""}
                  maxLength={240}
                  placeholder="A softened linen with a quiet, slubby texture."
                />
              </Field>
              <Field
                label="Description"
                htmlFor="description"
                className="sm:col-span-2"
                hint="Materials, dimensions, care notes and the story."
              >
                <Textarea
                  id="description"
                  name="description"
                  rows={9}
                  maxLength={8000}
                  defaultValue={product?.description ?? ""}
                />
              </Field>
            </div>
          </Panel>

          <Panel
            title="Images"
            description="The first image becomes the cover. Order matters."
          >
            <ImageListEditor
              value={images}
              onChange={setImages}
              folder="catalog"
            />
          </Panel>

          <Panel
            title="Variants"
            description="Sizes, colours, lengths or cuts. Each variant carries its own stock."
            actions={
              <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
                <Plus className="size-3.5" aria-hidden />
                Add variant
              </Button>
            }
            bodyClassName="space-y-4"
          >
            {variants.map((variant, index) => (
              <div key={variant.key} className="border border-line bg-paper/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted">
                    Variant {index + 1}
                    {variant.id ? " · saved" : " · new"}
                  </p>
                  {variants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="inline-flex items-center gap-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-red-900"
                    >
                      <Trash2 className="size-3" aria-hidden />
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Label" htmlFor={`variant-label-${index}`} required>
                    <Input
                      id={`variant-label-${index}`}
                      value={variant.label}
                      onChange={(event) =>
                        updateVariant(index, { label: event.target.value })
                      }
                      placeholder="Natural / 130×180 cm"
                      maxLength={80}
                      required
                    />
                  </Field>
                  <Field label="SKU" htmlFor={`variant-sku-${index}`}>
                    <Input
                      id={`variant-sku-${index}`}
                      value={variant.sku}
                      onChange={(event) => updateVariant(index, { sku: event.target.value })}
                      placeholder="LL-LIN-NAT"
                      maxLength={60}
                    />
                  </Field>
                  <Field label="Stock" htmlFor={`variant-stock-${index}`} required>
                    <Input
                      id={`variant-stock-${index}`}
                      type="number"
                      min="0"
                      step="1"
                      value={variant.stockQty}
                      onChange={(event) =>
                        updateVariant(index, { stockQty: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field
                    label="Retail override (₹)"
                    htmlFor={`variant-retail-${index}`}
                    hint="Blank uses the base price."
                  >
                    <Input
                      id={`variant-retail-${index}`}
                      inputMode="decimal"
                      value={variant.retailOverride}
                      onChange={(event) =>
                        updateVariant(index, { retailOverride: event.target.value })
                      }
                      placeholder="Optional"
                    />
                  </Field>
                  <Field
                    label="Wholesale override (₹)"
                    htmlFor={`variant-wholesale-${index}`}
                    hint="Blank uses the base wholesale price."
                    className="sm:col-span-2 lg:col-span-3"
                  >
                    <Input
                      id={`variant-wholesale-${index}`}
                      inputMode="decimal"
                      value={variant.wholesaleOverride}
                      onChange={(event) =>
                        updateVariant(index, { wholesaleOverride: event.target.value })
                      }
                      placeholder="Optional"
                    />
                  </Field>
                  <div className="flex items-end pb-2.5">
                    <Checkbox
                      label="Available"
                      checked={variant.isActive}
                      onChange={(event) =>
                        updateVariant(index, { isActive: event.target.checked })
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-[0.68rem] leading-relaxed text-muted">
              Removing a saved variant retires it rather than deleting its history, so
              past orders stay intact.
            </p>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Pricing" description="All amounts are tax-inclusive, in rupees." bodyClassName="space-y-4">
            <Field label="Retail price (₹)" htmlFor="retailPrice" required>
              <Input
                id="retailPrice"
                name="retailPrice"
                inputMode="decimal"
                defaultValue={paiseToRupeeInput(product?.retail_price)}
                placeholder="2450"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Compare-at (₹)" htmlFor="compareAtPrice" hint="Shown struck through.">
                <Input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  inputMode="decimal"
                  defaultValue={paiseToRupeeInput(product?.compare_at_price)}
                  placeholder="Optional"
                />
              </Field>
              <Field
                label="Wholesale (₹)"
                htmlFor="wholesalePrice"
                hint="Approved trade buyers."
              >
                <Input
                  id="wholesalePrice"
                  name="wholesalePrice"
                  inputMode="decimal"
                  defaultValue={paiseToRupeeInput(product?.wholesale_price)}
                  placeholder="Optional"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Trade MOQ" htmlFor="moq" hint="Minimum wholesale units.">
                <Input
                  id="moq"
                  name="moq"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={product?.moq ?? 1}
                />
              </Field>
              <Field label="Sold by" htmlFor="unit">
                <Select id="unit" name="unit" defaultValue={product?.unit ?? "piece"}>
                  {PRODUCT_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel title="Merchandising" description="Where this piece appears." bodyClassName="space-y-4">
            <Field
              label="Tags"
              htmlFor="tags"
              hint="Comma separated, up to 12. Used for filtering and search."
            >
              <Input
                id="tags"
                value={tagsText}
                onChange={(event) => setTagsText(event.target.value)}
                placeholder="linen, natural dye, table"
              />
            </Field>
            {tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-line bg-paper px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.08em] text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="space-y-2.5 border-t border-line pt-4">
              <Checkbox name="isActive" label="Visible on the storefront" defaultChecked={product?.is_active ?? true} />
              <Checkbox name="isFeatured" label="Featured in curated rails" defaultChecked={product?.is_featured ?? false} />
              <Checkbox name="isNewArrival" label="Mark as a new arrival" defaultChecked={product?.is_new_arrival ?? false} />
              <Checkbox name="isBestSeller" label="Mark as a best seller" defaultChecked={product?.is_best_seller ?? false} />
            </div>
          </Panel>

          <Panel bodyClassName="space-y-3">
            <SubmitButton className="w-full" pendingLabel="Saving product">
              {product ? "Save changes" : "Create product"}
            </SubmitButton>
            <Link
              href="/admin/products"
              className="flex h-11 items-center justify-center border border-line text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:border-ink hover:text-ink"
            >
              Cancel
            </Link>
            {product ? (
              <p className="pt-1 text-center text-[0.62rem] text-muted">
                Editing <span className="font-medium text-ink-soft">{product.name}</span>
              </p>
            ) : null}
          </Panel>
        </div>
      </div>
    </form>
  );
}

export function CategoryForm({ category }: { category?: Category | null }) {
  const [state, formAction] = useActionState(saveCategoryAction, INITIAL_FORM_STATE);
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="category-name" required>
          <Input
            id="category-name"
            name="name"
            defaultValue={category?.name ?? ""}
            placeholder="Table linen"
            maxLength={80}
            required
          />
        </Field>
        <Field
          label="Slug"
          htmlFor="category-slug"
          hint="Leave blank to generate it from the name."
        >
          <Input
            id="category-slug"
            name="slug"
            defaultValue={category?.slug ?? ""}
            placeholder="table-linen"
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="category-description">
        <Textarea
          id="category-description"
          name="description"
          rows={3}
          maxLength={600}
          defaultValue={category?.description ?? ""}
          placeholder="A short line used on the shop and collection pages."
        />
      </Field>

      <MediaUrlField
        label="Category image"
        value={imageUrl}
        onChange={setImageUrl}
        folder="categories"
        hint="Landscape images work best in the category grid."
      />

      <div className="grid items-end gap-4 sm:grid-cols-2">
        <Field label="Sort order" htmlFor="category-sort" hint="Lower numbers appear first.">
          <Input
            id="category-sort"
            name="sortOrder"
            type="number"
            min="0"
            step="1"
            defaultValue={category?.sort_order ?? 0}
          />
        </Field>
        <div className="pb-2.5">
          <Checkbox
            name="isActive"
            label="Visible in navigation and filters"
            defaultChecked={category?.is_active ?? true}
          />
        </div>
      </div>

      {state.status === "error" ? (
        <FormMessage message={state.message} tone="error" />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel={category ? "Saving" : "Creating"}>
          {category ? "Save category" : "Create category"}
        </SubmitButton>
        {category ? (
          <Link
            href="/admin/categories"
            className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            Cancel editing
          </Link>
        ) : null}
      </div>
    </form>
  );
}
