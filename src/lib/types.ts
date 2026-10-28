export type BuyerType = "b2c" | "b2b";

export type ProfileRole = "customer" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: ProfileRole;
  account_type: BuyerType;
  created_at: string;
  updated_at: string;
}

export type BusinessStatus = "pending" | "approved" | "rejected";

export interface Business {
  id: string;
  owner_id: string;
  legal_name: string;
  trade_name: string | null;
  gstin: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  status: BusinessStatus;
  admin_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export enum AccountType {
  B2C = "b2c",
  B2B = "b2b",
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string;
  sku: string | null;
  stock_qty: number;
  retail_price_override: number | null;
  wholesale_price_override: number | null;
  is_active: boolean;
  sort_order: number;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string;
  retail_price: number;
  compare_at_price: number | null;
  wholesale_price: number | null;
  moq: number;
  unit: string;
  images: string[];
  tags: string[];
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  variants: ProductVariant[];
}

export interface ComboItem {
  id: string;
  combo_id: string;
  variant_id: string;
  quantity: number;
  product?:
    | Pick<Product, "id" | "name" | "slug" | "images" | "retail_price">
    | null;
  variant?: Pick<ProductVariant, "id" | "label" | "sku" | "stock_qty"> | null;
}

export interface Combo {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  bundle_price: number;
  audience: BuyerType | "all";
  is_active: boolean;
  show_in_offers: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  items: ComboItem[];
  retail_value?: number;
}

export type CouponDiscountType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  label: string | null;
  description: string | null;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  audience: BuyerType | "all";
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  first_order_only: boolean;
  is_public: boolean;
  show_in_offers: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  order_id: string;
  user_id: string | null;
  email: string;
  discount_amount: number;
  created_at: string;
}

export interface Address {
  full_name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export const ORDER_STATUSES = [
  "pending_payment",
  "payment_review",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SHIPPING_PAYMENT_STATUSES = ["not_required", "pending", "paid"] as const;

export type ShippingPaymentStatus = (typeof SHIPPING_PAYMENT_STATUSES)[number];

export interface OrderItemComponent {
  variant_id: string;
  product_id?: string | null;
  product_name: string;
  variant_label: string;
  sku: string | null;
  quantity: number;
}

export interface OrderItemMetadata {
  components?: OrderItemComponent[];
  combo_id?: string;
  combo_slug?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  combo_id: string | null;
  item_type: "product" | "combo";
  name: string;
  variant_label: string | null;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  metadata: OrderItemMetadata;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  access_token: string;
  invoice_number: string | null;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  buyer_type: BuyerType;
  business_id: string | null;
  business_legal_name: string | null;
  business_gstin: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_payment_status: ShippingPaymentStatus;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  product_total: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  coupon_id: string | null;
  coupon_code: string | null;
  coupon_label: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_shipping_payment_id: string | null;
  shipping_payment_link_id: string | null;
  shipping_payment_link_url: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_address: Address;
  billing_address: Address;
  customer_note: string | null;
  internal_notes: string | null;
  stock_reserved_at: string | null;
  stock_restored_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  refund_amount: number;
  refund_reference: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export type OrderEventType =
  | "order_created"
  | "payment_received"
  | "payment_review"
  | "status_change"
  | "note"
  | "shipping_payment_requested"
  | "shipping_payment_received"
  | "refund_recorded"
  | "stock_restored";

export interface OrderEvent {
  id: string;
  order_id: string;
  event_type: OrderEventType;
  status: OrderStatus | null;
  message: string;
  created_by: string | null;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  order_id: string;
  reviewer_name: string;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  product?: Pick<Product, "id" | "name" | "slug" | "images"> | null;
}

export const HOMEPAGE_SECTION_TYPES = [
  "hero",
  "offer_ticker",
  "category_grid",
  "product_rail",
  "banner",
  "editorial",
  "combo_rail",
  "reviews",
] as const;

export type HomepageSectionType = (typeof HOMEPAGE_SECTION_TYPES)[number];

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  media_type: "image" | "video";
  image_url: string;
  video_url: string;
  poster_url: string;
  cta_label: string;
  cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  align: "left" | "center" | "right";
  tone: "light" | "dark";
}

export interface HeroConfig {
  slides: HeroSlide[];
}

export interface OfferTickerItem {
  id: string;
  text: string;
  coupon_code: string;
  href: string;
}

export interface OfferTickerConfig {
  items: OfferTickerItem[];
}

export interface CategoryGridConfig {
  category_ids: string[];
}

export interface ProductRailSource {
  source: "new_arrivals" | "featured" | "best_sellers" | "category" | "manual";
  category_id: string;
  product_ids: string[];
  limit: number;
}

export interface BannerConfig {
  image_url: string;
  mobile_image_url: string;
  eyebrow: string;
  heading: string;
  body: string;
  cta_label: string;
  cta_href: string;
  tone: "light" | "dark";
  align: "left" | "center" | "right";
}

export interface EditorialConfig {
  image_url: string;
  eyebrow: string;
  heading: string;
  body: string;
  cta_label: string;
  cta_href: string;
  image_position: "left" | "right";
}

export interface ComboRailConfig {
  limit: number;
}

export interface ReviewsConfig {
  limit: number;
}

export interface HomepageConfigMap {
  hero: HeroConfig;
  offer_ticker: OfferTickerConfig;
  category_grid: CategoryGridConfig;
  product_rail: ProductRailSource;
  banner: BannerConfig;
  editorial: EditorialConfig;
  combo_rail: ComboRailConfig;
  reviews: ReviewsConfig;
}

interface HomepageSectionBase {
  id: string;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export type HomepageSection = {
  [K in HomepageSectionType]: HomepageSectionBase & {
    section_type: K;
    config: HomepageConfigMap[K];
  };
}[HomepageSectionType];

export type PopupFrequency = "once_per_visit" | "once_per_day" | "always";

export interface PopupOffer {
  id: string;
  headline: string;
  body: string;
  image_url: string | null;
  coupon_code: string | null;
  cta_label: string | null;
  cta_href: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  delay_seconds: number;
  frequency: PopupFrequency;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface SellerAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface SiteSettings {
  brandName: string;
  brandTagline: string;
  logoUrl: string | null;
  announcementText: string;
  announcementHref: string;
  announcementActive: boolean;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  sellerLegalName: string;
  sellerGstin: string;
  sellerAddress: SellerAddress;
  gstRate: number;
  invoicePrefix: string;
  b2bEmail: string;
  instagramUrl: string;
  facebookUrl: string;
  pinterestUrl: string;
  aboutText: string;
  shippingPolicy: string;
  returnsPolicy: string;
}

export interface EmailLog {
  id: string;
  order_id: string | null;
  recipient: string;
  template: string;
  subject: string;
  status: "sent" | "skipped" | "failed";
  provider_id: string | null;
  error: string | null;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  variant_id: string;
  order_id: string | null;
  change_qty: number;
  reason: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface OfferCard {
  id: string;
  kind: "coupon" | "combo";
  title: string;
  description: string;
  code?: string;
  href: string;
  meta?: string;
}

export type AdminDraftKind = "product" | "coupon" | "combo" | "section" | "popup";

export type DraftPayload = Record<string, string | boolean>;

export interface AdminDraft {
  id: string;
  kind: AdminDraftKind;
  label: string;
  payload: DraftPayload;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Viewer {
  user: {
    id: string;
    email: string | null;
    emailConfirmed: boolean;
  } | null;
  profile: Profile | null;
  business: Business | null;
  isAdmin: boolean;
  isB2B: boolean;
}
