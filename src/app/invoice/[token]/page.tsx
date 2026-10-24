import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByToken } from "@/lib/data/account";
import { getSiteSettings } from "@/lib/data/content";
import { InvoiceDocument } from "@/components/orders/invoice-document";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [order, settings] = await Promise.all([
    getOrderByToken(token),
    getSiteSettings(),
  ]);

  if (!order || !order.invoice_number) notFound();

  return (
    <InvoiceDocument
      order={order}
      items={order.items}
      settings={settings}
      backHref={`/order/${token}`}
    />
  );
}
