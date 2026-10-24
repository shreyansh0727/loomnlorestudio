import { z } from "zod";
import { INDIAN_STATES } from "@/lib/constants";
import { isValidGstin } from "@/lib/utils";
import type { HomepageSectionType } from "@/lib/types";

const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Enter a slug.")
  .max(80, "That slug is too long.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.");

const optionalText = (max: number, message = "That text is too long.") =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

const optionalUrl = z
  .string()
  .trim()
  .max(500, "That URL is too long.")
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => value === null || value.startsWith("/") || /^https?:\/\//i.test(value),
    "Use a full https:// URL or a site path starting with /.",
  );

const requiredUrl = z
  .string()
  .trim()
  .min(1, "Enter a link or path.")
  .max(500, "That URL is too long.")
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
    "Use a full https:// URL or a site path starting with /.",
  );

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => value === null || !Number.isNaN(new Date(value).getTime()),
    "Enter a valid date and time.",
  );

const paiseField = z
  .number()
  .int("Amounts must be in whole paise.")
  .positive("Enter an amount greater than zero.")
  .max(100_000_000, "That amount is too large.");

const optionalPaiseField = z
  .number()
  .int("Amounts must be in whole paise.")
  .positive("Enter an amount greater than zero.")
  .max(100_000_000, "That amount is too large.")
  .nullable();

const imageList = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(800)
      .refine(
        (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
        "Enter valid image URLs.",
      ),
  )
  .max(10, "Use up to 10 images.")
  .default([]);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Enter a category name.").max(80, "That name is too long."),
  slug: slugField,
  description: optionalText(600),
  imageUrl: optionalUrl,
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean(),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const adminVariantSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  label: z.string().trim().min(1, "Give every variant a label.").max(80),
  sku: optionalText(60),
  stockQty: z.number().int().min(0, "Stock cannot be negative.").max(1_000_000),
  retailOverride: optionalPaiseField,
  wholesaleOverride: optionalPaiseField,
  isActive: z.boolean(),
});
export type AdminVariantInput = z.infer<typeof adminVariantSchema>;

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a product name.").max(140, "That name is too long."),
    slug: slugField,
    categoryId: z.uuid("Choose a category."),
    shortDescription: optionalText(240),
    description: optionalText(8000),
    retailPrice: paiseField,
    compareAtPrice: optionalPaiseField,
    wholesalePrice: optionalPaiseField,
    moq: z.number().int().min(1, "MOQ must be at least 1.").max(10_000),
    unit: z.enum(["piece", "metre", "set", "pack", "bundle"]),
    tags: z
      .array(z.string().trim().min(1).max(40))
      .max(12, "Use up to 12 tags.")
      .default([]),
    images: imageList,
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    isNewArrival: z.boolean(),
    isBestSeller: z.boolean(),
    variants: z
      .array(adminVariantSchema)
      .min(1, "Add at least one variant.")
      .max(40, "Use up to 40 variants."),
  })
  .superRefine((value, ctx) => {
    const labels = new Set<string>();
    const skus = new Set<string>();
    value.variants.forEach((variant, index) => {
      const label = variant.label.toLowerCase();
      if (labels.has(label)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "label"],
          message: "Variant labels must be unique.",
        });
      }
      labels.add(label);
      if (variant.sku) {
        const sku = variant.sku.toLowerCase();
        if (skus.has(sku)) {
          ctx.addIssue({
            code: "custom",
            path: ["variants", index, "sku"],
            message: "SKUs must be unique.",
          });
        }
        skus.add(sku);
      }
    });
  });
export type ProductInput = z.infer<typeof productInputSchema>;

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Codes need at least 3 characters.")
      .max(32, "That code is too long.")
      .regex(/^[A-Z0-9_-]+$/, "Use letters, numbers, hyphens and underscores."),
    label: optionalText(80),
    description: optionalText(300),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().int().positive("Enter a discount value.").max(100_000_000),
    maxDiscountAmount: optionalPaiseField,
    minOrderAmount: z.number().int().min(0).max(100_000_000),
    audience: z.enum(["all", "b2c", "b2b"]),
    isActive: z.boolean(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    usageLimit: z.number().int().positive().max(1_000_000).nullable(),
    perCustomerLimit: z.number().int().positive().max(100).nullable(),
    firstOrderOnly: z.boolean(),
    isPublic: z.boolean(),
    showInOffers: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "percentage" && value.discountValue > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Percentage discounts cannot exceed 100%.",
      });
    }
    if (
      value.startsAt &&
      value.endsAt &&
      new Date(value.startsAt).getTime() >= new Date(value.endsAt).getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "The end date must be after the start date.",
      });
    }
  });
