"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { saveHomepageSectionAction, savePopupAction } from "@/lib/actions/admin/content";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import type {
  BannerConfig,
  Category,
  ComboRailConfig,
  EditorialConfig,
  HeroConfig,
  HeroSlide,
  HomepageSection,
  HomepageSectionType,
  OfferTickerConfig,
  PopupOffer,
  ProductRailSource,
} from "@/lib/types";
import { HOMEPAGE_SECTION_TYPES } from "@/lib/types";
import { HOMEPAGE_SECTION_LABELS } from "@/lib/constants";
import type { HomepageSectionType as SectionType } from "@/lib/types";
import { toDateTimeInput } from "@/lib/utils";
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

export const SECTION_TYPE_DESCRIPTIONS: Record<SectionType, string> = {
  hero: "A full-bleed carousel of images or video with headline and calls to action.",
  offer_ticker: "A slim, scrolling strip of offers and coupon codes beneath the header.",
  category_grid: "A curated set of category tiles with imagery and links.",
  product_rail: "A horizontal rail of products from a collection, flag or manual pick.",
  banner: "A wide promotional image with copy and a single call to action.",
  editorial: "An image-and-story block for provenance, process or a collection note.",
  combo_rail: "A rail of fixed bundles and gift-ready sets.",
};

const TYPE_ICONS = HOMEPAGE_SECTION_TYPES;function newSlide(): HeroSlide {
  return {
    id: crypto.randomUUID(),
    eyebrow: "",
    title: "",
    subtitle: "",
    media_type: "image",
    image_url: "",
    video_url: "",
    poster_url: "",
    cta_label: "",
    cta_href: "/shop",
    secondary_cta_label: "",
    secondary_cta_href: "",
    align: "left",
    tone: "light",
  };
}

function defaultHeroSlides(): HeroSlide[] {
  return [
    {
      ...newSlide(),
      id: "slide-1",
      eyebrow: "The winter edit",
      title: "Cloth with a sense of place.",
      subtitle: "Woven slowly, in small runs, from fibres we can trace.",
      cta_label: "Explore the collection",
      cta_href: "/shop",
      secondary_cta_label: "Our story",
      secondary_cta_href: "/about",
    },
  ];
}

