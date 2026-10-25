"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Info,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { SafeImage } from "@/components/ui/safe-image";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonStyles } from "@/components/ui/button";
import {
  Checkbox,
  Field,
  FormMessage,
  Input,
  Select,
  Textarea,
} from "@/components/ui/form";
import { INDIAN_STATES } from "@/lib/constants";
import type { CartLine } from "@/lib/cart/types";
import type {
  CheckoutQuote,
  CheckoutSettings,
  CheckoutViewer,
  RazorpayPaymentConfig,
  StartCheckoutResult,
} from "@/lib/checkout/types";
import type { CheckoutLineInput } from "@/lib/validation";
import {
  quoteCheckoutAction,
  startCheckoutAction,
  verifyCheckoutPaymentAction,
} from "@/lib/actions/checkout";
import type { RazorpayOptions } from "@/types/razorpay";
import { formatMoney, unitLabel } from "@/lib/utils";

type RazorpayStart = Extract<StartCheckoutResult, { ok: true; mode: "razorpay" }>;

type Phase = "idle" | "placing" | "opening" | "awaiting" | "verifying";

interface QuoteState {
  signature: string;
  quote: CheckoutQuote | null;
  error: string | null;
}

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  note: string;
}

interface PendingAttempt {
  fingerprint: string;
  receipt: RazorpayStart["receipt"];
  payment: RazorpayPaymentConfig;
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: "",
  placing: "Preparing secure payment…",
  opening: "Opening Razorpay…",
  awaiting: "Complete payment in Razorpay",
  verifying: "Confirming payment…",
};

const COUPON_PATTERN = /^[A-Z0-9_-]{3,32}$/;

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = null;
      script.remove();
      reject(new Error("Could not load the Razorpay checkout."));
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

function cartInputs(lines: CartLine[]): CheckoutLineInput[] {
  return lines.map((line) =>
    line.kind === "product"
      ? { kind: "product", id: line.variantId, quantity: line.quantity }
      : { kind: "combo", id: line.comboId, quantity: line.quantity },
  );
}

function SectionHeading({
  step,
  title,
  note,
}: {
  step: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
      <h2 className="flex items-baseline gap-3 font-serif text-2xl font-light tracking-[-0.025em]">
        <span className="text-[0.58rem] font-semibold tracking-[0.2em] text-clay">
          {step}
        </span>
        {title}
      </h2>
      {note ? <p className="text-xs text-muted">{note}</p> : null}
    </div>
  );
}

interface SummaryLine {
  key: string;
  name: string;
  variantLabel: string;
  imageUrl: string;
  quantity: number;
  unit: string;
  lineTotal: number;
}

