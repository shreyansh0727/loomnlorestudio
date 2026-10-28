"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import {
  saveComboAction,
  saveCouponAction,
} from "@/lib/actions/admin/promotions";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import type { Coupon, Combo, CouponDiscountType, DraftPayload } from "@/lib/types";
import type { AdminVariantOption } from "@/lib/data/admin";
import { draftFlag, draftJson, draftString } from "@/lib/drafts";
import {
  formatMoney,
  parseRupeesToPaise,
  paiseToRupeeInput,
  toDateTimeInput,
} from "@/lib/utils";
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
import { MediaUrlField } from "@/components/admin/media";
import { Panel } from "@/components/admin/ui";
import {
  DraftStatusBar,
  useDraftAutosave,
} from "@/components/admin/draft-autosave";

export function CouponForm({
  coupon,
  draft,
}: {
  coupon?: Coupon | null;
  draft?: { id: string; payload: DraftPayload } | null;
}) {
  const [state, formAction] = useActionState(saveCouponAction, INITIAL_FORM_STATE);
  const seed = draft?.payload ?? null;
  const formRef = useRef<HTMLFormElement>(null);
  const seededType = draftString(seed, "discountType");
  const [discountType, setDiscountType] = useState<CouponDiscountType>(
    seededType === "percentage" || seededType === "fixed"
      ? seededType
      : (coupon?.discount_type ?? "percentage"),
  );
  const draftState = useDraftAutosave(formRef, {
    kind: "coupon",
    initialDraftId: draft?.id ?? null,
    enabled: !coupon,
  });

  return (
    <form ref={formRef} action={formAction} className="mt-7">
      <input type="hidden" name="id" value={coupon?.id ?? ""} />
      {draftState.draftId ? (
        <input type="hidden" name="draftId" value={draftState.draftId} />
      ) : null}

      {state.status === "error" ? (
        <div className="mb-5">
          <FormMessage message={state.message} tone="error" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="The offer" description="How the code reads in emails and at checkout." bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Code"
                htmlFor="code"
                required
                hint="Letters, numbers, hyphens and underscores."
              >
                <Input
                  id="code"
                  name="code"
                  defaultValue={draftString(seed, "code", coupon?.code ?? "")}
                  placeholder="WELCOME10"
                  maxLength={32}
                  required
                  className="uppercase"
                />
              </Field>
              <Field label="Label" htmlFor="label" hint="Shown alongside the code.">
                <Input
                  id="label"
                  name="label"
                  defaultValue={draftString(seed, "label", coupon?.label ?? "")}
                  placeholder="Welcome to the studio"
                  maxLength={80}
                />
              </Field>
            </div>
            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                rows={3}
                maxLength={300}
                defaultValue={draftString(seed, "description", coupon?.description ?? "")}
                placeholder="10% off your first order, up to ₹500."
              />
            </Field>
          </Panel>

          <Panel title="Discount" description="Applied to the product subtotal at checkout." bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type" htmlFor="discountType">
                <Select
                  id="discountType"
                  name="discountType"
                  value={discountType}
                  onChange={(event) =>
                    setDiscountType(event.target.value as CouponDiscountType)
                  }
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </Select>
              </Field>
              <Field
                label={discountType === "percentage" ? "Percentage (%)" : "Amount (₹)"}
                htmlFor="discountValue"
                required
                hint={
                  discountType === "percentage"
                    ? "Whole percentage, 1–100."
                    : "Whole rupees, deducted from the subtotal."
                }
              >
                <Input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  min="1"
                  step="1"
                  max={discountType === "percentage" ? 100 : undefined}
                  defaultValue={draftString(
                    seed,
                    "discountValue",
                    coupon
                      ? coupon.discount_type === "percentage"
                        ? String(coupon.discount_value)
                        : paiseToRupeeInput(coupon.discount_value)
                      : "",
                  )}
                  required
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {discountType === "percentage" ? (
                <Field
                  label="Maximum discount (₹)"
                  htmlFor="maxDiscountAmount"
                  hint="Caps the percentage discount."
                >
                  <Input
                    id="maxDiscountAmount"
                    name="maxDiscountAmount"
                    inputMode="decimal"
                    defaultValue={draftString(
                      seed,
                      "maxDiscountAmount",
                      paiseToRupeeInput(coupon?.max_discount_amount),
                    )}
                    placeholder="Optional"
                  />
                </Field>
              ) : null}
              <Field label="Minimum order (₹)" htmlFor="minOrderAmount">
                <Input
                  id="minOrderAmount"
                  name="minOrderAmount"
                  inputMode="decimal"
                  defaultValue={draftString(
                    seed,
                    "minOrderAmount",
                    paiseToRupeeInput(coupon?.min_order_amount ?? 0),
                  )}
                  placeholder="0"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Eligibility & limits" bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Audience" htmlFor="audience">
                <Select
                  id="audience"
                  name="audience"
                  defaultValue={draftString(seed, "audience", coupon?.audience ?? "all")}
                >
                  <option value="all">Retail & trade</option>
                  <option value="b2c">Retail only</option>
                  <option value="b2b">Trade only</option>
                </Select>
              </Field>
              <Field label="Total uses" htmlFor="usageLimit" hint="Blank = unlimited.">
                <Input
                  id="usageLimit"
                  name="usageLimit"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={draftString(
                    seed,
                    "usageLimit",
                    coupon?.usage_limit == null ? "" : String(coupon.usage_limit),
                  )}
                  placeholder="Unlimited"
                />
              </Field>
              <Field
                label="Uses per customer"
                htmlFor="perCustomerLimit"
                hint="Blank = unlimited."
              >
                <Input
                  id="perCustomerLimit"
                  name="perCustomerLimit"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={draftString(
                    seed,
                    "perCustomerLimit",
                    coupon?.per_customer_limit == null
                      ? ""
                      : String(coupon.per_customer_limit),
                  )}
                  placeholder="Unlimited"
                />
              </Field>
            </div>
            <div className="space-y-2.5 border-t border-line pt-4">
              <Checkbox
                name="firstOrderOnly"
                label="First order only"
                defaultChecked={draftFlag(
                  seed,
                  "firstOrderOnly",
                  coupon?.first_order_only ?? false,
                )}
              />
              <Checkbox
                name="isPublic"
                label="Anyone can use this code (no private gating)"
                defaultChecked={draftFlag(seed, "isPublic", coupon?.is_public ?? true)}
              />
              <Checkbox
                name="showInOffers"
                label="Show on the offers page and homepage ticker"
                defaultChecked={draftFlag(
                  seed,
                  "showInOffers",
                  coupon?.show_in_offers ?? true,
                )}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Schedule" description="Leave blank for always-on." bodyClassName="space-y-4">
            <Field label="Starts" htmlFor="startsAt">
              <Input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={draftString(
                  seed,
                  "startsAt",
                  toDateTimeInput(coupon?.starts_at),
                )}
              />
            </Field>
            <Field label="Ends" htmlFor="endsAt">
              <Input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={draftString(
                  seed,
                  "endsAt",
                  toDateTimeInput(coupon?.ends_at),
                )}
              />
            </Field>
            <div className="border-t border-line pt-4">
              <Checkbox
                name="isActive"
                label="Coupon is active"
                defaultChecked={draftFlag(seed, "isActive", coupon?.is_active ?? true)}
              />
            </div>
          </Panel>

          <Panel bodyClassName="space-y-3">
            {coupon ? null : <DraftStatusBar draft={draftState} />}
            <SubmitButton className="w-full" pendingLabel="Saving coupon">
              {coupon ? "Save coupon" : "Create coupon"}
            </SubmitButton>
            <Link
              href="/admin/coupons"
              className="flex h-11 items-center justify-center border border-line text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:border-ink hover:text-ink"
            >
              Cancel
            </Link>
            <p className="pt-1 text-center text-[0.62rem] leading-relaxed text-muted">
              Codes are stored uppercase and matched case-insensitively at checkout.
            </p>
          </Panel>
        </div>
      </div>
    </form>
  );
}

interface ComboItemDraft {
  key: string;
  variantId: string;
  quantity: string;
}

function toComboDrafts(combo?: Combo | null): ComboItemDraft[] {
  if (!combo?.items.length) {
    return [{ key: "new-1", variantId: "", quantity: "1" }];
  }
  return combo.items.map((item) => ({
    key: item.id,
    variantId: item.variant_id,
    quantity: String(item.quantity),
  }));
}

function itemsFromDraft(payload: DraftPayload): ComboItemDraft[] {
  const raw = draftJson<{ variantId?: unknown; quantity?: unknown }[]>(
    payload,
    "items",
    [],
  );
  if (!raw.length) return toComboDrafts(null);
  return raw.map((item, index) => ({
    key: `draft-${index}`,
    variantId: typeof item.variantId === "string" ? item.variantId : "",
    quantity: String(Number(item.quantity) || 1),
  }));
}

export function ComboForm({
  combo,
  variants,
  draft,
}: {
  combo?: Combo | null;
  variants: AdminVariantOption[];
  draft?: { id: string; payload: DraftPayload } | null;
}) {
  const [state, formAction] = useActionState(saveComboAction, INITIAL_FORM_STATE);
  const seed = draft?.payload ?? null;
  const formRef = useRef<HTMLFormElement>(null);
  const [imageUrl, setImageUrl] = useState(
    draftString(seed, "imageUrl", combo?.image_url ?? ""),
  );
  const [bundlePrice, setBundlePrice] = useState(() =>
    seed
      ? draftString(seed, "bundlePrice")
      : combo
        ? paiseToRupeeInput(combo.bundle_price)
        : "",
  );
  const [items, setItems] = useState<ComboItemDraft[]>(() =>
    seed ? itemsFromDraft(seed) : toComboDrafts(combo),
  );
  const draftState = useDraftAutosave(formRef, {
    kind: "combo",
    initialDraftId: draft?.id ?? null,
    enabled: !combo,
  });

  const optionsById = useMemo(
    () => new Map(variants.map((variant) => [variant.variant_id, variant])),
    [variants],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, AdminVariantOption[]>();
    for (const variant of variants) {
      const list = groups.get(variant.product_name) ?? [];
      list.push(variant);
      groups.set(variant.product_name, list);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [variants]);

  const retailValue = items.reduce((total, item) => {
    const option = optionsById.get(item.variantId);
    const quantity = Math.max(0, Number.parseInt(item.quantity || "0", 10) || 0);
    return total + (option ? option.retail_price * quantity : 0);
  }, 0);

  const bundlePaise = parseRupeesToPaise(bundlePrice) ?? 0;
  const savings = retailValue - bundlePaise;

  const itemsPayload = items.map((item) => ({
    variantId: item.variantId,
    quantity: Math.max(1, Number.parseInt(item.quantity || "1", 10) || 1),
  }));

  function updateItem(key: string, patch: Partial<ComboItemDraft>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { key: crypto.randomUUID(), variantId: "", quantity: "1" },
    ]);
  }

  return (
    <form ref={formRef} action={formAction} className="mt-7">
      <input type="hidden" name="id" value={combo?.id ?? ""} />
      {draftState.draftId ? (
        <input type="hidden" name="draftId" value={draftState.draftId} />
      ) : null}
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="hidden" name="items" value={JSON.stringify(itemsPayload)} />

      {state.status === "error" ? (
        <div className="mb-5">
          <FormMessage message={state.message} tone="error" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="The bundle" bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="combo-title" required className="sm:col-span-2">
                <Input
                  id="combo-title"
                  name="title"
                  defaultValue={draftString(seed, "title", combo?.title ?? "")}
                  placeholder="The quiet table set"
                  maxLength={140}
                  required
                />
              </Field>
              <Field
                label="Slug"
                htmlFor="combo-slug"
                hint="Leave blank to generate it from the title."
              >
                <Input
                  id="combo-slug"
                  name="slug"
                  defaultValue={draftString(seed, "slug", combo?.slug ?? "")}
                  placeholder="quiet-table-set"
                />
              </Field>
              <Field label="Audience" htmlFor="combo-audience">
                <Select
                  id="combo-audience"
                  name="audience"
                  defaultValue={draftString(seed, "audience", combo?.audience ?? "all")}
                >
                  <option value="all">Retail & trade</option>
                  <option value="b2c">Retail only</option>
                  <option value="b2b">Trade only</option>
                </Select>
              </Field>
              <Field label="Description" htmlFor="combo-description" className="sm:col-span-2">
                <Textarea
                  id="combo-description"
                  name="description"
                  rows={4}
                  maxLength={600}
                  defaultValue={draftString(seed, "description", combo?.description ?? "")}
                  placeholder="Two runners and a set of napkins, bundled for a softer table."
                />
              </Field>
            </div>
            <MediaUrlField
              label="Bundle image"
              value={imageUrl}
              onChange={setImageUrl}
              folder="combos"
              hint="A flat-lay of the pieces works well."
            />
          </Panel>

          <Panel
            title="What's inside"
            description="Each variant can appear once. Stock is checked at checkout."
            actions={
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                <Plus className="size-3.5" aria-hidden />
                Add piece
              </Button>
            }
            bodyClassName="space-y-3"
          >
            {!variants.length ? (
              <FormMessage
                tone="info"
                message="Add products with variants before building a bundle."
              />
            ) : null}

            {items.map((item, index) => {
              const selected = optionsById.get(item.variantId);
              const quantity = Math.max(
                0,
                Number.parseInt(item.quantity || "0", 10) || 0,
              );
              return (
                <div
                  key={item.key}
                  className="border border-line bg-paper/40 p-3.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
                      Piece {index + 1}
                    </p>
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setItems((current) =>
                            current.filter((entry) => entry.key !== item.key),
                          )
                        }
                        className="inline-flex items-center gap-1 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-red-900"
                      >
                        <Trash2 className="size-3" aria-hidden />
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem]">
                    <Field label="Variant" htmlFor={`combo-item-${index}`}>
                      <Select
                        id={`combo-item-${index}`}
                        value={item.variantId}
                        onChange={(event) =>
                          updateItem(item.key, { variantId: event.target.value })
                        }
                      >
                        <option value="">Choose a variant</option>
                        {grouped.map(([productName, productVariants]) => (
                          <optgroup key={productName} label={productName}>
                            {productVariants.map((option) => (
                              <option
                                key={option.variant_id}
                                value={option.variant_id}
                              >
                                {option.label} · {formatMoney(option.retail_price)}
                                {option.sku ? ` · ${option.sku}` : ""}
                                {option.is_active ? "" : " (inactive)"}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Qty" htmlFor={`combo-qty-${index}`}>
                      <Input
                        id={`combo-qty-${index}`}
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.key, { quantity: event.target.value })
                        }
                      />
                    </Field>
                  </div>
                  {selected ? (
                    <p className="mt-1 text-[0.64rem] text-muted">
                      {formatMoney(selected.retail_price * quantity)} retail ·{" "}
                      {selected.stock_qty} in stock
                    </p>
                  ) : null}
                </div>
              );
            })}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Bundle pricing" bodyClassName="space-y-4">
            <Field label="Bundle price (₹)" htmlFor="bundlePrice" required>
              <Input
                id="bundlePrice"
                name="bundlePrice"
                inputMode="decimal"
                value={bundlePrice}
                onChange={(event) => setBundlePrice(event.target.value)}
                placeholder="4200"
                required
              />
            </Field>
            <div className="border border-line bg-paper/60 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Retail value</span>
                <span>{formatMoney(retailValue)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-muted">Bundle saving</span>
                <span className={savings > 0 ? "text-sage" : "text-muted"}>
                  {savings > 0 ? formatMoney(savings) : "—"}
                </span>
              </div>
            </div>
          </Panel>

          <Panel title="Schedule" bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Starts" htmlFor="combo-starts">
                <Input
                  id="combo-starts"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={draftString(
                  seed,
                  "startsAt",
                  toDateTimeInput(combo?.starts_at),
                )}
                />
              </Field>
              <Field label="Ends" htmlFor="combo-ends">
                <Input
                  id="combo-ends"
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={draftString(
                  seed,
                  "endsAt",
                  toDateTimeInput(combo?.ends_at),
                )}
                />
              </Field>
              <Field label="Sort order" htmlFor="combo-sort" hint="Lower numbers appear first.">
                <Input
                  id="combo-sort"
                  name="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={draftString(seed, "sortOrder", String(combo?.sort_order ?? 0))}
                />
              </Field>
            </div>
            <div className="space-y-2.5 border-t border-line pt-4">
              <Checkbox
                name="isActive"
                label="Bundle is active"
                defaultChecked={draftFlag(seed, "isActive", combo?.is_active ?? true)}
              />
              <Checkbox
                name="showInOffers"
                label="Show on the offers page"
                defaultChecked={draftFlag(
                  seed,
                  "showInOffers",
                  combo?.show_in_offers ?? true,
                )}
              />
            </div>
          </Panel>

          <Panel bodyClassName="space-y-3">
            {combo ? null : <DraftStatusBar draft={draftState} />}
            <SubmitButton className="w-full" pendingLabel="Saving bundle">
              {combo ? "Save bundle" : "Create bundle"}
            </SubmitButton>
            <Link
              href="/admin/combos"
              className="flex h-11 items-center justify-center border border-line text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:border-ink hover:text-ink"
            >
              Cancel
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center justify-center gap-1.5 pt-1 text-center text-[0.62rem] text-muted transition-colors hover:text-ink"
            >
              Manage products
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </Panel>
        </div>
      </div>
    </form>
  );
}