function HeroConfigEditor({ initial }: { initial?: HeroSlide[] }) {
  const [slides, setSlides] = useState<HeroSlide[]>(() =>
    initial?.length ? initial : defaultHeroSlides(),
  );

  function patch(index: number, values: Partial<HeroSlide>) {
    setSlides((current) =>
      current.map((slide, position) =>
        position === index ? { ...slide, ...values } : slide,
      ),
    );
  }

  const config: HeroConfig = { slides };

  return (
    <>
      <input type="hidden" name="config" value={JSON.stringify(config)} />
      <Panel
        title="Slides"
        description="Up to 8 slides. The first slide leads the homepage."
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setSlides((current) => [...current, newSlide()])}
            disabled={slides.length >= 8}
          >
            <Plus className="size-3.5" aria-hidden />
            Add slide
          </Button>
        }
        bodyClassName="space-y-4"
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="border border-line bg-paper/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted">
                Slide {index + 1}
                {index === 0 ? " · leads" : ""}
              </p>
              {slides.length > 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setSlides((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                  className="inline-flex items-center gap-1 text-[0.56rem] font-semibold uppercase tracking-[0.12em] text-muted transition-colors hover:text-red-900"
                >
                  <Trash2 className="size-3" aria-hidden />
                  Remove
                </button>
              ) : null}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Eyebrow" htmlFor={`slide-eyebrow-${index}`}>
                <Input
                  id={`slide-eyebrow-${index}`}
                  value={slide.eyebrow}
                  onChange={(event) => patch(index, { eyebrow: event.target.value })}
                  placeholder="The winter edit"
                  maxLength={80}
                />
              </Field>
              <Field label="Headline" htmlFor={`slide-title-${index}`} required>
                <Input
                  id={`slide-title-${index}`}
                  value={slide.title}
                  onChange={(event) => patch(index, { title: event.target.value })}
                  placeholder="Cloth with a sense of place."
                  maxLength={140}
                  required
                />
              </Field>
              <Field
                label="Supporting line"
                htmlFor={`slide-subtitle-${index}`}
                className="sm:col-span-2"
              >
                <Textarea
                  id={`slide-subtitle-${index}`}
                  rows={2}
                  value={slide.subtitle}
                  onChange={(event) => patch(index, { subtitle: event.target.value })}
                  maxLength={400}
                />
              </Field>
              <Field label="Media" htmlFor={`slide-media-${index}`}>
                <Select
                  id={`slide-media-${index}`}
                  value={slide.media_type}
                  onChange={(event) =>
                    patch(index, {
                      media_type: event.target.value as HeroSlide["media_type"],
                    })
                  }
                >
                  <option value="image">Still image</option>
                  <option value="video">Video</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Copy tone" htmlFor={`slide-tone-${index}`}>
                  <Select
                    id={`slide-tone-${index}`}
                    value={slide.tone}
                    onChange={(event) =>
                      patch(index, { tone: event.target.value as HeroSlide["tone"] })
                    }
                  >
                    <option value="light">Light copy</option>
                    <option value="dark">Dark copy</option>
                  </Select>
                </Field>
                <Field label="Alignment" htmlFor={`slide-align-${index}`}>
                  <Select
                    id={`slide-align-${index}`}
                    value={slide.align}
                    onChange={(event) =>
                      patch(index, { align: event.target.value as HeroSlide["align"] })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Centre</option>
                    <option value="right">Right</option>
                  </Select>
                </Field>
              </div>
            </div>

            <div className="mt-3 space-y-3 border-t border-line pt-3">
              <MediaUrlField
                label="Hero image"
                value={slide.image_url}
                onChange={(value) => patch(index, { image_url: value })}
                folder="homepage"
                hint="Used as the hero image, and as the poster when this is a video slide."
              />
              {slide.media_type === "video" ? (
                <MediaUrlField
                  label="Video file or URL"
                  value={slide.video_url}
                  onChange={(value) => patch(index, { video_url: value })}
                  folder="homepage"
                  kind="media"
                  hint="MP4 or WebM, or a hosted video URL."
                />
              ) : null}
            </div>

            <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
              <Field label="Primary button label" htmlFor={`slide-cta-${index}`}>
                <Input
                  id={`slide-cta-${index}`}
                  value={slide.cta_label}
                  onChange={(event) => patch(index, { cta_label: event.target.value })}
                  placeholder="Explore the collection"
                  maxLength={60}
                />
              </Field>
              <Field label="Primary link" htmlFor={`slide-cta-href-${index}`}>
                <Input
                  id={`slide-cta-href-${index}`}
                  value={slide.cta_href}
                  onChange={(event) => patch(index, { cta_href: event.target.value })}
                  placeholder="/shop"
                  maxLength={300}
                />
              </Field>
              <Field label="Secondary button label" htmlFor={`slide-cta2-${index}`}>
                <Input
                  id={`slide-cta2-${index}`}
                  value={slide.secondary_cta_label}
                  onChange={(event) =>
                    patch(index, { secondary_cta_label: event.target.value })
                  }
                  placeholder="Our story"
                  maxLength={60}
                />
              </Field>
              <Field label="Secondary link" htmlFor={`slide-cta2-href-${index}`}>
                <Input
                  id={`slide-cta2-href-${index}`}
                  value={slide.secondary_cta_href}
                  onChange={(event) =>
                    patch(index, { secondary_cta_href: event.target.value })
                  }
                  placeholder="/about"
                  maxLength={300}
                />
              </Field>
            </div>
          </div>
        ))}
      </Panel>
    </>
  );
}

