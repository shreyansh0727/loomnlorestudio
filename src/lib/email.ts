import "server-only";

import { Resend } from "resend";
import type { Order, OrderStatus, SiteSettings } from "@/lib/types";
import type { OrderWithDetails } from "@/lib/data/account";
import { ORDER_STATUS_DESCRIPTIONS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { getSiteSettings } from "@/lib/data/content";
import { getSupabaseAdminClientSafe } from "@/lib/supabase/admin";
import {
  absoluteUrl,
  escapeHtml,
  formatDate,
  formatMoney,
} from "@/lib/utils";

const INK = "#1b1916";
const CLAY = "#a4543a";
const CREAM = "#f7f2e8";
const LINE = "#ddd4c6";
const MUTED = "#6f675d";
const SAGE = "#5f6f5a";

function emailCredentials() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

async function logEmail({
  orderId,
  recipient,
  template,
  subject,
  status,
  providerId,
  error,
}: {
  orderId: string | null;
  recipient: string;
  template: string;
  subject: string;
  status: "sent" | "skipped" | "failed";
  providerId?: string | null;
  error?: string | null;
}) {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return;
  await admin.from("email_logs").insert({
    order_id: orderId,
    recipient,
    template,
    subject,
    status,
    provider_id: providerId ?? null,
    error: error ?? null,
  });
}

async function sendEmail({
  to,
  subject,
  html,
  template,
  orderId,
}: {
  to: string;
  subject: string;
  html: string;
  template: string;
  orderId: string;
}) {
  const credentials = emailCredentials();

  if (!credentials) {
    await logEmail({
      orderId,
      recipient: to,
      template,
      subject,
      status: "skipped",
      error: "RESEND_API_KEY or RESEND_FROM_EMAIL is not configured.",
    });
    return { status: "skipped" as const };
  }

  const resend = new Resend(credentials.apiKey);
  const { data, error } = await resend.emails.send({
    from: credentials.from,
    to,
    subject,
    html,
  });

  if (error) {
    await logEmail({
      orderId,
      recipient: to,
      template,
      subject,
      status: "failed",
      error: error.message,
    });
    return { status: "failed" as const, message: error.message };
  }

  await logEmail({
    orderId,
    recipient: to,
    template,
    subject,
    status: "sent",
    providerId: data?.id,
  });
  return { status: "sent" as const, id: data?.id };
}

async function loadOrderWithItems(orderId: string) {
  const admin = getSupabaseAdminClientSafe();
  if (!admin) return null;

  const { data, error } = await admin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) return null;
  const order = data as unknown as OrderWithDetails;
  order.items = [...(order.items ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  return order;
}

function orderAddressLines(order: Order) {
  const address = order.shipping_address;
  return [
    address.full_name,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.pincode}`,
    address.country,
  ].filter((value): value is string => Boolean(value));
}

function layout({
  settings,
  eyebrow,
  heading,
  intro,
  content,
}: {
  settings: SiteSettings;
  eyebrow: string;
  heading: string;
  intro: string;
  content: string;
}) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:${CREAM};color:${INK};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fffdf8;border:1px solid ${LINE};">
            <tr>
              <td style="padding:26px 32px;border-bottom:1px solid ${LINE};">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:-0.02em;">${escapeHtml(
                  settings.brandName,
                )}</div>
                <div style="margin-top:6px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};">${escapeHtml(
                  settings.brandTagline,
                )}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <div style="font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${CLAY};">${escapeHtml(
                  eyebrow,
                )}</div>
                <h1 style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.12;font-weight:400;letter-spacing:-0.03em;color:${INK};">${escapeHtml(
                  heading,
                )}</h1>
                <p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:${MUTED};">${intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 32px;">${content}</td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${LINE};font-size:11px;line-height:1.7;color:${MUTED};">
                ${escapeHtml(settings.sellerLegalName)}${
                  settings.sellerGstin ? ` · GSTIN ${escapeHtml(settings.sellerGstin)}` : ""
                }<br />
                Questions? Write to <a href="mailto:${escapeHtml(
                  settings.supportEmail,
                )}" style="color:${CLAY};text-decoration:none;">${escapeHtml(
                  settings.supportEmail,
                )}</a><br />
                <span style="color:#9a9185;">This message was sent about a Loom &amp; Lore order. Please keep your private order link to yourself.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(label: string, href: string) {
  return `<a href="${escapeHtml(
    href,
  )}" style="display:inline-block;margin-top:22px;padding:13px 24px;border-radius:999px;background:${INK};color:${CREAM};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;">${escapeHtml(
    label,
  )}</a>`;
}

function orderItemsTable(order: OrderWithDetails) {
  const rows = order.items
    .map((item) => {
      const meta = [item.variant_label, item.sku].filter(Boolean).join(" · ");
      const components = item.metadata?.components?.length
        ? `<div style="margin-top:5px;font-size:11px;line-height:1.6;color:#9a9185;">${item.metadata.components
            .map(
              (component) =>
                `${escapeHtml(component.product_name)} · ${escapeHtml(
                  component.variant_label,
                )} × ${component.quantity}`,
            )
            .join("<br />")}</div>`
        : "";
      return `<tr>
        <td style="padding:13px 0;border-bottom:1px solid ${LINE};font-size:13px;line-height:1.5;">
          <div style="font-family:Georgia,'Times New Roman',serif;color:${INK};">${escapeHtml(
            item.name,
          )}</div>
          ${meta ? `<div style="margin-top:3px;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">${escapeHtml(meta)}</div>` : ""}
          ${components}
        </td>
        <td style="padding:13px 0;border-bottom:1px solid ${LINE};font-size:12px;text-align:center;color:${MUTED};white-space:nowrap;">× ${
          item.quantity
        }</td>
        <td style="padding:13px 0;border-bottom:1px solid ${LINE};font-family:Georgia,'Times New Roman',serif;font-size:14px;text-align:right;white-space:nowrap;">${formatMoney(
          item.line_total,
        )}</td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    ${rows}
  </table>`;
}

function orderTotals(order: Order) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;font-size:13px;color:${MUTED};">
    <tr>
      <td style="padding:4px 0;">Subtotal</td>
      <td style="padding:4px 0;text-align:right;">${formatMoney(order.subtotal)}</td>
    </tr>
    ${
      order.discount_amount > 0
        ? `<tr>
            <td style="padding:4px 0;color:${SAGE};">Discount${
              order.coupon_code ? ` · ${escapeHtml(order.coupon_code)}` : ""
            }</td>
            <td style="padding:4px 0;text-align:right;color:${SAGE};">− ${formatMoney(
              order.discount_amount,
            )}</td>
          </tr>`
        : ""
    }
    <tr>
      <td style="padding:4px 0;">Shipping</td>
      <td style="padding:4px 0;text-align:right;">Quoted separately</td>
    </tr>
    <tr>
      <td style="padding:14px 0 0;border-top:1px solid ${LINE};font-size:14px;color:${INK};">Total paid</td>
      <td style="padding:14px 0 0;border-top:1px solid ${LINE};font-family:Georgia,'Times New Roman',serif;font-size:18px;text-align:right;color:${INK};">${formatMoney(
        order.total_amount,
      )}</td>
    </tr>
  </table>
  <p style="margin:12px 0 0;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Inclusive of all taxes · ${formatMoney(
    order.tax_amount,
  )} GST component</p>`;
}

