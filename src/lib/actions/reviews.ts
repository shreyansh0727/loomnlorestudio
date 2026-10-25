"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";

const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

const reviewInputSchema = z.object({
  token: z.uuid("That review link is not valid."),
  productId: z.uuid("Choose a piece to review."),
  reviewerName: z
    .string()
    .trim()
    .min(2, "Add the name you would like shown with your review.")
    .max(60, "Keep the name under 60 characters."),
  rating: z.coerce
    .number()
    .int("Choose a star rating.")
    .min(1, "Choose a star rating.")
    .max(5, "Choose a star rating."),
  title: z.string().trim().max(100, "Keep the title under 100 characters."),
  body: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least 10 characters.")
    .max(2000, "Keep your review under 2,000 characters."),
});

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the review and try again.";
}

function detectImageMime(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(0, 4) === "GIF8") return "image/gif";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) {
    return "image/avif";
  }
  return null;
}

function photoFiles(formData: FormData) {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File)
    .filter((file) => file.size > 0);
}

export async function submitReviewAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = reviewInputSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    productId: String(formData.get("productId") ?? ""),
    reviewerName: String(formData.get("reviewerName") ?? ""),
    rating: formData.get("rating"),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) return { status: "error", message: firstIssue(parsed.error) };

  const admin = getSupabaseAdminClientSafe();
  if (!admin) {
    return {
      status: "error",
      message:
        "Reviews will be accepted once the store is connected to its database. Please try again later.",
    };
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,status,customer_name,items:order_items(product_id,item_type)")
    .eq("access_token", parsed.data.token)
    .maybeSingle();

  if (orderError || !order) {
    return { status: "error", message: "That review link is no longer valid." };
  }

  if (order.status !== "delivered") {
    return {
      status: "error",
      message: "Reviews open once your parcel has been marked delivered.",
    };
  }

  const items = (order.items ?? []) as { product_id: string | null; item_type: string }[];
  const bought = items.some(
    (item) => item.item_type === "product" && item.product_id === parsed.data.productId,
  );
  if (!bought) {
    return {
      status: "error",
      message: "This piece is not part of the order linked to your review.",
    };
  }

  const { data: existing, error: existingError } = await admin
    .from("product_reviews")
    .select("id")
    .eq("order_id", order.id)
    .eq("product_id", parsed.data.productId)
    .maybeSingle();

  if (existingError) {
    return { status: "error", message: "We could not check this review. Please try again." };
  }
  if (existing) {
    return {
      status: "success",
      message: "You have already shared a review for this piece. Thank you again.",
    };
  }

  const files = photoFiles(formData);
  if (files.length > MAX_PHOTOS) {
    return { status: "error", message: `Add up to ${MAX_PHOTOS} photos.` };
  }

  const prepared: { buffer: Buffer; mime: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_PHOTO_BYTES) {
      return { status: "error", message: "Each photo needs to be 4 MB or smaller." };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = detectImageMime(buffer);
    if (!mime || !IMAGE_EXTENSIONS[mime]) {
      return {
        status: "error",
        message: "Photos must be JPEG, PNG, WebP, GIF or AVIF images.",
      };
    }
    prepared.push({ buffer, mime });
  }

  const uploadedPaths: string[] = [];
  const imageUrls: string[] = [];

  for (const photo of prepared) {
    const path = `reviews/${order.id}/${Date.now()}-${crypto
      .randomUUID()
      .slice(0, 8)}.${IMAGE_EXTENSIONS[photo.mime]}`;
    const { error: uploadError } = await admin.storage
      .from("media")
      .upload(path, photo.buffer, {
        contentType: photo.mime,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      if (uploadedPaths.length) {
        await admin.storage.from("media").remove(uploadedPaths);
      }
      return {
        status: "error",
        message: "We could not upload your photos. Please try again.",
      };
    }

    uploadedPaths.push(path);
    const { data } = admin.storage.from("media").getPublicUrl(path);
    imageUrls.push(data.publicUrl);
  }

  const { error: insertError } = await admin.from("product_reviews").insert({
    product_id: parsed.data.productId,
    order_id: order.id,
    reviewer_name: parsed.data.reviewerName,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body,
    images: imageUrls,
    is_published: true,
  });

  if (insertError) {
    if (uploadedPaths.length) {
      await admin.storage.from("media").remove(uploadedPaths);
    }
    if (insertError.code === "23505") {
      return {
        status: "success",
        message: "You have already shared a review for this piece. Thank you again.",
      };
    }
    return {
      status: "error",
      message: "We could not save your review right now. Please try again.",
    };
  }

  const { data: product } = await admin
    .from("products")
    .select("slug")
    .eq("id", parsed.data.productId)
    .maybeSingle();

  revalidateTag("reviews", { expire: 0 });
  revalidatePath("/");
  revalidatePath(`/review/${parsed.data.token}`);
  if (product?.slug) revalidatePath(`/shop/${product.slug}`);

  return {
    status: "success",
    message: "Thank you — your review is live on the storefront.",
  };
}
