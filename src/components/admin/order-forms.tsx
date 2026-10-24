"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Copy, Loader2, Mail, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  addOrderNoteAction,
  createShippingLinkAction,
  resendOrderEmailAction,
  resolvePaymentReviewAction,
  updateOrderStatusAction,
  updateOrderTrackingAction,
} from "@/lib/actions/admin/orders";
import { ADMIN_STATUS_OPTIONS, ORDER_STATUS_DESCRIPTIONS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { INITIAL_FORM_STATE } from "@/lib/form-state";
import type { Order, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Checkbox,
  Field,
  FormMessage,
  Input,
  Select,
  Textarea,
} from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function OrderStatusForm({
  orderId,
  currentStatus,
  amountPaid,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  amountPaid: number;
}) {
  const [state, formAction] = useActionState(updateOrderStatusAction, INITIAL_FORM_STATE);
  const [status, setStatus] = useState<OrderStatus>(
    ADMIN_STATUS_OPTIONS.includes(currentStatus) ? currentStatus : "confirmed",
  );

  const options = ADMIN_STATUS_OPTIONS.includes(currentStatus)
    ? ADMIN_STATUS_OPTIONS
    : [currentStatus, ...ADMIN_STATUS_OPTIONS];

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />

      <Field label="Set status" htmlFor="status">
        <Select
          id="status"
          name="status"
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {ORDER_STATUS_LABELS[option]}
            </option>
          ))}
        </Select>
      </Field>
      <p className="-mt-2 text-xs leading-relaxed text-muted">
        {ORDER_STATUS_DESCRIPTIONS[status]}
      </p>

      {status === "refunded" ? (
        <div className="grid gap-3 border border-clay/25 bg-clay/5 p-3 sm:grid-cols-2">
          <Field label="Refund amount (₹)" htmlFor="refundAmount">
            <Input
              id="refundAmount"
              name="refundAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={(amountPaid / 100).toFixed(2)}
            />
          </Field>
          <Field label="Reference" htmlFor="refundReference" hint="Optional">
            <Input
              id="refundReference"
              name="refundReference"
              placeholder="Razorpay refund ID"
            />
          </Field>
          <p className="text-[0.68rem] leading-relaxed text-clay-deep sm:col-span-2">
            Recording a refund returns reserved stock if it hasn&apos;t been restored
            already. Issue the actual refund in Razorpay separately.
          </p>
        </div>
      ) : null}

      <Field label="Internal note" htmlFor="statusNote" hint="Optional — stored on the order.">
        <Textarea
          id="statusNote"
          name="note"
          rows={3}
          maxLength={500}
          placeholder="e.g. Packed with the indigo runner; courier pickup booked."
        />
      </Field>

      <Checkbox
        name="notify"
        defaultChecked
        label="Email the customer about this status change"
      />

      {state.status !== "idle" ? (
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <SubmitButton size="sm" className="w-full" pendingLabel="Updating">
        Update order
      </SubmitButton>
    </form>
  );
}

export function ResolvePaymentReviewForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useActionState(
    resolvePaymentReviewAction,
    INITIAL_FORM_STATE,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-[0.72rem] leading-relaxed text-clay-deep">
        Payment was captured but stock was short, so no stock was reserved and no
        invoice was issued. Replenish the variants listed in the internal notes,
        then allocate stock and issue the invoice.
      </p>

      {state.status === "error" ? (
        <FormMessage message={state.message} tone="error" />
      ) : null}

      <SubmitButton size="sm" className="w-full" pendingLabel="Allocating">
        Allocate stock &amp; issue invoice
      </SubmitButton>
    </form>
  );
}

export function OrderTrackingForm({ order }: { order: Order }) {
  const [state, formAction] = useActionState(updateOrderTrackingAction, INITIAL_FORM_STATE);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="orderId" value={order.id} />
      <div className="grid gap-3">
        <Field label="Carrier" htmlFor="carrier">
          <Input
            id="carrier"
            name="carrier"
            defaultValue={order.shipping_carrier ?? ""}
            placeholder="Delhivery, Bluedart, India Post…"
          />
        </Field>
        <Field label="Tracking number" htmlFor="trackingNumber">
          <Input
            id="trackingNumber"
            name="trackingNumber"
            defaultValue={order.tracking_number ?? ""}
            placeholder="AWB / consignment number"
          />
        </Field>
        <Field
          label="Tracking link"
          htmlFor="trackingUrl"
          hint="Shown to the customer on their order page."
        >
          <Input
            id="trackingUrl"
            name="trackingUrl"
            type="url"
            defaultValue={order.tracking_url ?? ""}
            placeholder="https://…"
          />
        </Field>
      </div>

      {order.tracking_url ? (
        <a
          href={order.tracking_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-clay-deep hover:text-ink"
        >
          <Truck className="size-3.5" aria-hidden />
          Open current tracking
        </a>
      ) : null}

      {state.status !== "idle" ? (
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <SubmitButton size="sm" className="w-full" pendingLabel="Saving">
        Save tracking
      </SubmitButton>
    </form>
  );
}

export function ShippingLinkForm({
  orderId,
  suggestedAmount,
}: {
  orderId: string;
  suggestedAmount: number;
}) {
  const [state, formAction] = useActionState(createShippingLinkAction, INITIAL_FORM_STATE);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Field label="Shipping charge (₹)" htmlFor="shippingAmount">
        <Input
          id="shippingAmount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={suggestedAmount > 0 ? (suggestedAmount / 100).toFixed(2) : ""}
          placeholder="e.g. 450"
          required
        />
      </Field>
      <p className="text-[0.68rem] leading-relaxed text-muted">
        Creates a Razorpay payment link, adds the charge to the order total and
        emails it to the customer. The order is ready to dispatch once paid.
      </p>

      {state.status !== "idle" ? (
        <FormMessage
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <SubmitButton size="sm" className="w-full" pendingLabel="Creating link">
        Create and email link
      </SubmitButton>
    </form>
  );
}

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(addOrderNoteAction, INITIAL_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      toast.success(state.message ?? "Note added.");
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Field label="Add an internal note" htmlFor="internalNote">
        <Textarea
          id="internalNote"
          name="note"
          rows={3}
          maxLength={1200}
          placeholder="Only the studio team can see this."
          required
        />
      </Field>
      {state.status === "error" ? (
        <FormMessage message={state.message} tone="error" />
      ) : null}
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
        {pending ? "Adding note" : "Add note"}
      </Button>
    </form>
  );
}

export function ResendEmailButtons({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(
    resendOrderEmailAction,
    INITIAL_FORM_STATE,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <button
        type="submit"
        name="template"
        value="confirmation"
        disabled={pending}
        className="inline-flex items-center gap-1.5 border border-line px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
      >
        <Mail className="size-3.5" aria-hidden />
        Confirmation
      </button>
      <button
        type="submit"
        name="template"
        value="status"
        disabled={pending}
        className="inline-flex items-center gap-1.5 border border-line px-3 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Mail className="size-3.5" aria-hidden />
        )}
        Status email
      </button>
    </form>
  );
}

export function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 border border-line px-2.5 text-[0.6rem]"
      onClick={() => {
        void navigator.clipboard
          .writeText(value)
          .then(() => toast.success("Link copied."))
          .catch(() => toast.error("Could not copy the link."));
      }}
    >
      <Copy className="size-3.5" aria-hidden />
      {label}
    </Button>
  );
}