export type CouponInput = z.infer<typeof couponInputSchema>;

// ---------------------------------------------------------------------------
// Combos
// ---------------------------------------------------------------------------

export const comboInputSchema = z
  .object({
    title: z.string().trim().min(2, "Give the combo a title.").max(140),
    slug: slugField,
    description: optionalText(600),
    imageUrl: optionalUrl,
    bundlePrice: paiseField,
    audience: z.enum(["all", "b2c", "b2b"]),
    isActive: z.boolean(),
    showInOffers: z.boolean(),
    sortOrder: z.number().int().min(0).max(999),
    startsAt: optionalDate,
    endsAt: optionalDate,
    items: z
      .array(
        z.object({
          variantId: z.uuid("Choose a variant."),
          quantity: z.number().int().min(1).max(100),
        }),
      )
      .min(1, "Add at least one piece to the bundle.")
      .max(20, "Use up to 20 pieces."),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (seen.has(item.variantId)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "variantId"],
          message: "Each variant can only appear once.",
        });
      }
      seen.add(item.variantId);
    });
    if (
      value.startsAt &&
      value.endsAt &&
      new Date(value.startsAt).getTime() >= new Date(value.endsAt).getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "The end date must be after the start date.",
      });
    }
  });
export type ComboInput = z.infer<typeof comboInputSchema>;

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "confirmed",
    "processing",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
    "refund_requested",
    "refunded",
  ]),
  note: optionalText(500),
  notify: z.boolean(),
  refundAmount: optionalPaiseField,
  refundReference: optionalText(120),
});
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

export const orderTrackingSchema = z.object({
  carrier: z.string().trim().min(1, "Enter the courier or carrier.").max(80),
  trackingNumber: z.string().trim().min(1, "Enter the tracking number.").max(80),
  trackingUrl: optionalUrl,
});

export const shippingQuoteSchema = z.object({
  amount: paiseField,
});

export const orderNoteSchema = z.object({
  note: z.string().trim().min(2, "Write a note before saving.").max(1200),
});

export const businessDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: optionalText(500),
});

// ---------------------------------------------------------------------------
// Homepage content
// ---------------------------------------------------------------------------

const slideSchema = z
  .object({
    id: z.string().min(1).max(80),
    eyebrow: z.string().trim().max(80).default(""),
    title: z.string().trim().min(2, "Every slide needs a title.").max(140),
    subtitle: z.string().trim().max(400).default(""),
    media_type: z.enum(["image", "video"]),
    image_url: z.string().trim().min(1, "Add a hero image.").max(800),
    video_url: z.string().trim().max(800).default(""),
    poster_url: z.string().trim().max(800).default(""),
    cta_label: z.string().trim().max(60).default(""),
    cta_href: z.string().trim().max(300).default("/shop"),
    secondary_cta_label: z.string().trim().max(60).default(""),
    secondary_cta_href: z.string().trim().max(300).default(""),
    align: z.enum(["left", "center", "right"]),
    tone: z.enum(["light", "dark"]),
  })
  .superRefine((value, ctx) => {
    if (value.media_type === "video" && !value.video_url) {
      ctx.addIssue({
        code: "custom",
        path: ["video_url"],
        message: "Add a video URL for a video slide.",
      });
    }
  });

export const heroConfigSchema = z.object({
  slides: z.array(slideSchema).min(1, "Add at least one hero slide.").max(8),
});

export const offerTickerConfigSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        text: z.string().trim().min(2, "Every ticker item needs text.").max(160),
        coupon_code: z.string().trim().max(32).default(""),
        href: z.string().trim().max(300).default(""),
      }),
    )
    .min(1, "Add at least one ticker item.")
    .max(10),
});

export const categoryGridConfigSchema = z.object({
  category_ids: z.array(z.uuid()).min(1, "Choose at least one category.").max(12),
});

export const productRailConfigSchema = z.object({
  source: z.enum(["new_arrivals", "featured", "best_sellers", "category", "manual"]),
  category_id: z.string().trim().default(""),
  product_ids: z.array(z.uuid()).max(24).default([]),
  limit: z.number().int().min(1).max(24),
});

