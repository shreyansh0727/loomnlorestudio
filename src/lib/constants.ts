import type {
  OrderStatus,
  SiteSettings,
  HomepageSectionType,
  BuyerType,
} from "@/lib/types";

export const MAX_B2C_QUANTITY = 10;
export const DEFAULT_GST_RATE = 5;
export const PAGE_SIZE = 12;

export const BRAND_NAME = "Buniya";

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
  processing: "We are preparing your pieces by hand.",
  packed: "Your order is packed and awaiting dispatch.",
  shipped: "The parcel has left our workroom.",
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
  reviews: "Customer reviews",
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
  brandTagline: "Crafted with Care. Made to Inspire.",
  logoUrl: null,
  announcementText:
    "Handmade in Varanasi · Korean pastel palettes · Retail & wholesale",
  announcementHref: "/shop",
  announcementActive: true,
  supportEmail: "laxmigroup04@gmail.com",
  supportPhone: "+91 9569534462",
  whatsapp: "+91 7617810344",
  sellerLegalName: "Laxmi Creation",
  sellerGstin: "09EIVPP8259M1ZU",
  sellerAddress: {
    line1: "D65/462-C-2, Amla Nagar",
    line2: "Lahartara Chauraha (Near Tata Motors Service Center)",
    city: "Varanasi",
    state: "Uttar Pradesh",
    pincode: "221106",
    country: "India",
  },
  gstRate: DEFAULT_GST_RATE,
  invoicePrefix: "LC",
  b2bEmail: "laxmigroup04@gmail.com",
  instagramUrl: "https://instagram.com",
  facebookUrl: "https://facebook.com",
  pinterestUrl: "https://pinterest.com",
  aboutText:
    "Buniya is a small handmade accessories workroom in Varanasi, a Laxmi Collection brand. We cut, stitch and finish every scrunchie, bow, tie and headband by hand in soft satins, cottons and Korean pastels. Runs stay small, finishes stay personal, and every piece is checked by the same hands that made it.",
  shippingPolicy:
    "Every piece is made and packed by hand in Varanasi and leaves our workroom in 2–4 working days. Retail shipping is fixed by delivery zone — ₹60 within Varanasi city, ₹70 elsewhere in Uttar Pradesh and ₹80 to other states — and is added to your order total at checkout. Wholesale shipping is quoted separately because parcel weight and destination vary; once your order is confirmed we email a secure Razorpay link for the exact charge. Tracking details appear on your private order page.",
  returnsPolicy:
    "Ready-made accessories can be returned unused and in their original packaging within 7 days of delivery. Custom and made-to-order pieces are final sale. Write to us with your order number to start a return; refunds are recorded after the piece passes inspection. Wholesale returns are agreed with our trade team before shipping back.",
};

export const RAZORPAY_THEME_COLOR = "#c8657f";
