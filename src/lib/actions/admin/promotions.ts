"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/form-state";
import {
  adminActionContext,
  databaseMessage,
  firstIssue,
  flagged,
  integer,
  isoDate,
  jsonValue,
  optionalInteger,
  rupeesToPaise,
  text,
} from "@/lib/admin/helpers";
import { comboInputSchema, couponInputSchema } from "@/lib/validation-admin";
import { slugify } from "@/lib/utils";

function refreshPromotions() {
  revalidateTag("promotions", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/offers");
  revalidatePath("/checkout");
  revalidatePath("/admin/coupons");
  revalidatePath("/admin/combos");
  revalidatePath("/admin");
}

export async function saveCouponAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim() || null;
  const discountType = text(formData, "discountType", "percentage");
  const rawValue = optionalInteger(formData, "discountValue") ?? 0;
  const maxDiscount = rupeesToPaise(formData, "maxDiscountAmount");
  const minOrder = rupeesToPaise(formData, "minOrderAmount");

  if (maxDiscount === undefined) {
    return { status: "error", message: "Enter a valid maximum discount." };
  }
  if (minOrder === undefined) {
    return { status: "error", message: "Enter a valid minimum order amount." };
  }

  const parsed = couponInputSchema.safeParse({
    code: text(formData, "code"),
    label: text(formData, "label"),
    description: text(formData, "description"),
    discountType,
    discountValue:
      discountType === "fixed" ? Math.round(rawValue * 100) : rawValue,
    maxDiscountAmount: maxDiscount ?? null,
    minOrderAmount: minOrder ?? 0,
    audience: text(formData, "audience", "all"),
    isActive: flagged(formData, "isActive"),
    startsAt: isoDate(formData, "startsAt"),
    endsAt: isoDate(formData, "endsAt"),
    usageLimit: optionalInteger(formData, "usageLimit"),
    perCustomerLimit: optionalInteger(formData, "perCustomerLimit"),
    firstOrderOnly: flagged(formData, "firstOrderOnly"),
    isPublic: flagged(formData, "isPublic"),
    showInOffers: flagged(formData, "showInOffers"),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const codeQuery = context.admin
    .from("coupons")
    .select("id")
    .ilike("code", parsed.data.code);
  if (id) codeQuery.neq("id", id);
  const { data: codeMatch } = await codeQuery.maybeSingle();
  if (codeMatch) {
    return { status: "error", message: "That coupon code is already in use." };
  }

  const payload = {
    code: parsed.data.code,
    label: parsed.data.label,
    description: parsed.data.description,
    discount_type: parsed.data.discountType,
    discount_value: parsed.data.discountValue,
    max_discount_amount: parsed.data.maxDiscountAmount,
    min_order_amount: parsed.data.minOrderAmount,
    audience: parsed.data.audience,
    is_active: parsed.data.isActive,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
    usage_limit: parsed.data.usageLimit,
    per_customer_limit: parsed.data.perCustomerLimit,
    first_order_only: parsed.data.firstOrderOnly,
    is_public: parsed.data.isPublic,
    show_in_offers: parsed.data.showInOffers,
  };

  if (id) {
    const { error } = await context.admin.from("coupons").update(payload).eq("id", id);
    if (error) return { status: "error", message: databaseMessage(error) };
  } else {
    const { error } = await context.admin.from("coupons").insert(payload);
    if (error) return { status: "error", message: databaseMessage(error) };
  }

  refreshPromotions();
  redirect(`/admin/coupons?saved=${encodeURIComponent(parsed.data.code)}`);
}

export async function toggleCouponActiveAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  const next = flagged(formData, "nextActive");
  if (!id) return { status: "error", message: "That coupon could not be found." };

  const { error } = await context.admin
    .from("coupons")
    .update({ is_active: next })
    .eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshPromotions();
  return {
    status: "success",
    message: next ? "Coupon activated." : "Coupon paused.",
  };
}

export async function saveComboAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim() || null;
  const bundlePrice = rupeesToPaise(formData, "bundlePrice");
  if (bundlePrice === undefined) {
    return { status: "error", message: "Enter a valid bundle price." };
  }

  const rawItems = jsonValue(formData, "items");
  const parsed = comboInputSchema.safeParse({
    title: text(formData, "title"),
    slug: text(formData, "slug").trim() || slugify(text(formData, "title")),
    description: text(formData, "description"),
    imageUrl: text(formData, "imageUrl"),
    bundlePrice: bundlePrice ?? 0,
    audience: text(formData, "audience", "all"),
    isActive: flagged(formData, "isActive"),
    showInOffers: flagged(formData, "showInOffers"),
    sortOrder: integer(formData, "sortOrder"),
    startsAt: isoDate(formData, "startsAt"),
    endsAt: isoDate(formData, "endsAt"),
    items: Array.isArray(rawItems) ? rawItems : [],
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const slugQuery = context.admin
    .from("combos")
    .select("id")
    .eq("slug", parsed.data.slug);
  if (id) slugQuery.neq("id", id);
  const { data: slugMatch } = await slugQuery.maybeSingle();
  if (slugMatch) {
    return { status: "error", message: "That slug is already used by another combo." };
  }

  const variantIds = parsed.data.items.map((item) => item.variantId);
  const { data: variants, error: variantError } = await context.admin
    .from("product_variants")
    .select("id")
    .in("id", variantIds);
  if (variantError) return { status: "error", message: databaseMessage(variantError) };
  if ((variants ?? []).length !== new Set(variantIds).size) {
    return { status: "error", message: "One of those variants no longer exists." };
  }

  const payload = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description,
    image_url: parsed.data.imageUrl,
    bundle_price: parsed.data.bundlePrice,
    audience: parsed.data.audience,
    is_active: parsed.data.isActive,
    show_in_offers: parsed.data.showInOffers,
    sort_order: parsed.data.sortOrder,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
  };

  let comboId = id;
  if (id) {
    const { error } = await context.admin.from("combos").update(payload).eq("id", id);
    if (error) return { status: "error", message: databaseMessage(error) };
  } else {
    const { data, error } = await context.admin
      .from("combos")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      return { status: "error", message: databaseMessage(error ?? { message: "" }) };
    }
    comboId = data.id as string;
  }
  if (!comboId) return { status: "error", message: "The combo could not be saved." };

  const { error: clearError } = await context.admin
    .from("combo_items")
    .delete()
    .eq("combo_id", comboId);
  if (clearError) return { status: "error", message: databaseMessage(clearError) };

  const { error: itemsError } = await context.admin.from("combo_items").insert(
    parsed.data.items.map((item) => ({
      combo_id: comboId,
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
  );
  if (itemsError) return { status: "error", message: databaseMessage(itemsError) };

  refreshPromotions();
  redirect(`/admin/combos?saved=${encodeURIComponent(parsed.data.title)}`);
}

export async function toggleComboActiveAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await adminActionContext();
  if (!context.ok) return { status: "error", message: context.message };

  const id = text(formData, "id").trim();
  const next = flagged(formData, "nextActive");
  if (!id) return { status: "error", message: "That combo could not be found." };

  const { error } = await context.admin
    .from("combos")
    .update({ is_active: next })
    .eq("id", id);
  if (error) return { status: "error", message: databaseMessage(error) };

  refreshPromotions();
  return {
    status: "success",
    message: next ? "Combo activated." : "Combo paused.",
  };
}
