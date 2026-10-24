import type {
  Address,
  BuyerType,
  OrderItemComponent,
} from "@/lib/types";

export interface CheckoutLineInput {
  kind: "product" | "combo";
  id: string;
  quantity: number;
}

export interface CheckoutQuoteLine {
  key: string;
  kind: "product" | "combo";
  productId: string | null;
  variantId: string | null;
  comboId: string | null;
  comboSlug: string | null;
  name: string;
  slug: string;
  variantLabel: string | null;
  sku: string | null;
  imageUrl: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  components: OrderItemComponent[];
}

export interface CheckoutCouponSummary {
  id: string;
  code: string;
  label: string | null;
  discountAmount: number;
}

export interface CheckoutQuote {
  buyerType: BuyerType;
  lines: CheckoutQuoteLine[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  productTotal: number;
  shippingAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  coupon: CheckoutCouponSummary | null;
}

export interface CheckoutQuoteSuccess {
  ok: true;
  quote: CheckoutQuote;
  couponError: string | null;
}

export interface CheckoutFailure {
  ok: false;
  message: string;
  field?: "coupon" | "lines" | "form";
}

export type CheckoutQuoteResult = CheckoutQuoteSuccess | CheckoutFailure;

export interface RazorpayPaymentConfig {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  themeColor: string;
}

export interface CheckoutOrderReceipt {
  orderId: string;
  orderNumber: string;
  accessToken: string;
  totalAmount: number;
}

export type StartCheckoutResult =
  | {
      ok: true;
      mode: "razorpay";
      payment: RazorpayPaymentConfig;
      receipt: CheckoutOrderReceipt;
    }
  | {
      ok: true;
      mode: "free";
      receipt: CheckoutOrderReceipt;
    }
  | CheckoutFailure;

export type VerifyPaymentResult =
  | {
      ok: true;
      accessToken: string;
      orderNumber: string;
      status: "confirmed" | "payment_review";
    }
  | {
      ok: false;
      message: string;
      accessToken?: string;
    };

export type VerifyPaymentInput = {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export interface CheckoutViewer {
  isB2B: boolean;
  email: string | null;
  fullName: string;
  phone: string;
  business: {
    legalName: string;
    tradeName: string | null;
    gstin: string;
    email: string;
    phone: string;
    address: Address;
  } | null;
}

export interface CheckoutSettings {
  gstRate: number;
  brandName: string;
  supportEmail: string;
  shippingPolicy: string;
  returnsPolicy: string;
}