export function CheckoutView({
  viewer,
  settings,
  paymentsReady,
}: {
  viewer: CheckoutViewer;
  settings: CheckoutSettings;
  paymentsReady: boolean;
}) {
  const router = useRouter();
  const { lines, hydrated, clearCart } = useCart();
  const business = viewer.business;

  const [form, setForm] = useState<CheckoutForm>({
    fullName: viewer.fullName,
    email: viewer.email ?? business?.email ?? "",
    phone: viewer.phone,
    addressLine1: business?.address.line1 ?? "",
    addressLine2: business?.address.line2 ?? "",
    city: business?.address.city ?? "",
    state: business?.address.state ?? "",
    pincode: business?.address.pincode ?? "",
    note: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponFieldError, setCouponFieldError] = useState<string | null>(null);
  const [couponNotice, setCouponNotice] = useState<string | null>(null);
  const [quoteEmail, setQuoteEmail] = useState(viewer.email ?? "");
  const [quoteState, setQuoteState] = useState<QuoteState | null>(null);
  const quoteSeq = useRef(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [pendingAttempt, setPendingAttempt] = useState<PendingAttempt | null>(null);
  const completedRef = useRef(false);

  const cartSignature = lines
    .map((line) =>
      line.kind === "product"
        ? `p:${line.variantId}:${line.quantity}`
        : `c:${line.comboId}:${line.quantity}`,
    )
    .sort()
    .join("|");
  const signature = `${cartSignature}::${appliedCoupon ?? ""}::${quoteEmail}`;

  const quoteIsCurrent = quoteState?.signature === signature;
  const quote = quoteIsCurrent ? quoteState.quote : null;
  const quoteError = quoteIsCurrent ? quoteState.error : null;
  const quoteLoading = hydrated && lines.length > 0 && !quoteIsCurrent;
  const couponSummary = quote?.coupon ?? null;
  const itemCount = quote?.itemCount ?? lines.reduce((total, line) => total + line.quantity, 0);

  useEffect(() => {
    const next = form.email.trim().toLowerCase();
    if (!next || !next.includes("@") || next === quoteEmail) return;
    const timer = setTimeout(() => setQuoteEmail(next), 600);
    return () => clearTimeout(timer);
  }, [form.email, quoteEmail]);

  useEffect(() => {
    if (!hydrated || lines.length === 0) return;

    const seq = ++quoteSeq.current;
    const currentSignature = signature;
    const inputs = cartInputs(lines);
    const timer = setTimeout(() => {
      quoteCheckoutAction({
        lines: inputs,
        couponCode: appliedCoupon,
        email: quoteEmail || null,
      })
        .then((result) => {
          if (seq !== quoteSeq.current) return;

          if (result.ok && result.couponError) {
            setCouponNotice(result.couponError);
            setAppliedCoupon(null);
          } else if (result.ok && result.quote.coupon) {
            setCouponNotice(null);
          }

          setQuoteState({
            signature: currentSignature,
            quote: result.ok ? result.quote : null,
            error: result.ok ? null : result.message,
          });
        })
        .catch(() => {
          if (seq !== quoteSeq.current) return;
          setQuoteState({
            signature: currentSignature,
            quote: null,
            error: "We could not check your bag right now. Please try again in a moment.",
          });
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [appliedCoupon, hydrated, lines, quoteEmail, signature]);

  function setField<K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function applyCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!COUPON_PATTERN.test(code)) {
      setCouponFieldError("Enter a valid coupon code.");
      return;
    }
    setCouponFieldError(null);
    setCouponNotice(null);
    setAppliedCoupon(code);
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponFieldError(null);
    setCouponNotice(null);
    setSubmitError(null);
  }

  function fingerprintFor() {
    return JSON.stringify([
      signature,
      form.fullName.trim(),
      form.email.trim().toLowerCase(),
      form.phone.trim(),
      form.addressLine1.trim(),
      form.addressLine2.trim(),
      form.city.trim(),
      form.state,
      form.pincode.trim(),
      form.note.trim(),
    ]);
  }

  function openRazorpay(attempt: PendingAttempt) {
    const RazorpayCheckout = window.Razorpay;
    if (!RazorpayCheckout) {
      throw new Error("Could not load the Razorpay checkout.");
    }

    completedRef.current = false;

    const options: RazorpayOptions = {
      key: attempt.payment.keyId,
      amount: attempt.payment.amount,
      currency: attempt.payment.currency,
      order_id: attempt.payment.razorpayOrderId,
      name: attempt.payment.name,
      description: attempt.payment.description,
      prefill: attempt.payment.prefill,
      theme: { color: attempt.payment.themeColor },
      handler: async (response) => {
        completedRef.current = true;
        setPhase("verifying");
        try {
          const verified = await verifyCheckoutPaymentAction({
            orderId: attempt.receipt.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verified.ok) {
            clearCart();
            router.push(`/order/${verified.accessToken}?placed=1`);
            return;
          }

          setSubmitError(verified.message);
          setRecoveryToken(verified.accessToken ?? attempt.receipt.accessToken);
          setPhase("idle");
        } catch {
          setSubmitError(
            "Your payment may have been received, but we could not confirm it here. Open your order page to check the latest status.",
          );
          setRecoveryToken(attempt.receipt.accessToken);
          setPhase("idle");
        }
      },
      modal: {
        ondismiss: () => {
          if (completedRef.current) return;
          setSubmitError(
            "The payment window was closed before payment. Your order is saved — you can retry the secure payment or open the order page.",
          );
          setPhase("idle");
        },
      },
    };

    const checkout = new RazorpayCheckout(options);
    checkout.on("payment.failed", (failure) => {
      setSubmitError(
        `${failure.error?.description ?? "The payment could not be completed."} No money has been taken for this attempt.`,
      );
      setPhase("idle");
    });
    checkout.open();
    setPhase("awaiting");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase !== "idle") return;

    if (!paymentsReady) {
      setSubmitError(
        "Online payments are not connected yet. Add your Supabase service role key and Razorpay test keys to .env.local, then restart the app.",
      );
      return;
    }
    if (!quote) {
      setSubmitError(
        quoteError ?? "We are still checking your bag. Please wait a moment and try again.",
      );
      return;
    }
    if (!termsAccepted) {
      setSubmitError("Please accept the order terms to continue.");
      return;
    }

    setSubmitError(null);
    setPhase("placing");

    try {
      const fingerprint = fingerprintFor();
      let attempt: PendingAttempt | null =
        pendingAttempt && pendingAttempt.fingerprint === fingerprint ? pendingAttempt : null;

      if (!attempt) {
        const result = await startCheckoutAction({
          lines: cartInputs(lines),
          couponCode: appliedCoupon,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          customerNote: form.note,
          terms: termsAccepted,
        });

        if (!result.ok) {
          setSubmitError(result.message);
          if (result.field === "coupon") {
            setCouponNotice(result.message);
            setAppliedCoupon(null);
          }
          setPhase("idle");
          return;
        }

        setRecoveryToken(result.receipt.accessToken);

        if (result.mode === "free") {
          clearCart();
          router.push(`/order/${result.receipt.accessToken}?placed=1`);
          return;
        }

        attempt = {
          fingerprint,
          receipt: result.receipt,
          payment: result.payment,
        };
        setPendingAttempt(attempt);
      }

      setPhase("opening");
      try {
        await loadRazorpayScript();
        openRazorpay(attempt);
      } catch {
        setSubmitError(
          "We could not open the secure payment window. No payment was taken. Check your connection and try again, or open your order page.",
        );
        setPhase("idle");
      }
    } catch {
      setSubmitError(
        "We could not place the order. No payment was taken. Please check your details and try again.",
      );
      setPhase("idle");
    }
  }

  const summaryLines: SummaryLine[] = quote
    ? quote.lines.map((line) => ({
        key: line.key,
        name: line.name,
        variantLabel: line.variantLabel ?? "Bundle",
        imageUrl: line.imageUrl,
        quantity: line.quantity,
        unit: line.unit,
        lineTotal: line.lineTotal,
      }))
    : lines.map((line) => ({
        key: line.key,
        name: line.name,
        variantLabel: line.kind === "combo" ? "Bundle" : line.variantLabel,
        imageUrl: line.imageUrl,
        quantity: line.quantity,
        unit: line.unit,
        lineTotal: line.unitPrice * line.quantity,
      }));

  const busy = phase !== "idle";
  const totalLabel = quote ? formatMoney(quote.totalAmount) : "—";
  const payLabel = phase !== "idle"
    ? PHASE_LABELS[phase]
    : quote && quote.totalAmount === 0
      ? "Place order"
      : `Pay ${totalLabel} securely`;
  const canPay = paymentsReady && Boolean(quote) && !quoteLoading && !quoteError && !busy;
  const couponMessage = couponFieldError ?? couponNotice;

  if (!hydrated) {
    return (
      <div className="editorial-container py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,22rem)]">
          <div className="h-[32rem] animate-pulse border border-line bg-cream/60" />
          <div className="h-96 animate-pulse border border-line bg-cream/60" />
        </div>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="editorial-container py-14 lg:py-20">
        <EmptyState
          icon={<ShoppingBag className="size-7" strokeWidth={1.3} />}
          title="There is nothing to check out yet"
          description="Add a scrunchie, a bow or a little bundle, then return here to complete your order."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/shop" className={buttonStyles({ size: "md" })}>
                Browse the collection
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/offers"
                className={buttonStyles({ size: "md", variant: "secondary" })}
              >
                View offers
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="editorial-container py-10 lg:py-14">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,22rem)] xl:gap-16">
        <form id="checkout-form" onSubmit={handleSubmit} className="min-w-0 space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-cream/70 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-clay">
                {business ? (
                  <Building2 className="size-4" strokeWidth={1.5} />
                ) : viewer.email ? (
                  <UserRound className="size-4" strokeWidth={1.5} />
                ) : (
                  <ShoppingBag className="size-4" strokeWidth={1.5} />
                )}
              </span>
              <div className="text-xs leading-relaxed text-ink-soft">
                {business ? (
                  <>
                    <p className="font-semibold uppercase tracking-[0.12em] text-sage">
                      Trade account · wholesale prices
                    </p>
                    <p className="mt-1 text-muted">
                      {business.legalName} · GSTIN {business.gstin}
                    </p>
                  </>
                ) : viewer.email ? (
                  <>
                    <p className="font-semibold uppercase tracking-[0.12em] text-ink">
                      Signed in
                    </p>
                    <p className="mt-1 text-muted">{viewer.email}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold uppercase tracking-[0.12em] text-ink">
                      Guest checkout
                    </p>
                    <p className="mt-1 text-muted">
                      No account needed. Your receipt and private tracking link go to your
                      email.
                    </p>
                  </>
                )}
              </div>
            </div>
            {!viewer.email ? (
              <Link
                href="/login?next=%2Fcheckout"
                className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-clay underline-offset-4 hover:underline"
              >
                Sign in instead
              </Link>
            ) : null}
          </div>

          <section>
            <SectionHeading
              step="01"
              title="Contact"
              note="Order updates are sent by email."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="checkout-name" required className="sm:col-span-2">
                <Input
                  id="checkout-name"
                  name="name"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(event) => setField("fullName", event.target.value)}
                  required
                  maxLength={90}
                />
              </Field>
              <Field label="Email" htmlFor="checkout-email" required>
                <Input
                  id="checkout-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  required
                  maxLength={254}
                />
              </Field>
              <Field
                label="Phone"
                htmlFor="checkout-phone"
                hint="A mobile number for delivery updates."
                required
              >
                <Input
                  id="checkout-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  required
                  maxLength={16}
                />
              </Field>
            </div>
          </section>

          <section>
            <SectionHeading
              step="02"
              title="Shipping address"
              note="Final shipping is quoted after your order."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Address line 1"
                htmlFor="checkout-line1"
                required
                className="sm:col-span-2"
              >
                <Input
                  id="checkout-line1"
                  name="address-line1"
                  autoComplete="address-line1"
                  value={form.addressLine1}
                  onChange={(event) => setField("addressLine1", event.target.value)}
                  required
                  minLength={4}
                  maxLength={180}
                />
              </Field>
              <Field
                label="Address line 2"
                htmlFor="checkout-line2"
                hint="Landmark, apartment or studio name."
                className="sm:col-span-2"
              >
                <Input
                  id="checkout-line2"
                  name="address-line2"
                  autoComplete="address-line2"
                  value={form.addressLine2}
                  onChange={(event) => setField("addressLine2", event.target.value)}
                  maxLength={180}
                />
              </Field>
              <Field label="City" htmlFor="checkout-city" required>
                <Input
                  id="checkout-city"
                  name="city"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(event) => setField("city", event.target.value)}
                  required
                  minLength={2}
                  maxLength={90}
                />
              </Field>
              <Field label="State" htmlFor="checkout-state" required>
                <Select
                  id="checkout-state"
                  name="state"
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={(event) => setField("state", event.target.value)}
                  required
                >
                  <option value="">Choose a state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="PIN code" htmlFor="checkout-pincode" required>
                <Input
                  id="checkout-pincode"
                  name="pincode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={form.pincode}
                  onChange={(event) => setField("pincode", event.target.value)}
                  required
                  pattern="[1-9][0-9]{5}"
                  maxLength={6}
                  placeholder="560038"
                />
              </Field>
              <div className="hidden sm:block" aria-hidden />
            </div>
          </section>

          {business ? (
            <section>
              <SectionHeading
                step="03"
                title="GST invoice"
                note="Billed to the registered business address."
              />
              <div className="mt-5 border border-line bg-cream/70 p-5">
                <p className="flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-sage">
                  <Building2 className="size-3.5" strokeWidth={1.5} />
                  {business.legalName}
                </p>
                {business.tradeName ? (
                  <p className="mt-1 text-xs text-muted">{business.tradeName}</p>
                ) : null}
                <p className="mt-2 font-mono text-xs tracking-wide text-ink-soft">
                  GSTIN {business.gstin}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {business.address.line1}
                  {business.address.line2 ? `, ${business.address.line2}` : ""}
                  <br />
                  {business.address.city}, {business.address.state}{" "}
                  {business.address.pincode}
                  <br />
                  {business.email} · {business.phone}
                </p>
                <p className="mt-3 border-t border-line pt-3 text-[0.62rem] leading-relaxed text-muted">
                  A GST invoice is issued for this order. To change the billing details,
                  update your trade profile before placing the order.
                </p>
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeading step={business ? "04" : "03"} title="A note for Buniya" />
            <div className="mt-5">
              <Field
                label="Order note"
                htmlFor="checkout-note"
                hint="Gift wrapping, delivery instructions or a question about a piece."
              >
                <Textarea
                  id="checkout-note"
                  name="note"
                  value={form.note}
                  onChange={(event) => setField("note", event.target.value)}
                  maxLength={600}
                  placeholder="Optional"
                />
              </Field>
            </div>

            <div className="mt-6 border-t border-line pt-5">
              <Checkbox
                id="checkout-terms"
                name="terms"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                required
                label="I agree to the order, shipping and returns terms, and understand that shipping is quoted separately after payment."
              />
              <p className="mt-2 pl-6 text-xs text-muted">
                Read the full{" "}
                <Link href="/policies" className="link-underline text-ink-soft">
                  policies
                </Link>
                .
              </p>
            </div>
          </section>
        </form>

        <aside className="min-w-0 lg:sticky lg:top-28">
          <div className="border border-line bg-cream">
            <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4">
              <h2 className="font-serif text-2xl font-light tracking-[-0.025em]">
                Order summary
              </h2>
              <span className="text-[0.58rem] uppercase tracking-[0.13em] text-muted">
                {itemCount} {itemCount === 1 ? "piece" : "pieces"}
              </span>
            </div>

            <ul className="max-h-[19rem] divide-y divide-line overflow-y-auto">
              {summaryLines.map((line) => (
                <li key={line.key} className="flex gap-3 px-5 py-4">
                  <div className="relative size-16 shrink-0 overflow-hidden bg-sand">
                    <SafeImage src={line.imageUrl} alt={line.name} sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-ink">{line.name}</p>
                    <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.1em] text-muted">
                      {line.variantLabel} · ×{line.quantity}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-ink-soft">
                      {formatMoney(line.lineTotal)}
                      <span className="text-muted">
                        {" "}
                        · {formatMoney(line.lineTotal / line.quantity)} /{" "}
                        {unitLabel(line.unit, 1)}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-5 py-5">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-soft">
                  Offer code
                </p>
                {couponSummary ? (
                  <div className="mt-2 flex items-center justify-between gap-3 border border-sage/30 bg-sage-light/60 px-3 py-2.5">
                    <p className="min-w-0 text-xs text-sage">
                      <span className="font-semibold tracking-[0.08em]">
                        {couponSummary.code}
                      </span>
                      <span className="ml-2 text-sage/80">
                        − {formatMoney(couponSummary.discountAmount)}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      aria-label={`Remove coupon ${couponSummary.code}`}
                      className="text-sage transition-colors hover:text-ink"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={applyCoupon} className="mt-2 flex">
                    <Input
                      aria-label="Coupon code"
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(event.target.value.toUpperCase());
                        setCouponFieldError(null);
                        setCouponNotice(null);
                      }}
                      placeholder="Enter code"
                      maxLength={32}
                      className="h-10 min-w-0 flex-1 rounded-none border-r-0 uppercase tracking-[0.08em]"
                      disabled={!hydrated}
                    />
                    <button
                      type="submit"
                      disabled={!couponInput.trim() || quoteLoading}
                      className="inline-flex h-10 items-center gap-1.5 border border-line bg-ink px-4 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-cream transition-colors hover:bg-clay-deep disabled:opacity-45"
                    >
                      <Tag className="size-3" />
                      Apply
                    </button>
                  </form>
                )}
                {couponMessage ? (
                  <p className="mt-2 text-xs leading-relaxed text-red-800">{couponMessage}</p>
                ) : couponSummary ? (
                  <p className="mt-2 text-[0.6rem] uppercase tracking-[0.1em] text-sage">
                    {couponSummary.label ?? "Offer applied"}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 border-t border-line pt-4">
                {quote ? (
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted">Subtotal</dt>
                      <dd className="tabular-nums">{formatMoney(quote.subtotal)}</dd>
                    </div>
                    {quote.discountAmount > 0 ? (
                      <div className="flex items-center justify-between gap-4 text-sage">
                        <dt>
                          Discount
                          {quote.coupon ? ` · ${quote.coupon.code}` : ""}
                        </dt>
                        <dd className="tabular-nums">
                          − {formatMoney(quote.discountAmount)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Shipping</dt>
                      <dd className="text-right text-xs leading-relaxed text-muted">
                        Quoted after your order
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs text-muted">
                      <dt>GST included ({settings.gstRate}%)</dt>
                      <dd className="tabular-nums">{formatMoney(quote.taxAmount)}</dd>
                    </div>
                  </dl>
                ) : (
                  <div className="space-y-2.5" aria-hidden>
                    <div className="h-4 w-3/4 animate-pulse bg-line/50" />
                    <div className="h-4 w-2/3 animate-pulse bg-line/50" />
                    <div className="h-4 w-1/2 animate-pulse bg-line/50" />
                  </div>
                )}

                <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
                  <span className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-soft">
                    Products total
                  </span>
                  {quote ? (
                    <span className="font-serif text-2xl font-light tabular-nums">
                      {formatMoney(quote.totalAmount)}
                    </span>
                  ) : (
                    <span
                      className="inline-block h-7 w-24 animate-pulse bg-line/60"
                      aria-label="Calculating total"
                    />
                  )}
                </div>
                <p className="mt-1 text-right text-[0.58rem] uppercase tracking-[0.1em] text-muted">
                  Inclusive of all taxes
                </p>
              </div>

              {quoteLoading ? (
                <p className="mt-4 flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.12em] text-muted" role="status">
                  <Loader2 className="size-3 animate-spin" />
                  Verifying prices and stock
                </p>
              ) : null}

              {quoteError ? (
                <div className="mt-4 space-y-2">
                  <FormMessage message={quoteError} />
                  <Link
                    href="/cart"
                    className="inline-flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.13em] text-clay"
                  >
                    <ArrowLeft className="size-3" />
                    Review your bag
                  </Link>
                </div>
              ) : null}

              {!paymentsReady ? (
                <div className="mt-4 border border-clay/25 bg-clay/5 p-3.5">
                  <p className="flex items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.13em] text-clay">
                    <Info className="size-3.5" />
                    Payment setup needed
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                    Add your Supabase service role key and Razorpay test keys to{" "}
                    <code className="font-mono text-[0.68rem]">.env.local</code> to take
                    payments. You can review the checkout until then.
                  </p>
                </div>
              ) : null}

              {submitError ? (
                <div className="mt-4">
                  <FormMessage message={submitError} />
                  {recoveryToken ? (
                    <Link
                      href={`/order/${recoveryToken}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.13em] text-clay"
                    >
                      Open your order page
                      <ArrowRight className="size-3" />
                    </Link>
                  ) : null}
                </div>
              ) : null}

              <Button
                type="submit"
                form="checkout-form"
                size="lg"
                disabled={!canPay}
                className="mt-5 w-full"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}
                {payLabel}
              </Button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.58rem] uppercase tracking-[0.11em] text-muted">
                <ShieldCheck className="size-3" />
                Secured by Razorpay · UPI, cards & netbanking
              </p>

              <div className="mt-5 space-y-2.5 border-t border-line pt-4 text-[0.68rem] leading-relaxed text-muted">
                <p className="flex items-start gap-2">
                  <Truck className="mt-0.5 size-3.5 shrink-0 text-clay" strokeWidth={1.5} />
                  Shipping is arranged manually and quoted after payment. We email a secure
                  Razorpay link before dispatch.
                </p>
                <p className="flex items-start gap-2">
                  <Mail className="mt-0.5 size-3.5 shrink-0 text-clay" strokeWidth={1.5} />
                  A receipt and private tracking link are sent to your email.
                </p>
                {business ? (
                  <p className="flex items-start gap-2 text-sage">
                    <Check className="mt-0.5 size-3.5 shrink-0" />
                    GST invoice · trade minimums applied
                  </p>
                ) : null}
              </div>

              <p className="mt-4 text-center text-[0.58rem] uppercase tracking-[0.11em] text-muted">
                Questions?{" "}
                <a
                  href={`mailto:${settings.supportEmail}`}
                  className="underline-offset-4 hover:underline"
                >
                  {settings.supportEmail}
                </a>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
