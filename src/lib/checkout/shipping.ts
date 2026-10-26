import type { BuyerType } from "@/lib/types";

export type ShippingZone = "local" | "same_state" | "other_state";

/** Fixed retail shipping in paise: same city, another city in the state, another state. */
export const RETAIL_SHIPPING_RATES: Record<ShippingZone, number> = {
  local: 6000,
  same_state: 7000,
  other_state: 8000,
};

export const RETAIL_SHIPPING_LABELS: Record<ShippingZone, string> = {
  local: "Local zone",
  same_state: "Another city",
  other_state: "Another state",
};

function normalizePlace(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function shippingZoneFor({
  city,
  state,
  originCity,
  originState,
}: {
  city: string | null | undefined;
  state: string | null | undefined;
  originCity: string;
  originState: string;
}): ShippingZone | null {
  const deliveryState = normalizePlace(state);
  const sellerState = normalizePlace(originState);
  if (!deliveryState || !sellerState) return null;
  if (deliveryState !== sellerState) return "other_state";

  const deliveryCity = normalizePlace(city);
  if (!deliveryCity) return null;
  return deliveryCity === normalizePlace(originCity) ? "local" : "same_state";
}

export function retailShippingAmount(buyerType: BuyerType, zone: ShippingZone | null) {
  if (buyerType !== "b2c" || !zone) return 0;
  return RETAIL_SHIPPING_RATES[zone];
}
