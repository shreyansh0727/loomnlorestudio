export interface RazorpayCheckoutSuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutFailure {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpayCheckoutSuccess) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export interface RazorpayCheckoutInstance {
  open(): void;
  on(
    event: "payment.failed",
    handler: (response: RazorpayCheckoutFailure) => void,
  ): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckoutInstance;
  }
}