function shippingCard(order: Order) {
  return `<div style="margin-top:26px;padding:18px;background:${CREAM};border:1px solid ${LINE};">
    <div style="font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Shipping to</div>
    <div style="margin-top:8px;font-size:13px;line-height:1.7;color:${INK};">${orderAddressLines(
      order,
    )
      .map(escapeHtml)
      .join("<br />")}</div>
    ${
      order.business_gstin
        ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid ${LINE};font-size:11px;line-height:1.6;color:${MUTED};">GST invoice: ${escapeHtml(
            order.business_legal_name ?? "",
          )} · ${escapeHtml(order.business_gstin)}</div>`
        : `<div style="margin-top:10px;padding-top:10px;border-top:1px solid ${LINE};font-size:11px;color:${MUTED};">Retail invoice</div>`
    }
  </div>`;
}

export async function sendOrderConfirmationEmail(orderId: string) {
  const [order, settings] = await Promise.all([
    loadOrderWithItems(orderId),
    getSiteSettings(),
  ]);
  if (!order) return { status: "skipped" as const };

  const subject = `Order ${order.order_number} confirmed · ${settings.brandName}`;
  const content = `
    ${orderItemsTable(order)}
    ${orderTotals(order)}
    ${shippingCard(order)}
    <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:${MUTED};">
      Your order is being prepared by hand. Shipping is quoted separately because every parcel is packed and measured by the studio — we will email a secure Razorpay payment link before dispatch. You can follow every update on your private order page.
    </p>
    ${button("View your order", absoluteUrl(`/order/${order.access_token}`))}
    ${
      order.invoice_number
        ? `<p style="margin:14px 0 0;font-size:12px;line-height:1.7;"><a href="${escapeHtml(
            absoluteUrl(`/invoice/${order.access_token}`),
          )}" style="color:${INK};text-decoration:underline;text-underline-offset:3px;">View invoice ${escapeHtml(
            order.invoice_number,
          )}</a></p>`
        : ""
    }
    <p style="margin:18px 0 0;font-size:11px;line-height:1.7;color:#9a9185;">Placed ${formatDate(
      order.created_at,
    )}${order.invoice_number ? ` · Invoice ${escapeHtml(order.invoice_number)}` : ""}</p>
  `;

  return sendEmail({
    to: order.email,
    subject,
    html: layout({
      settings,
      eyebrow: "Payment received",
      heading: "Your order is confirmed.",
      intro: `Thank you, ${escapeHtml(
        order.customer_name.split(" ")[0] || "friend",
      )}. We have your pieces in hand and will write again as they move through the studio.`,
      content,
    }),
    template: "order_confirmation",
    orderId: order.id,
  });
}

export async function sendOrderStatusEmail(orderId: string, status: OrderStatus) {
  const [order, settings] = await Promise.all([
    loadOrderWithItems(orderId),
    getSiteSettings(),
  ]);
  if (!order) return { status: "skipped" as const };

  const subject = `${ORDER_STATUS_LABELS[status]} · Order ${order.order_number}`;
  const tracking =
    order.tracking_number || order.tracking_url
      ? `<div style="margin-top:24px;padding:18px;background:${CREAM};border:1px solid ${LINE};">
          <div style="font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Tracking</div>
          ${order.shipping_carrier ? `<div style="margin-top:8px;font-size:13px;color:${INK};">${escapeHtml(order.shipping_carrier)}</div>` : ""}
          ${order.tracking_number ? `<div style="margin-top:4px;font-size:14px;color:${INK};">${escapeHtml(order.tracking_number)}</div>` : ""}
          ${
            order.tracking_url
              ? `<div style="margin-top:12px;">${button("Track your parcel", order.tracking_url)}</div>`
              : ""
          }
        </div>`
      : "";

  const intro = ORDER_STATUS_DESCRIPTIONS[status];
  const content = `
    <div style="padding:18px;border:1px solid ${LINE};background:${CREAM};">
      <div style="font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${CLAY};">${escapeHtml(
        ORDER_STATUS_LABELS[status],
      )}</div>
      <div style="margin-top:8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:${INK};">${escapeHtml(
        intro,
      )}</div>
    </div>
    ${tracking}
    <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:${MUTED};">Order ${escapeHtml(
      order.order_number,
    )} · ${order.items.length} ${order.items.length === 1 ? "line" : "lines"} · ${formatMoney(
      order.total_amount,
    )}</p>
    ${button("View your order", absoluteUrl(`/order/${order.access_token}`))}
  `;

  return sendEmail({
    to: order.email,
    subject,
    html: layout({
      settings,
      eyebrow: "Order update",
      heading: ORDER_STATUS_LABELS[status],
      intro: `A note from the studio about order ${escapeHtml(order.order_number)}.`,
      content,
    }),
    template: `order_status_${status}`,
    orderId: order.id,
  });
}

export async function sendShippingPaymentEmail({
  orderId,
  amount,
  paymentUrl,
}: {
  orderId: string;
  amount: number;
  paymentUrl: string;
}) {
  const [order, settings] = await Promise.all([
    loadOrderWithItems(orderId),
    getSiteSettings(),
  ]);
  if (!order) return { status: "skipped" as const };

  const subject = `Shipping for order ${order.order_number} · secure payment link`;
  const content = `
    <p style="margin:0;font-size:14px;line-height:1.7;color:${MUTED};">
      Your pieces are packed and ready to leave the studio. The shipping charge for order <strong style="color:${INK};">${escapeHtml(
        order.order_number,
      )}</strong> is:
    </p>
    <div style="margin-top:18px;padding:20px;background:${CREAM};border:1px solid ${LINE};font-family:Georgia,'Times New Roman',serif;font-size:30px;color:${INK};">${formatMoney(
      amount,
    )}</div>
    <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:${MUTED};">Pay securely through Razorpay using UPI, cards or netbanking. The link is unique to this order; we will dispatch as soon as it is paid.</p>
    ${button("Pay shipping", paymentUrl)}
    <p style="margin:18px 0 0;font-size:11px;line-height:1.7;color:#9a9185;">You can also pay from your private order page: ${escapeHtml(
      absoluteUrl(`/order/${order.access_token}`),
    )}</p>
  `;

  return sendEmail({
    to: order.email,
    subject,
    html: layout({
      settings,
      eyebrow: "Ready to dispatch",
      heading: "One last step before we send it.",
      intro: `Hello ${escapeHtml(
        order.customer_name.split(" ")[0] || "there",
      )}, your order is packed and waiting for its shipping payment.`,
      content,
    }),
    template: "shipping_payment_request",
    orderId: order.id,
  });
}