function OfferTickerEditor({ initial }: { initial?: OfferTickerConfig }) {
  const [items, setItems] = useState(
    () =>
      initial?.items ?? [
        { id: "ticker-1", text: "Free design advice on every fabric order", coupon_code: "", href: "/shop" },
      ],
  );

  function patch(index: number, values: Partial<(typeof items)[number]>) {
    setItems((current) =>
      current.map((item, position) =>
        position === index ? { ...item, ...values } : item,
      ),
    );
  }

  return (
    <>
      <input type="hidden" name="config" value={JSON.stringify({ items })} />
      <Panel
        title="Ticker items"
        description="Short lines that scroll beneath the header. Up to 10."
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={items.length >= 10}
            onClick={() =>
              setItems((current) => [
                ...current,
                { id: crypto.randomUUID(), text: "", coupon_code: "", href: "" },
              ])
            }
          >
            <Plus className="size-3.5" aria-hidden />
            Add item
          </Button>
        }
        bodyClassName="space-y-3"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="grid gap-3 border border-line bg-paper/40 p-3.5 sm:grid-cols-[minmax(0,1.6fr)_9rem_minmax(0,1fr)_auto] sm:items-end"
          >
            <Field label={`Message ${index + 1}`} htmlFor={`ticker-text-${index}`}>
              <Input
                id={`ticker-text-${index}`}
                value={item.text}
                onChange={(event) => patch(index, { text: event.target.value })}
                placeholder="Orders above ₹5,000 ship free within India"
                maxLength={160}
              />
            </Field>
            <Field label="Coupon" htmlFor={`ticker-code-${index}`}>
              <Input
                id={`ticker-code-${index}`}
                value={item.coupon_code}
                onChange={(event) =>
                  patch(index, { coupon_code: event.target.value.toUpperCase() })
                }
                placeholder="WELCOME10"
                maxLength={32}
              />
            </Field>
            <Field label="Link" htmlFor={`ticker-href-${index}`}>
              <Input
                id={`ticker-href-${index}`}
                value={item.href}
                onChange={(event) => patch(index, { href: event.target.value })}
                placeholder="/offers"
                maxLength={300}
              />
            </Field>
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setItems((current) =>
                    current.filter((_, position) => position !== index),
                  )
                }
                className="mb-1 inline-flex size-9 items-center justify-center border border-line text-muted transition-colors hover:border-red-900 hover:text-red-900"
                aria-label={`Remove ticker item ${index + 1}`}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        ))}
        <p className="text-[0.68rem] text-muted">
          Coupon codes are shown as a small tag; leave the link blank to keep the line
          as plain text.
        </p>
      </Panel>
    </>
  );
}

function CategoryGridEditor({
  initial,
  categories,
}: {
  initial?: string[];
  categories: Pick<Category, "id" | "name">[];
}) {
  const [selected, setSelected] = useState<string[]>(initial ?? []);

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length >= 12
          ? current
          : [...current, id],
    );
  }

  return (
    <>
      <input type="hidden" name="config" value={JSON.stringify({ category_ids: selected })} />
      <Panel
        title="Category tiles"
        description={`Choose up to 12 categories. ${selected.length} selected.`}
        bodyClassName="space-y-3"
      >
        {categories.length ? (
          categories.map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center justify-between gap-3 border border-line bg-paper/40 px-3.5 py-2.5 text-sm"
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(category.id)}
                  onChange={() => toggle(category.id)}
                  className="size-4 accent-[var(--color-clay)]"
                />
                {category.name}
              </span>
              <span className="text-[0.6rem] uppercase tracking-[0.1em] text-muted">
                {selected.includes(category.id)
                  ? `Position ${selected.indexOf(category.id) + 1}`
                  : ""}
              </span>
            </label>
          ))
        ) : (
          <FormMessage tone="info" message="Create categories before building this grid." />
        )}
      </Panel>
    </>
  );
}

