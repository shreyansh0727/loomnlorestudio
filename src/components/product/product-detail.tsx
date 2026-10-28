"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { variantImageUrl } from "@/lib/utils";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchasePanel } from "@/components/product/product-purchase-panel";

export function ProductDetail({
  product,
  isB2B,
  isSignedIn,
  shippingPolicy,
  returnsPolicy,
}: {
  product: Product;
  isB2B: boolean;
  isSignedIn: boolean;
  shippingPolicy: string;
  returnsPolicy: string;
}) {
  const variants = product.variants.filter((variant) => variant.is_active);
  const firstAvailable =
    variants.find((variant) => variant.stock_qty > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const selected = variants.find((variant) => variant.id === variantId) ?? null;
  const variantImage = variantImageUrl(selected);

  return (
    <div className="mt-7 grid items-start gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16 xl:gap-20">
      <ProductGallery
        key={variantImage || "cover"}
        images={product.images}
        name={product.name}
        variantImage={variantImage || null}
      />
      <ProductPurchasePanel
        product={product}
        isB2B={isB2B}
        isSignedIn={isSignedIn}
        shippingPolicy={shippingPolicy}
        returnsPolicy={returnsPolicy}
        variantId={variantId}
        onVariantChange={setVariantId}
      />
    </div>
  );
}
