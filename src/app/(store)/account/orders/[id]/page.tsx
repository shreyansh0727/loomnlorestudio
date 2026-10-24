import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { getMyOrder } from "@/lib/data/account";
import { getSiteSettings } from "@/lib/data/content";
import { OrderDetailView } from "@/components/orders/order-detail-view";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer(`/account/orders/${id}`);
  const user = viewer.user;
  if (!user) return null;

  const [order, settings] = await Promise.all([
    getMyOrder(id, user.id),
    getSiteSettings(),
  ]);

  if (!order) notFound();

  return (
    <OrderDetailView
      order={order}
      backHref="/account/orders"
      backLabel="All orders"
      supportEmail={settings.supportEmail}
    />
  );
}