function ProductRailEditor({
  initial,
  categories,
  products,
}: {
  initial?: ProductRailSource;
  categories: Pick<Category, "id" | "name">[];
  products: { id: string; name: string; category_id: string }[];
}) {
  const [source, setSource] = useState<ProductRailSource["source"]>(
    initial?.source ?? "new_arrivals",
  );
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [productIds, setProductIds] = useState<string[]>(initial?.product_ids ?? []);
  const [limit, setLimit] = useState(String(initial?.limit ?? 8));
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => product.name.toLowerCase().includes(query));
  }, [products, search]);

  function toggleProduct(id: string) {
    setProductIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length >= 24
          ? current
          : [...current, id],
    );
  }

  const config = {
    source,
    category_id: source === "category" ? categoryId : "",
    product_ids: source === "manual" ? productIds : [],
    limit: Math.max(1, Number.parseInt(limit || "8", 10) || 8),
  };

  return (
    <>
      <input type="hidden" name="config" value={JSON.stringify(config)} />
      <Panel title="Rail source" bodyClassName="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Source" htmlFor="rail-source">
            <Select
              id="rail-source"
              value={source}
              onChange={(event) =>
                setSource(event.target.value as ProductRailSource["source"])
              }
            >
              <option value="new_arrivals">New arrivals</option>
              <option value="featured">Featured pieces</option>
              <option value="best_sellers">Best sellers</option>
              <option value="category">A category</option>
              <option value="manual">Hand-picked</option>
            </Select>
          </Field>
          <Field label="Items shown" htmlFor="rail-limit">
            <Input
              id="rail-limit"
              type="number"
              min="1"
              max="24"
              step="1"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </Field>
        </div>

        {source === "category" ? (
          <Field label="Category" htmlFor="rail-category">
            <Select
              id="rail-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {source === "manual" ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                Hand-picked products
              </p>
              <span className="text-[0.62rem] text-muted">{productIds.length} / 24</span>
            </div>
            <Input
              className="mt-2"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
            />
            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto border border-line bg-paper/40 p-2">
              {filteredProducts.length ? (
                filteredProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex cursor-pointer items-center gap-3 px-2 py-1.5 text-sm hover:bg-cream"
                  >
                    <input
                      type="checkbox"
                      checked={productIds.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="size-4 shrink-0 accent-[var(--color-clay)]"
                    />
                    <span className="truncate">{product.name}</span>
                  </label>
                ))
              ) : (
                <p className="px-2 py-4 text-sm text-muted">No products match that search.</p>
              )}
            </div>
            <p className="mt-2 text-[0.68rem] text-muted">
              Hand-picked products appear in the order selected.
            </p>
          </div>
        ) : null}
      </Panel>
    </>
  );
}

function BannerEditor({ initial }: { initial?: BannerConfig }) {
  const [banner, setBanner] = useState<BannerConfig>(
    () =>
      initial ?? {
        image_url: "",
        mobile_image_url: "",
        eyebrow: "",
        heading: "",
        body: "",
        cta_label: "",
        cta_href: "/shop",
        tone: "light",
        align: "left",
      },
  );

  function patch(values: Partial<BannerConfig>) {
    setBanner((current) => ({ ...current, ...values }));
  }

  return (
    <>
      <input type="hidden" name="config" value={JSON.stringify(banner)} />
      <Panel title="Banner" bodyClassName="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" htmlFor="banner-eyebrow">
            <Input
              id="banner-eyebrow"
              value={banner.eyebrow}
              onChange={(event) => patch({ eyebrow: event.target.value })}
              maxLength={80}
            />
          </Field>
          <Field label="Heading" htmlFor="banner-heading" required>
            <Input
              id="banner-heading"
              value={banner.heading}
              onChange={(event) => patch({ heading: event.target.value })}
              maxLength={160}
              required
            />
          </Field>
          <Field label="Body copy" htmlFor="banner-body" className="sm:col-span-2">
            <Textarea
              id="banner-body"
              rows={2}
              value={banner.body}
              onChange={(event) => patch({ body: event.target.value })}
              maxLength={500}
            />
          </Field>
          <Field label="Button label" htmlFor="banner-cta">
            <Input
              id="banner-cta"
              value={banner.cta_label}
              onChange={(event) => patch({ cta_label: event.target.value })}
              maxLength={60}
            />
          </Field>
          <Field label="Button link" htmlFor="banner-cta-href">
            <Input
              id="banner-cta-href"
              value={banner.cta_href}
              onChange={(event) => patch({ cta_href: event.target.value })}
              maxLength={300}
            />
          </Field>
          <Field label="Tone" htmlFor="banner-tone">
            <Select
              id="banner-tone"
              value={banner.tone}
              onChange={(event) =>
                patch({ tone: event.target.value as BannerConfig["tone"] })
              }
            >
              <option value="light">Light copy</option>
              <option value="dark">Dark copy</option>
            </Select>
          </Field>
          <Field label="Alignment" htmlFor="banner-align">
            <Select
              id="banner-align"
              value={banner.align}
              onChange={(event) =>
                patch({ align: event.target.value as BannerConfig["align"] })
              }
            >
              <option value="left">Left</option>
              <option value="center">Centre</option>
              <option value="right">Right</option>
            </Select>
          </Field>
        </div>
        <MediaUrlField
          label="Desktop image"
          value={banner.image_url}
          onChange={(value) => patch({ image_url: value })}
          folder="banners"
          hint="Wide, landscape crop. Required."
        />
        <MediaUrlField
          label="Mobile image"
          value={banner.mobile_image_url}
          onChange={(value) => patch({ mobile_image_url: value })}
          folder="banners"
          hint="Optional portrait crop for small screens."
        />
      </Panel>
    </>
  );
}

