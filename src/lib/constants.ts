import type {
  OrderStatus,
  SiteSettings,
  HomepageSectionType,
  BuyerType,
} from "@/lib/types";

export const MAX_B2C_QUANTITY = 10;
export const DEFAULT_GST_RATE = 5;
export const PAGE_SIZE = 12;

export const BRAND_NAME = "Loom & Lore";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  payment_review: "Payment review",
  confirmed: "Order confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refund_requested: "Refund requested",
  refunded: "Refunded",
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending_payment: "Payment has not been completed yet.",
  payment_review: "Payment was received, but stock needs manual review.",
  confirmed: "Payment received and the order is in our queue.",
  processing: "We are preparing the textiles for your order.",
  packed: "Your order is packed and awaiting dispatch.",
  shipped: "The parcel has left our studio.",
  delivered: "The parcel has been delivered.",
  cancelled: "This order was cancelled.",
  refund_requested: "A refund is being reviewed.",
  refunded: "The refund has been recorded.",
};

export const ADMIN_STATUS_OPTIONS: OrderStatus[] = [
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded",
];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionType, string> = {
  hero: "Hero carousel",
  offer_ticker: "Offer ticker",
  category_grid: "Category grid",
  product_rail: "Product rail",
  banner: "Full-width banner",
  editorial: "Editorial story",
  combo_rail: "Combo rail",
};

export const BUYER_TYPE_LABELS: Record<BuyerType, string> = {
  b2c: "Retail (B2C)",
  b2b: "Wholesale (B2B)",
};

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const PRODUCT_UNITS = [
  { value: "piece", label: "Per piece" },
  { value: "metre", label: "Per metre" },
  { value: "set", label: "Per set" },
  { value: "pack", label: "Per pack" },
  { value: "bundle", label: "Per bundle" },
] as const;

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: BRAND_NAME,
  brandTagline: "Textiles with a sense of place",
  logoUrl: null,
  announcementText:
    "Complimentary design advice · Thoughtfully sourced natural fibres · Made in small batches",
  announcementHref: "/shop",
  announcementActive: true,
  supportEmail: "hello@loomandlore.example",
  supportPhone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  sellerLegalName: "Loom & Lore Textiles",
  sellerGstin: "",
  sellerAddress: {
    line1: "14, Design Quarter",
    line2: "Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    country: "India",
  },
  gstRate: DEFAULT_GST_RATE,
  invoicePrefix: "LL",
  b2bEmail: "trade@loomandlore.example",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",
  pinterestUrl: "https://pinterest.com",
  aboutText:
    "We work with weavers, printers and family-run studios across India to create textiles that are tactile, useful and made to last. Every collection begins with the material.",
  shippingPolicy:
    "Orders are prepared by hand in 2–4 business days. Final shipping is quoted after your order is confirmed because textiles are packed and dispatched manually. We will email a secure shipping payment link before dispatch.",
  returnsPolicy:
    "Cut fabric and made-to-order pieces are final sale. Ready-made items can be returned unused within 7 days of delivery. Refunds are recorded after the returned goods pass inspection.",
};

export const RAZORPAY_THEME_COLOR = "#a4543a";
