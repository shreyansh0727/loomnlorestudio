"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import {
  adminActionContext,
  databaseMessage,
  firstIssue,
  flagged,
  integer,
  jsonValue,
  optionalInteger,
  rupeesToPaise,
  text,
} from "@/lib/admin/helpers";
import {
  categoryInputSchema,
  productInputSchema,
} from "@/lib/validation-admin";
import { discardDraftAfterSave } from "@/lib/admin/drafts";
import { slugify } from "@/lib/utils";
import type { ProductVariant } from "@/lib/types";

function refreshCatalog() {
  revalidateTag("products", { expire: 0 });
  revalidateTag("categories", { expire: 0 });
  revalidateTag("promotions", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/shop", "layout");
  revalidatePath("/offers");
  revalidatePath("/admin/products", "layout");
  revalidatePath("/admin/categories");
  revalidatePath("/admin");
}

function refreshContent() {
  revalidatePath("/");
}

export async function saveCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const rawName = text(formData, "name").trim();
  const parsed = categoryInputSchema.safeParse({
    name: rawName,
    slug: text(formData, "slug").trim() || slugify(rawName),
    description: text(formData, "description"),
    imageUrl: text(formData, "imageUrl"),
    sortOrder: integer(formData, "sortOrder"),
    isActive: flagged(formData, "isActive"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const id = text(formData, "id").trim() || null;
  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    image_url: parsed.data.imageUrl,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  };

  if (id) {
    const { error } = await context.admin
      .from("categories")
      .update(payload)
      .eq("id", id);
    if (error) return { status: "error", message: databaseMessage(error) };
  } else {
    const { error } = await context.admin.from("categories").insert(payload);
    if (error) return { status: "error", message: databaseMessage(error) };
  }

  refreshCatalog();
  refreshContent();
  redirect(`/admin/categories?saved=${encodeURIComponent(parsed.data.name)}`);
}

export async function deleteCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  if (!id) return { status: "error", message: "That category could not be found." };

  const { count, error: countError } = await context.admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (countError) return { status: "error", message: databaseMessage(countError) };
  if ((count ?? 0) > 0) {
    return {
      status: "error",
      message: "Move this category's products elsewhere or deactivate it instead.",
    };
  }

  const { error } = await context.admin.from("categories").delete().eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshCatalog();
  return { status: "success", message: "Category removed." };
}

export async function saveProductAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim() || null;
  const variantsRaw = jsonValue(formData, "variants");
  const imagesRaw = jsonValue(formData, "images");
  const tagsRaw = jsonValue(formData, "tags");

  const retailPrice = rupeesToPaise(formData, "retailPrice");
  const compareAtPrice = rupeesToPaise(formData, "compareAtPrice");
  const wholesalePrice = rupeesToPaise(formData, "wholesalePrice");
  if (retailPrice === undefined) {
    return { status: "error", message: "Enter a valid retail price." };
  }
  if (compareAtPrice === undefined) {
    return { status: "error", message: "Enter a valid compare-at price." };
  }
  if (wholesalePrice === undefined) {
    return { status: "error", message: "Enter a valid wholesale price." };
  }

  const rawName = text(formData, "name").trim();
  const parsed = productInputSchema.safeParse({
    name: rawName,
    slug: text(formData, "slug").trim() || slugify(rawName),
    categoryId: text(formData, "categoryId"),
    shortDescription: text(formData, "shortDescription"),
    description: text(formData, "description"),
    retailPrice: retailPrice ?? 0,
    compareAtPrice: compareAtPrice ?? null,
    wholesalePrice: wholesalePrice ?? null,
    moq: integer(formData, "moq", 1),
    unit: text(formData, "unit", "piece"),
    tags: Array.isArray(tagsRaw) ? tagsRaw : [],
    images: Array.isArray(imagesRaw) ? imagesRaw : [],
    isActive: flagged(formData, "isActive"),
    isFeatured: flagged(formData, "isFeatured"),
    isNewArrival: flagged(formData, "isNewArrival"),
    isBestSeller: flagged(formData, "isBestSeller"),
    variants: Array.isArray(variantsRaw) ? variantsRaw : [],
  });

  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const { data: category } = await context.admin
    .from("categories")
    .select("id")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();
  if (!category) return { status: "error", message: "Choose a valid category." };

  const slugQuery = context.admin
    .from("products")
    .select("id")
    .eq("slug", parsed.data.slug);
  if (id) slugQuery.neq("id", id);
  const { data: slugMatch } = await slugQuery.maybeSingle();
  if (slugMatch) {
    return { status: "error", message: "That slug is already used by another product." };
  }

  let existingVariants: ProductVariant[] = [];
  if (id) {
    const { data: existing, error: existingError } = await context.admin
      .from("product_variants")
      .select("*")
      .eq("product_id", id);
    if (existingError) return { status: "error", message: databaseMessage(existingError) };
    existingVariants = (existing ?? []) as ProductVariant[];
  }

  const payload = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    short_description: parsed.data.shortDescription,
    description: parsed.data.description,
    category_id: parsed.data.categoryId,
    retail_price: parsed.data.retailPrice,
    compare_at_price: parsed.data.compareAtPrice,
    wholesale_price: parsed.data.wholesalePrice,
    moq: parsed.data.moq,
    unit: parsed.data.unit,
    images: parsed.data.images,
    tags: parsed.data.tags,
    is_active: parsed.data.isActive,
    is_featured: parsed.data.isFeatured,
    is_new_arrival: parsed.data.isNewArrival,
    is_best_seller: parsed.data.isBestSeller,
  };

  let productId = id;
  if (id) {
    const { error } = await context.admin.from("products").update(payload).eq("id", id);
    if (error) return { status: "error", message: databaseMessage(error) };
  } else {
    const { data, error } = await context.admin
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      return { status: "error", message: databaseMessage(error ?? { message: "" }) };
    }
    productId = data.id as string;
  }

  if (!productId) {
    return { status: "error", message: "The product could not be saved." };
  }

  const existingById = new Map(existingVariants.map((variant) => [variant.id, variant]));
  const keptIds = new Set<string>();

  for (const [index, variant] of parsed.data.variants.entries()) {
    const existing = variant.id ? existingById.get(variant.id) : undefined;
    const variantPayload = {
      product_id: productId,
      label: variant.label,
      sku: variant.sku,
      stock_qty: variant.stockQty,
      retail_price_override: variant.retailOverride,
      wholesale_price_override: variant.wholesaleOverride,
      is_active: variant.isActive,
      sort_order: index,
    };

    if (existing) {
      keptIds.add(existing.id);
      const { error } = await context.admin
        .from("product_variants")
        .update(variantPayload)
        .eq("id", existing.id)
        .eq("product_id", productId);
      if (error) return { status: "error", message: databaseMessage(error) };

      if (existing.stock_qty !== variant.stockQty) {
        await context.admin.from("inventory_movements").insert({
          variant_id: existing.id,
          change_qty: variant.stockQty - existing.stock_qty,
          reason: "manual_adjustment",
          note: "Stock adjusted from the product editor.",
          created_by: context.viewer.user?.id ?? null,
        });
      }
    } else {
      const { error } = await context.admin
        .from("product_variants")
        .insert({ ...variantPayload, attributes: {} });
      if (error) return { status: "error", message: databaseMessage(error) };
    }
  }

  const removedIds = existingVariants
    .filter((variant) => !keptIds.has(variant.id) && variant.is_active)
    .map((variant) => variant.id);
  if (removedIds.length) {
    const { error } = await context.admin
      .from("product_variants")
      .update({ is_active: false })
      .in("id", removedIds);
    if (error) return { status: "error", message: databaseMessage(error) };
  }

  await discardDraftAfterSave(context.admin, formData);
  refreshCatalog();
  redirect(
    `/admin/products/${productId}?saved=${id ? "1" : "created"}`,
  );
}