function EditorialEditor({ initial }: { initial?: EditorialConfig }) {
  const [editorial, setEditorial] = useState<EditorialConfig>(
    () =>
      initial ?? {
        image_url: "",
        eyebrow: "",
        heading: "",
        body: "",
        cta_label: "",
        cta_href: "/about",
        image_position: "left",
      },
  );

  function patch(values: Partial<EditorialConfig>) {
    setEditorial((current) => ({ ...current, ...values }));
  }

  return (
    <>
      <input type="hidden" name="config" value={JSON.stringify(editorial)} />
      <Panel title="Editorial story" bodyClassName="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow" htmlFor="editorial-eyebrow">
            <Input
              id="editorial-eyebrow"
              value={editorial.eyebrow}
              onChange={(event) => patch({ eyebrow: event.target.value })}
              maxLength={80}
            />
          </Field>
          <Field label="Heading" htmlFor="editorial-heading" required>
            <Input
              id="editorial-heading"
              value={editorial.heading}
              onChange={(event) => patch({ heading: event.target.value })}
              maxLength={160}
              required
            />
          </Field>
          <Field label="Story" htmlFor="editorial-body" className="sm:col-span-2">
            <Textarea
              id="editorial-body"
              rows={5}
              value={editorial.body}
              onChange={(event) => patch({ body: event.target.value })}
              maxLength={800}
            />
          </Field>
          <Field label="Button label" htmlFor="editorial-cta">
            <Input
              id="editorial-cta"
              value={editorial.cta_label}
              onChange={(event) => patch({ cta_label: event.target.value })}
              maxLength={60}
            />
          </Field>
          <Field label="Button link" htmlFor="editorial-cta-href">
            <Input
              id="editorial-cta-href"
              value={editorial.cta_href}
              onChange={(event) => patch({ cta_href: event.target.value })}
              maxLength={300}
            />
          </Field>
          <Field label="Image position" htmlFor="editorial-position">
            <Select
              id="editorial-position"
              value={editorial.image_position}
              onChange={(event) =>
                patch({
                  image_position: event.target.value as EditorialConfig["image_position"],
                })
              }
            >
              <option value="left">Image on the left</option>
              <option value="right">Image on the right</option>
            </Select>
          </Field>
        </div>
        <MediaUrlField
          label="Editorial image"
          value={editorial.image_url}
          onChange={(value) => patch({ image_url: value })}
          folder="editorial"
        />
      </Panel>
    </>
  );
}

function ComboRailEditor({ initial }: { initial?: ComboRailConfig }) {
  const [limit, setLimit] = useState(String(initial?.limit ?? 3));
  return (
    <>
      <input type="hidden" name="config" value={JSON.stringify({ limit: Number(limit) || 3 })} />
      <Panel title="Combo rail" bodyClassName="space-y-3">
        <Field label="Bundles shown" htmlFor="combo-rail-limit">
          <Input
            id="combo-rail-limit"
            type="number"
            min="1"
            max="12"
            step="1"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          />
        </Field>
        <p className="text-xs text-muted">
          Active bundles that are inside their schedule window are shown.
        </p>
      </Panel>
    </>
  );
}