export const bannerConfigSchema = z.object({
  image_url: z.string().trim().min(1, "Add a banner image.").max(800),
  mobile_image_url: z.string().trim().max(800).default(""),
  eyebrow: z.string().trim().max(80).default(""),
  heading: z.string().trim().min(2, "Add a heading.").max(160),
  body: z.string().trim().max(500).default(""),
  cta_label: z.string().trim().max(60).default(""),
  cta_href: z.string().trim().max(300).default("/shop"),
  tone: z.enum(["light", "dark"]),
  align: z.enum(["left", "center", "right"]),
});

export const editorialConfigSchema = z.object({
  image_url: z.string().trim().min(1, "Add an editorial image.").max(800),
  eyebrow: z.string().trim().max(80).default(""),
  heading: z.string().trim().min(2, "Add a heading.").max(160),
  body: z.string().trim().max(800).default(""),
  cta_label: z.string().trim().max(60).default(""),
  cta_href: z.string().trim().max(300).default("/about"),
  image_position: z.enum(["left", "right"]),
});

export const comboRailConfigSchema = z.object({
  limit: z.number().int().min(1).max(12),
});

export const homepageSectionInputSchema = z.object({
  title: optionalText(140),
  subtitle: optionalText(300),
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean(),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const sectionConfigSchemas = {
  hero: heroConfigSchema,
  offer_ticker: offerTickerConfigSchema,
  category_grid: categoryGridConfigSchema,
  product_rail: productRailConfigSchema,
  banner: bannerConfigSchema,
  editorial: editorialConfigSchema,
  combo_rail: comboRailConfigSchema,
} satisfies Record<HomepageSectionType, z.ZodType>;

export function parseSectionConfig(type: HomepageSectionType, raw: unknown) {
  return sectionConfigSchemas[type].safeParse(raw);
}

// ---------------------------------------------------------------------------
// Popup offers
// ---------------------------------------------------------------------------

export const popupInputSchema = z.object({
  headline: z.string().trim().min(2, "Add a headline.").max(140),
  body: z.string().trim().max(600).default(""),
  imageUrl: optionalUrl,
  couponCode: optionalText(32),
  ctaLabel: optionalText(60),
  ctaHref: optionalUrl,
  isActive: z.boolean(),
  startsAt: optionalDate,
  endsAt: optionalDate,
  delaySeconds: z.number().int().min(0).max(120),
  frequency: z.enum(["once_per_visit", "once_per_day", "always"]),
  priority: z.number().int().min(0).max(999),
});

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => value === null || z.email().safeParse(value).success,
    "Enter a valid email address.",
  );

export const siteSettingsInputSchema = z.object({
  brandName: z.string().trim().min(2, "Enter the brand name.").max(80),
  brandTagline: z.string().trim().max(140),
  logoUrl: optionalUrl,
  announcementText: z.string().trim().max(220),
  announcementHref: requiredUrl,
  announcementActive: z.boolean(),
  supportEmail: z.email("Enter a valid support email."),
  supportPhone: z.string().trim().min(6, "Enter a support phone.").max(40),
  whatsapp: z.string().trim().max(40),
  sellerLegalName: z.string().trim().min(2, "Enter the legal seller name.").max(140),
  sellerGstin: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((value) => value ?? "")
    .refine((value) => value === "" || isValidGstin(value), "Enter a valid GSTIN."),
  sellerAddress: z.object({
    line1: z.string().trim().min(2, "Enter the street address.").max(180),
    line2: z.string().trim().max(180),
    city: z.string().trim().min(2, "Enter the city.").max(90),
    state: z.enum(INDIAN_STATES),
    pincode: z
      .string()
      .trim()
      .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code."),
    country: z.string().trim().min(2).max(60),
  }),
  gstRate: z.number().min(0, "GST cannot be negative.").max(28, "GST cannot exceed 28%."),
  invoicePrefix: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Enter an invoice prefix.")
    .max(8, "Keep the prefix under 8 characters.")
    .regex(/^[A-Z0-9]+$/, "Use letters and numbers only."),
  b2bEmail: optionalEmail,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  pinterestUrl: optionalUrl,
  aboutText: z.string().trim().max(2400),
  shippingPolicy: z.string().trim().max(4000),
  returnsPolicy: z.string().trim().max(4000),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;