export async function toggleProductActiveAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  const next = flagged(formData, "nextActive");
  if (!id) return { status: "error", message: "That product could not be found." };

  const { error } = await context.admin
    .from("products")
    .update({ is_active: next })
    .eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshCatalog();
  return {
    status: "success",
    message: next ? "Product is live on the storefront." : "Product hidden from the storefront.",
  };
}

export async function uploadMediaAction(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const context = await adminActionContext();
  if (!context.ok) return { ok: false, message: context.message };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a file to upload." };
  }
  if (file.size > 15 * 1024 * 1024) {
    return { ok: false, message: "Keep uploads under 15 MB." };
  }
  const mime = file.type.toLowerCase();
  const isImage = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"].includes(mime);
  const isVideo = ["video/mp4", "video/webm"].includes(mime);
  if (!isImage && !isVideo) {
    return { ok: false, message: "Upload a JPG, PNG, WebP, AVIF, GIF, MP4 or WebM file." };
  }

  const folderRaw = text(formData, "folder", "catalog").trim();
  const folder = /^[a-z0-9/_-]{1,40}$/.test(folderRaw) ? folderRaw : "catalog";
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60);
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName || "upload"}`;

  const { error } = await context.admin.storage
    .from("media")
    .upload(path, file, { contentType: mime, cacheControl: "31536000", upsert: false });
  if (error) {
    return { ok: false, message: "The file could not be uploaded. Check the media bucket." };
  }

  const { data } = context.admin.storage.from("media").getPublicUrl(path);
  if (!data?.publicUrl) return { ok: false, message: "The uploaded file has no public URL." };
  return { ok: true, url: data.publicUrl };
}

const quickStockAdjustSchema = z.object({
  variantId: z.uuid(),
  delta: z.number().int().refine((value) => value !== 0, "Enter a non-zero adjustment."),
});

export async function adjustStockAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const parsed = quickStockAdjustSchema.safeParse({
    variantId: text(formData, "variantId"),
    delta: optionalInteger(formData, "delta") ?? 0,
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const { data: variant, error: readError } = await context.admin
    .from("product_variants")
    .select("id,stock_qty")
    .eq("id", parsed.data.variantId)
    .maybeSingle();
  if (readError || !variant) {
    return { status: "error", message: "That variant could not be found." };
  }
  const nextStock = Number(variant.stock_qty) + parsed.data.delta;
  if (nextStock < 0) {
    return { status: "error", message: "Stock cannot fall below zero." };
  }

  const { error } = await context.admin
    .from("product_variants")
    .update({ stock_qty: nextStock })
    .eq("id", parsed.data.variantId);
  if (error) return { status: "error", message: databaseMessage(error) };

  await context.admin.from("inventory_movements").insert({
    variant_id: parsed.data.variantId,
    change_qty: parsed.data.delta,
    reason: "manual_adjustment",
    note: "Quick stock adjustment from the dashboard.",
    created_by: context.viewer.user?.id ?? null,
  });

  refreshCatalog();
  return { status: "success", message: "Stock updated." };
}