export function SectionEditor({
  section,
  sectionType,
  categories,
  products,
}: {
  section?: HomepageSection | null;
  sectionType: HomepageSectionType;
  categories: Pick<Category, "id" | "name">[];
  products: { id: string; name: string; category_id: string }[];
}) {
  const [state, formAction] = useActionState(
    saveHomepageSectionAction,
    INITIAL_FORM_STATE,
  );

  const config = section?.config;
  const heroSlides =
    sectionType === "hero" ? (config as HeroConfig | undefined)?.slides : undefined;
  const tickerConfig =
    sectionType === "offer_ticker" ? (config as OfferTickerConfig | undefined) : undefined;
  const gridConfig =
    sectionType === "category_grid"
      ? (config as { category_ids?: string[] } | undefined)
      : undefined;
  const railConfig =
    sectionType === "product_rail"
      ? (config as ProductRailSource | undefined)
      : undefined;
  const bannerConfig =
    sectionType === "banner" ? (config as BannerConfig | undefined) : undefined;
  const editorialConfig =
    sectionType === "editorial" ? (config as EditorialConfig | undefined) : undefined;
  const comboConfig =
    sectionType === "combo_rail" ? (config as ComboRailConfig | undefined) : undefined;

  return (
    <form action={formAction} className="mt-7">
      <input type="hidden" name="id" value={section?.id ?? ""} />
      <input type="hidden" name="sectionType" value={sectionType} />

      {state.status === "error" ? (
        <div className="mb-5">
          <FormMessage message={state.message} tone="error" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {sectionType === "hero" ? <HeroConfigEditor initial={heroSlides} /> : null}
          {sectionType === "offer_ticker" ? (
            <OfferTickerEditor initial={tickerConfig} />
          ) : null}
          {sectionType === "category_grid" ? (
            <CategoryGridEditor
              initial={gridConfig?.category_ids}
              categories={categories}
            />
          ) : null}
          {sectionType === "product_rail" ? (
            <ProductRailEditor
              initial={railConfig}
              categories={categories}
              products={products}
            />
          ) : null}
          {sectionType === "banner" ? <BannerEditor initial={bannerConfig} /> : null}
          {sectionType === "editorial" ? (
            <EditorialEditor initial={editorialConfig} />
          ) : null}
          {sectionType === "combo_rail" ? (
            <ComboRailEditor initial={comboConfig} />
          ) : null}
        </div>

        <div className="space-y-6">
          <Panel
            title="Section settings"
            description={HOMEPAGE_SECTION_LABELS[sectionType]}
            bodyClassName="space-y-4"
          >
            <Field
              label="Section heading"
              htmlFor="section-title"
              hint="Optional. Some sections use this as a heading."
            >
              <Input
                id="section-title"
                name="title"
                defaultValue={section?.title ?? ""}
                maxLength={140}
                placeholder="New this season"
              />
            </Field>
            <Field label="Subtitle" htmlFor="section-subtitle">
              <Textarea
                id="section-subtitle"
                name="subtitle"
                rows={2}
                maxLength={300}
                defaultValue={section?.subtitle ?? ""}
                placeholder="A short line beneath the heading."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Sort order" htmlFor="section-sort" hint="Lower appears first.">
                <Input
                  id="section-sort"
                  name="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={section?.sort_order ?? 0}
                />
              </Field>
              <Field label="Starts" htmlFor="section-starts">
                <Input
                  id="section-starts"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={toDateTimeInput(section?.starts_at)}
                />
              </Field>
              <Field label="Ends" htmlFor="section-ends">
                <Input
                  id="section-ends"
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={toDateTimeInput(section?.ends_at)}
                />
              </Field>
            </div>
            <div className="border-t border-line pt-4">
              <Checkbox
                name="isActive"
                label="Show this section on the homepage"
                defaultChecked={section?.is_active ?? true}
              />
            </div>
          </Panel>

          <Panel bodyClassName="space-y-3">
            <SubmitButton className="w-full" pendingLabel="Saving section">
              {section ? "Save section" : "Add section"}
            </SubmitButton>
            <Link
              href="/admin/content"
              className="flex h-11 items-center justify-center border border-line text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:border-ink hover:text-ink"
            >
              Cancel
            </Link>
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-center gap-1.5 pt-1 text-[0.62rem] text-muted transition-colors hover:text-ink"
            >
              Preview the homepage
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </Panel>
        </div>
      </div>
    </form>
  );
}

export function PopupForm({ popup }: { popup?: PopupOffer | null }) {
  const [state, formAction] = useActionState(savePopupAction, INITIAL_FORM_STATE);
  const [imageUrl, setImageUrl] = useState(popup?.image_url ?? "");

  return (
    <form action={formAction} className="mt-7">
      <input type="hidden" name="id" value={popup?.id ?? ""} />
      <input type="hidden" name="imageUrl" value={imageUrl} />

      {state.status === "error" ? (
        <div className="mb-5">
          <FormMessage message={state.message} tone="error" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="The popup" description="A gentle interruption, shown once." bodyClassName="space-y-4">
            <Field label="Headline" htmlFor="popup-headline" required>
              <Input
                id="popup-headline"
                name="headline"
                defaultValue={popup?.headline ?? ""}
                maxLength={140}
                placeholder="A little something for your first order"
                required
              />
            </Field>
            <Field label="Body" htmlFor="popup-body">
              <Textarea
                id="popup-body"
                name="body"
                rows={4}
                maxLength={600}
                defaultValue={popup?.body ?? ""}
                placeholder="Take 10% off your first order with the code below."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Coupon code" htmlFor="popup-coupon" hint="Optional, shown as a tag.">
                <Input
                  id="popup-coupon"
                  name="couponCode"
                  defaultValue={popup?.coupon_code ?? ""}
                  maxLength={32}
                  placeholder="WELCOME10"
                  className="uppercase"
                />
              </Field>
              <Field label="Priority" htmlFor="popup-priority" hint="Higher wins when several are live.">
                <Input
                  id="popup-priority"
                  name="priority"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={popup?.priority ?? 0}
                />
              </Field>
              <Field label="Button label" htmlFor="popup-cta">
                <Input
                  id="popup-cta"
                  name="ctaLabel"
                  defaultValue={popup?.cta_label ?? ""}
                  maxLength={60}
                  placeholder="Shop the edit"
                />
              </Field>
              <Field label="Button link" htmlFor="popup-cta-href">
                <Input
                  id="popup-cta-href"
                  name="ctaHref"
                  defaultValue={popup?.cta_href ?? ""}
                  maxLength={300}
                  placeholder="/shop"
                />
              </Field>
            </div>
            <MediaUrlField
              label="Popup image"
              value={imageUrl}
              onChange={setImageUrl}
              folder="popups"
              hint="Optional portrait or square image."
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="When it appears" bodyClassName="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Delay (seconds)" htmlFor="popup-delay">
                <Input
                  id="popup-delay"
                  name="delaySeconds"
                  type="number"
                  min="0"
                  max="120"
                  step="1"
                  defaultValue={popup?.delay_seconds ?? 5}
                />
              </Field>
              <Field label="Frequency" htmlFor="popup-frequency">
                <Select
                  id="popup-frequency"
                  name="frequency"
                  defaultValue={popup?.frequency ?? "once_per_day"}
                >
                  <option value="once_per_visit">Once per visit</option>
                  <option value="once_per_day">Once per day</option>
                  <option value="always">Every visit</option>
                </Select>
              </Field>
              <Field label="Starts" htmlFor="popup-starts">
                <Input
                  id="popup-starts"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={toDateTimeInput(popup?.starts_at)}
                />
              </Field>
              <Field label="Ends" htmlFor="popup-ends">
                <Input
                  id="popup-ends"
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={toDateTimeInput(popup?.ends_at)}
                />
              </Field>
            </div>
            <div className="border-t border-line pt-4">
              <Checkbox
                name="isActive"
                label="Popup is active"
                defaultChecked={popup?.is_active ?? true}
              />
            </div>
          </Panel>

          <Panel bodyClassName="space-y-3">
            <SubmitButton className="w-full" pendingLabel="Saving popup">
              {popup ? "Save popup" : "Create popup"}
            </SubmitButton>
            <Link
              href="/admin/content"
              className="flex h-11 items-center justify-center border border-line text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:border-ink hover:text-ink"
            >
              Cancel
            </Link>
            <p className="pt-1 text-center text-[0.62rem] leading-relaxed text-muted">
              Visitors can always dismiss the popup. Keep the message useful, not noisy.
            </p>
          </Panel>
        </div>
      </div>
    </form>
  );
}

export function NewSectionTypePicker() {
  return (
    <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {TYPE_ICONS.map((type) => (
        <Link
          key={type}
          href={`/admin/content/new?type=${type}`}
          className="group border border-line bg-cream p-5 transition-colors hover:border-ink/40"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-serif text-2xl font-light tracking-[-0.02em]">
              {HOMEPAGE_SECTION_LABELS[type]}
            </h2>
            <ArrowRight
              className="mt-1 size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
              aria-hidden
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {SECTION_TYPE_DESCRIPTIONS[type]}
          </p>
        </Link>
      ))}
    </div>
  );
}
